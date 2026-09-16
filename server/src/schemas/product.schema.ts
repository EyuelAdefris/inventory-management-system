import { z } from "zod";

const baseProductSchema = z.object({
  sku: z.string().min(3, "SKU must be at least 3 characters"),
  name: z.string().min(2, "Product name must be at least 2 characters"),
  description: z.string().optional(),
  price: z.number().positive("Price must be a positive number").optional(),
  sellingPrice: z.number().positive("Selling price must be a positive number").optional(),
  costPrice: z.number().positive("Cost price must be a positive number"),
  quantity: z.number().int().nonnegative("Quantity must be a non-negative integer").optional(),
  stockQuantity: z.number().int().nonnegative("Stock quantity must be a non-negative integer").optional(),
  minStock: z.number().int().nonnegative("Min stock must be a non-negative integer").optional(),
  minStockLevel: z.number().int().nonnegative("Min stock level must be a non-negative integer").optional(),
  categoryId: z.string().uuid("Invalid category ID format"),
  supplierId: z.string().uuid("Invalid supplier ID format"),
});

export const createProductSchema = baseProductSchema.refine(
  (data) => data.price !== undefined || data.sellingPrice !== undefined,
  {
    message: "Price (or sellingPrice) is required",
    path: ["price"],
  }
);

export const updateProductSchema = baseProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
