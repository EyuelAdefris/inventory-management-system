import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { customerSchema } from "../schemas/customer.schema";

export const getCustomers = async (_req: Request, res: Response): Promise<any> => {
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

    return res.status(200).json(customers);
  } catch (error) {
    console.error("Get customers error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return res.status(400).json({
      error: errorMessage,
      message: errorMessage,
    });
  }
};

export const createCustomer = async (req: Request, res: Response): Promise<any> => {
  try {
    const parseResult = customerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Invalid input data",
        message: "Invalid input data",
        errors: parseResult.error.flatten().fieldErrors,
      });
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

    return res.status(201).json(customer);
  } catch (error) {
    console.error("Create customer error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return res.status(400).json({
      error: errorMessage,
      message: errorMessage,
    });
  }
};
