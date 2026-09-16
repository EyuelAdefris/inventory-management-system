import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { createProductSchema, updateProductSchema } from "../schemas/product.schema";

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, categoryId } = req.query;

    const where: any = {};

    if (categoryId && typeof categoryId === "string") {
      where.categoryId = categoryId;
    }

    if (search && typeof search === "string") {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        supplier: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json(products);
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        supplier: true,
      },
    });

    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    res.status(200).json(product);
  } catch (error) {
    console.error("Get product by ID error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = createProductSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: "Invalid input data",
        errors: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const {
      sku,
      name,
      description,
      price,
      sellingPrice: reqSellingPrice,
      costPrice,
      quantity,
      stockQuantity: reqStockQuantity,
      minStock,
      minStockLevel: reqMinStockLevel,
      categoryId,
      supplierId,
    } = parseResult.data;

    const sellingPrice = reqSellingPrice ?? price!;
    const stockQuantity = reqStockQuantity ?? quantity ?? 0;
    const minStockLevel = reqMinStockLevel ?? minStock ?? 5;

    // Verify category exists
    const categoryExists = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!categoryExists) {
      res.status(400).json({ message: "Category not found" });
      return;
    }

    // Verify supplier exists
    const supplierExists = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });
    if (!supplierExists) {
      res.status(400).json({ message: "Supplier not found" });
      return;
    }

    // Check SKU uniqueness
    const skuExists = await prisma.product.findUnique({
      where: { sku },
    });
    if (skuExists) {
      res.status(400).json({ message: "Product with this SKU already exists" });
      return;
    }

    const product = await prisma.product.create({
      data: {
        sku,
        name,
        description,
        costPrice,
        sellingPrice,
        stockQuantity,
        minStockLevel,
        categoryId,
        supplierId,
      },
      include: {
        category: true,
        supplier: true,
      },
    });

    res.status(201).json(product);
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    const parseResult = updateProductSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: "Invalid input data",
        errors: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const {
      sku,
      name,
      description,
      price,
      sellingPrice: reqSellingPrice,
      costPrice,
      quantity,
      stockQuantity: reqStockQuantity,
      minStock,
      minStockLevel: reqMinStockLevel,
      categoryId,
      supplierId,
    } = parseResult.data;

    // Verify category if provided
    if (categoryId) {
      const categoryExists = await prisma.category.findUnique({
        where: { id: categoryId },
      });
      if (!categoryExists) {
        res.status(400).json({ message: "Category not found" });
        return;
      }
    }

    // Verify supplier if provided
    if (supplierId) {
      const supplierExists = await prisma.supplier.findUnique({
        where: { id: supplierId },
      });
      if (!supplierExists) {
        res.status(400).json({ message: "Supplier not found" });
        return;
      }
    }

    // Verify SKU uniqueness if changed
    if (sku && sku !== existingProduct.sku) {
      const skuExists = await prisma.product.findUnique({
        where: { sku },
      });
      if (skuExists) {
        res.status(400).json({ message: "SKU is already in use by another product" });
        return;
      }
    }

    const sellingPrice = reqSellingPrice ?? price ?? undefined;
    const stockQuantity = reqStockQuantity ?? quantity ?? undefined;
    const minStockLevel = reqMinStockLevel ?? minStock ?? undefined;

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        ...(sku && { sku }),
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(costPrice !== undefined && { costPrice }),
        ...(sellingPrice !== undefined && { sellingPrice }),
        ...(stockQuantity !== undefined && { stockQuantity }),
        ...(minStockLevel !== undefined && { minStockLevel }),
        ...(categoryId && { categoryId }),
        ...(supplierId && { supplierId }),
      },
      include: {
        category: true,
        supplier: true,
      },
    });

    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    await prisma.product.delete({
      where: { id },
    });

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
