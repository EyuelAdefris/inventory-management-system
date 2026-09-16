import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { categorySchema } from "../schemas/category.schema";

export const getCategories = async (_req: Request, res: Response): Promise<void> => {
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

    res.status(200).json(categories);
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = categorySchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: "Invalid input data",
        errors: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const { name, description } = parseResult.data;

    const category = await prisma.category.create({
      data: {
        name,
        description,
      },
    });

    res.status(201).json(category);
  } catch (error) {
    console.error("Create category error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
