import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { categorySchema } from "../schemas/category.schema";

export const getCategories = async (_req: Request, res: Response): Promise<any> => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return res.status(200).json(categories);
  } catch (error) {
    console.error("Get categories error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return res.status(400).json({
      error: errorMessage,
      message: errorMessage,
    });
  }
};

export const createCategory = async (req: Request, res: Response): Promise<any> => {
  try {
    const parseResult = categorySchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Invalid input data",
        message: "Invalid input data",
        errors: parseResult.error.flatten().fieldErrors,
      });
    }

    const { name, description } = parseResult.data;

    const category = await prisma.category.create({
      data: {
        name,
        description,
      },
    });

    return res.status(201).json(category);
  } catch (error) {
    console.error("Create category error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return res.status(400).json({
      error: errorMessage,
      message: errorMessage,
    });
  }
};
