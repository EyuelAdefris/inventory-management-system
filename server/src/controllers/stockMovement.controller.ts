import { Request, Response } from "express";
import prisma from "../lib/prisma";

export const getStockMovements = async (_req: Request, res: Response): Promise<any> => {
  try {
    const movements = await prisma.stockAdjustment.findMany({
      include: {
        product: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json(movements);
  } catch (error) {
    console.error("Get stock movements error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return res.status(400).json({
      error: errorMessage,
      message: errorMessage,
    });
  }
};

export const adjustStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId, quantityDelta, reason, notes } = req.body;

    if (!productId || quantityDelta === undefined || !reason) {
      res.status(400).json({
        error: "productId, quantityDelta, and reason are required fields",
        message: "productId, quantityDelta, and reason are required fields",
      });
      return;
    }

    if (typeof quantityDelta !== "number" || quantityDelta === 0) {
      res.status(400).json({
        error: "quantityDelta must be a non-zero number",
        message: "quantityDelta must be a non-zero number",
      });
      return;
    }

    const userId = req.user?.userId || (await prisma.user.findFirst())?.id || "";

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new Error(`Product with ID ${productId} not found`);
      }

      const currentStock = (product as any).stockQuantity ?? (product as any).stock ?? 0;
      const newStock = currentStock + quantityDelta;
      if (newStock < 0) {
        throw new Error(
          `Cannot adjust stock below 0. Current: ${currentStock}, Adjustment: ${quantityDelta}`
        );
      }

      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { stockQuantity: newStock },
      });

      const cleanNotes =
        notes && notes.trim() !== ""
          ? notes.trim()
          : `Manual inventory adjustment (${reason})`;

      let movement: any;
      if ("stockMovement" in tx && typeof (tx as any).stockMovement?.create === "function") {
        movement = await (tx as any).stockMovement.create({
          data: {
            productId,
            quantity: quantityDelta,
            type: "ADJUSTMENT",
            reason,
            notes: cleanNotes,
          },
        });
      } else {
        movement = await (tx as any).stockAdjustment.create({
          data: {
            productId,
            quantityChange: quantityDelta,
            reason,
            notes: cleanNotes,
            userId,
          },
        });
      }

      const formattedDelta = quantityDelta > 0 ? `+${quantityDelta}` : `${quantityDelta}`;
      await tx.notification.create({
        data: {
          title: "Stock Adjusted",
          message: `Stock Adjusted: ${formattedDelta} units (${product.name})`,
          type: newStock <= product.minStockLevel ? "STOCK_LOW" : "PRODUCT_UPDATE",
        },
      });

      if (newStock <= product.minStockLevel) {
        await tx.notification.create({
          data: {
            title: "Low Stock Alert",
            message: `Low stock alert for "${product.name}" (${newStock} remaining)`,
            type: "STOCK_LOW",
          },
        });
      }

      return { updatedProduct, movement };
    });

    res.status(200).json({
      message: "Stock adjusted successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("Stock adjustment error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to adjust stock";
    res.status(400).json({
      error: errorMessage,
      message: errorMessage,
    });
  }
};
