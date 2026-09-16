import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { supplierSchema } from "../schemas/supplier.schema";

export const getSuppliers = async (_req: Request, res: Response): Promise<void> => {
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

    res.status(200).json(suppliers);
  } catch (error) {
    console.error("Get suppliers error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createSupplier = async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = supplierSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: "Invalid input data",
        errors: parseResult.error.flatten().fieldErrors,
      });
      return;
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

    res.status(201).json(supplier);
  } catch (error) {
    console.error("Create supplier error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
