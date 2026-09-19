import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { createPurchaseSchema } from "../schemas/purchase.schema";

export const getPurchases = async (_req: Request, res: Response): Promise<any> => {
  try {
    const purchases = await prisma.purchase.findMany({
      include: {
        items: {
          include: {
            product: true,
          },
        },
        supplier: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json(purchases);
  } catch (error) {
    console.error("Get purchases error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return res.status(400).json({
      error: errorMessage,
      message: errorMessage,
    });
  }
};

export const createPurchase = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized", message: "Unauthorized" });
    }

    const parseResult = createPurchaseSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Invalid input data",
        message: "Invalid input data",
        errors: parseResult.error.flatten().fieldErrors,
      });
    }

    const { supplierId, items } = parseResult.data;

    // Verify supplier exists
    const supplierExists = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });
    if (!supplierExists) {
      return res.status(400).json({ error: "Supplier not found", message: "Supplier not found" });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify all products exist
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new Error(`Product not found with ID: ${item.productId}`);
        }
      }

      // 2. Compute total amount
      const totalAmount = items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      );

      // 3. Create Purchase and PurchaseItems
      const purchase = await tx.purchase.create({
        data: {
          supplierId,
          totalAmount,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitCost: item.unitPrice,
              total: item.quantity * item.unitPrice,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          supplier: true,
        },
      });

      // 4. Increment Product stock & Create StockAdjustment for each item
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              increment: item.quantity,
            },
          },
        });

        await tx.stockAdjustment.create({
          data: {
            productId: item.productId,
            quantityChange: item.quantity,
            reason: `PURCHASE (Purchase ID: ${purchase.id})`,
            userId,
          },
        });
      }

      return purchase;
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error("Create purchase error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return res.status(400).json({
      error: errorMessage,
      message: errorMessage,
    });
  }
};
