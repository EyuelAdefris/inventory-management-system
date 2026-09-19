import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { supplierSchema } from "../schemas/supplier.schema";

export const getSuppliers = async (_req: Request, res: Response): Promise<any> => {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: {
        _count: {
          select: {
            products: true,
            purchases: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return res.status(200).json(suppliers);
  } catch (error) {
    console.error("Get suppliers error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return res.status(400).json({
      error: errorMessage,
      message: errorMessage,
    });
  }
};

export const createSupplier = async (req: Request, res: Response): Promise<any> => {
  try {
    const parseResult = supplierSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Invalid input data",
        message: "Invalid input data",
        errors: parseResult.error.flatten().fieldErrors,
      });
    }

    const { name, contactPerson, email, phone, address } = parseResult.data;

    const supplier = await prisma.supplier.create({
      data: {
        name,
        contactPerson,
        email: email || null,
        phone,
        address,
      },
    });

    return res.status(201).json(supplier);
  } catch (error) {
    console.error("Create supplier error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return res.status(400).json({
      error: errorMessage,
      message: errorMessage,
    });
  }
};
