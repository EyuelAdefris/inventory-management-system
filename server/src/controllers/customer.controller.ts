import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { customerSchema } from "../schemas/customer.schema";

export const getCustomers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        _count: {
          select: {
            sales: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    res.status(200).json(customers);
  } catch (error) {
    console.error("Get customers error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = customerSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: "Invalid input data",
        errors: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const { name, email, phone, address } = parseResult.data;

    const customer = await prisma.customer.create({
      data: {
        name,
        email: email || null,
        phone,
        address,
      },
    });

    res.status(201).json(customer);
  } catch (error) {
    console.error("Create customer error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
