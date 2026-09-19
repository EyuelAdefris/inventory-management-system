import { z } from "zod";

export const createUserSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be at most 50 characters")
    .regex(/^[a-zA-Z0-9._-]+$/, "Username can only contain alphanumeric characters, underscores, hyphens, or dots"),
  name: z.string().min(1, "Name is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "STAFF"]),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
});

export const updateRoleSchema = z.object({
  role: z.enum(["ADMIN", "STAFF"], {
    errorMap: () => ({ message: "Role must be either ADMIN or STAFF" }),
  }),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
