import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { createSaleSchema } from "../schemas/sale.schema";

export const getSales = async (req: Request, res: Response): Promise<any> => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const sales = await prisma.sale.findMany({
      take: limit && !isNaN(limit) ? limit : undefined,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        items: {
          include: {
            product: {
              include: {
                supplier: true,
              },
            },
          },
        },
        customer: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json(sales);
  } catch (error) {
    console.error("Get sales error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return res.status(400).json({
      error: errorMessage,
      message: errorMessage,
    });
  }
};

export const getSaleById = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        items: {
          include: {
            product: {
              include: {
                supplier: true,
              },
            },
          },
        },
        customer: true,
      },
    });

    if (!sale) {
      return res.status(404).json({ error: "Sale not found", message: "Sale not found" });
    }

    return res.status(200).json(sale);
  } catch (error) {
    console.error("Get sale by ID error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return res.status(400).json({
      error: errorMessage,
      message: errorMessage,
    });
  }
};

export const createSale = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized", message: "Unauthorized" });
    }

    const parseResult = createSaleSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Invalid input data",
        message: "Invalid input data",
        errors: parseResult.error.flatten().fieldErrors,
      });
    }

    const { customerId, items } = parseResult.data;

    // Verify customer if provided
    if (customerId) {
      const customerExists = await prisma.customer.findUnique({
        where: { id: customerId },
      });
      if (!customerExists) {
        return res.status(400).json({ error: "Customer not found", message: "Customer not found" });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Check stock availability for all items
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new Error(`Product not found with ID: ${item.productId}`);
        }

        if (product.stockQuantity < item.quantity) {
          throw new Error(
            `Requested quantity exceeds available stock for product "${product.name}". Available: ${product.stockQuantity}, Requested: ${item.quantity}`
          );
        }
      }

      // 2. Compute total amount
      const totalAmount = items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      );

      // 3. Create Sale and SaleItems
      const sale = await tx.sale.create({
        data: {
          userId: userId || null,
          customerId: customerId || null,
          totalAmount,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.quantity * item.unitPrice,
            })),
          },
        },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
          items: {
            include: {
              product: {
                include: {
                  supplier: true,
                },
              },
            },
          },
          customer: true,
        },
      });

      // 4. Update Product stock & Create StockAdjustment for each item
      for (const item of items) {
        const updatedProduct = await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              decrement: item.quantity,
            },
          },
        });

        await (tx as any).stockAdjustment.create({
          data: {
            productId: item.productId,
            quantityChange: -item.quantity,
            reason: "Sale",
            notes: `Customer Transaction (Sale ID: ${sale.id})`,
            userId,
          },
        });

        // Check if stock fell to or below minStockLevel
        if (updatedProduct.stockQuantity <= updatedProduct.minStockLevel) {
          await tx.notification.create({
            data: {
              title: "Low Stock Alert",
              message: `Low stock alert for "${updatedProduct.name}" (${updatedProduct.stockQuantity} remaining)`,
              type: "STOCK_LOW",
            },
          });
        }
      }

      // Create Sale Notification
      await tx.notification.create({
        data: {
          title: "New Sale Processed",
          message: `New Sale Processed - $${totalAmount.toFixed(2)}`,
          type: "SALE",
        },
      });

      return sale;
    });

    return res.status(201).json(result);
  } catch (error: any) {
    console.error("Create sale error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Failed to process sale";

    return res.status(400).setHeader("Content-Type", "application/json").json({
      error: errorMessage,
      message: errorMessage,
    });
  }
};
