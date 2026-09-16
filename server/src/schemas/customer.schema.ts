import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().min(2, "Customer name must be at least 2 characters"),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export type CustomerInput = z.infer<typeof customerSchema>;
