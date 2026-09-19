import { z } from "zod";

export const saleItemSchema = z.object({
  productId: z.string().uuid("Invalid product ID format"),
  quantity: z.number().int().positive("Quantity must be greater than 0"),
  unitPrice: z.number().positive("Unit price must be greater than 0"),
});

export const createSaleSchema = z.object({
  customerId: z.string().uuid("Invalid customer ID format").optional().nullable(),
  paymentMethod: z.enum(["CASH", "CARD", "TRANSFER"]).optional().default("CASH"),
  items: z.array(saleItemSchema).min(1, "At least one item is required"),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
