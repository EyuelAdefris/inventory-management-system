import { Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../lib/prisma";
import { createUserSchema, updateRoleSchema, resetPasswordSchema } from "../schemas/user.schema";

export const getAllUsers = async (_req: Request, res: Response): Promise<any> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            sales: true,
            stockAdjustments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json(users);
  } catch (error) {
    console.error("Get all users error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch users";
    return res.status(500).json({ error: errorMessage, message: errorMessage });
  }
};

export const createUser = async (req: Request, res: Response): Promise<any> => {
  try {
    const parseResult = createUserSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Invalid input data",
        message: "Invalid input data",
        errors: parseResult.error.flatten().fieldErrors,
      });
    }

    const { username, name, password, role, email } = parseResult.data;

    // Check if username is already in use
    const existingUser = await prisma.user.findFirst({
      where: {
        username: {
          equals: username.trim(),
          mode: "insensitive",
        },
      },
    });

    if (existingUser) {
      return res.status(409).json({
        error: "Username is already taken",
        message: "Username is already taken",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username: username.trim(),
        name: name.trim(),
        password: hashedPassword,
        role,
        email: email ? email.trim() : null,
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(201).json(newUser);
  } catch (error) {
    console.error("Create user error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create user";
    return res.status(500).json({ error: errorMessage, message: errorMessage });
  }
};

export const updateUserRole = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.userId;

    const parseResult = updateRoleSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Invalid input data",
        message: "Invalid input data",
        errors: parseResult.error.flatten().fieldErrors,
      });
    }

    const { role } = parseResult.data;

    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return res.status(404).json({ error: "User not found", message: "User not found" });
    }

    // Prevent active logged-in admin from demoting themselves
    if (currentUserId === id && role !== "ADMIN") {
      return res.status(400).json({
        error: "You cannot demote your own administrator account",
        message: "You cannot demote your own administrator account",
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Update user role error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update user role";
    return res.status(500).json({ error: errorMessage, message: errorMessage });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    const parseResult = resetPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Invalid input data",
        message: "Invalid input data",
        errors: parseResult.error.flatten().fieldErrors,
      });
    }

    const { password } = parseResult.data;

    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return res.status(404).json({ error: "User not found", message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return res.status(200).json({
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to reset password";
    return res.status(500).json({ error: errorMessage, message: errorMessage });
  }
};

export const toggleUserStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.userId;

    // Prevent self-deactivation
    if (currentUserId === id) {
      return res.status(400).json({
        error: "You cannot deactivate your own account",
        message: "You cannot deactivate your own account",
      });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return res.status(404).json({ error: "User not found", message: "User not found" });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: !targetUser.isActive },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const action = updatedUser.isActive ? "activated" : "deactivated";
    return res.status(200).json({
      message: `User account ${action} successfully`,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("Toggle user status error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update user status";
    return res.status(500).json({ error: errorMessage, message: errorMessage });
  }
};
