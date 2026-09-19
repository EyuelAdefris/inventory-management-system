import { z } from "zod";

export const purchaseItemSchema = z.object({
  productId: z.string().uuid("Invalid product ID format"),
  quantity: z.number().int().positive("Quantity must be greater than 0"),
  unitPrice: z.number().positive("Unit price must be greater than 0"),
});

export const createPurchaseSchema = z.object({
  supplierId: z.string().uuid("Invalid supplier ID format"),
  items: z.array(purchaseItemSchema).min(1, "At least one item is required"),
});

export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;
