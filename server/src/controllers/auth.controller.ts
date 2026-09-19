import { Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../lib/prisma";
import { loginSchema, registerSchema } from "../schemas/auth.schema";
import { generateToken } from "../utils/jwt";

export const login = async (req: Request, res: Response): Promise<any> => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Invalid input data",
        message: "Invalid input data",
        errors: parseResult.error.flatten().fieldErrors,
      });
    }

    const { username, password } = parseResult.data;

    const user = await prisma.user.findFirst({
      where: {
        username: {
          equals: username.trim(),
          mode: "insensitive",
        },
      },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid username or password", message: "Invalid username or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid username or password", message: "Invalid username or password" });
    }

    // Block deactivated accounts
    if (!user.isActive) {
      return res.status(403).json({
        error: "Account is deactivated. Please contact an administrator.",
        message: "Account is deactivated. Please contact an administrator.",
      });
    }

    const token = generateToken({
      userId: user.id,
      role: user.role,
    });

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return res.status(400).json({
      error: errorMessage,
      message: errorMessage,
    });
  }
};

export const register = async (req: Request, res: Response): Promise<any> => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Invalid input data",
        message: "Invalid input data",
        errors: parseResult.error.flatten().fieldErrors,
      });
    }

    const { username, password, name, role, email } = parseResult.data;

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
        role: role || "STAFF",
        email: email ? email.trim() : null,
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const token = generateToken({
      userId: newUser.id,
      role: newUser.role,
    });

    return res.status(201).json({
      token,
      user: newUser,
    });
  } catch (error) {
    console.error("Register error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return res.status(400).json({
      error: errorMessage,
      message: errorMessage,
    });
  }
};

export const getMe = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized", message: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found", message: "User not found" });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error("GetMe error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return res.status(400).json({
      error: errorMessage,
      message: errorMessage,
    });
  }
};
