import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { createProductSchema, updateProductSchema } from "../schemas/product.schema";

export const getProducts = async (req: Request, res: Response): Promise<any> => {
  try {
    const { search, categoryId } = req.query;

    const where: any = {
      isActive: true,
    };

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

    return res.status(200).json(products);
  } catch (error) {
    console.error("Get products error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return res.status(400).json({
      error: errorMessage,
      message: errorMessage,
    });
  }
};

export const getProductById = async (req: Request, res: Response): Promise<any> => {
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
      return res.status(404).json({ error: "Product not found", message: "Product not found" });
    }

    return res.status(200).json(product);
  } catch (error) {
    console.error("Get product by ID error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return res.status(400).json({
      error: errorMessage,
      message: errorMessage,
    });
  }
};

export const createProduct = async (req: Request, res: Response): Promise<any> => {
  try {
    const parseResult = createProductSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Invalid input data",
        message: "Invalid input data",
        errors: parseResult.error.flatten().fieldErrors,
      });
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
      return res.status(400).json({ error: "Category not found", message: "Category not found" });
    }

    // Verify supplier exists
    const supplierExists = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });
    if (!supplierExists) {
      return res.status(400).json({ error: "Supplier not found", message: "Supplier not found" });
    }

    // Check SKU uniqueness
    const skuExists = await prisma.product.findUnique({
      where: { sku },
    });
    if (skuExists) {
      return res.status(400).json({ error: "Product with this SKU already exists", message: "Product with this SKU already exists" });
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

    await prisma.notification.create({
      data: {
        title: "Product Added",
        message: `Product Added: ${product.name}`,
        type: "PRODUCT_ADD",
      },
    });

    return res.status(201).json(product);
  } catch (error) {
    console.error("Create product error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return res.status(400).json({
      error: errorMessage,
      message: errorMessage,
    });
  }
};

export const updateProduct = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return res.status(404).json({ error: "Product not found", message: "Product not found" });
    }

    const parseResult = updateProductSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Invalid input data",
        message: "Invalid input data",
        errors: parseResult.error.flatten().fieldErrors,
      });
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
        return res.status(400).json({ error: "Category not found", message: "Category not found" });
      }
    }

    // Verify supplier if provided
    if (supplierId) {
      const supplierExists = await prisma.supplier.findUnique({
        where: { id: supplierId },
      });
      if (!supplierExists) {
        return res.status(400).json({ error: "Supplier not found", message: "Supplier not found" });
      }
    }

    // Verify SKU uniqueness if changed
    if (sku && sku !== existingProduct.sku) {
      const skuExists = await prisma.product.findUnique({
        where: { sku },
      });
      if (skuExists) {
        return res.status(400).json({ error: "SKU is already in use by another product", message: "SKU is already in use by another product" });
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

    await prisma.notification.create({
      data: {
        title: "Product Updated",
        message: `Product Updated: ${updatedProduct.name}`,
        type: "PRODUCT_UPDATE",
      },
    });

    return res.status(200).json(updatedProduct);
  } catch (error) {
    console.error("Update product error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return res.status(400).json({
      error: errorMessage,
      message: errorMessage,
    });
  }
};

export const deleteProduct = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return res.status(404).json({ error: "Product not found", message: "Product not found" });
    }

    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    await prisma.notification.create({
      data: {
        title: "Product Soft-Deleted",
        message: `Product Soft-Deleted: ${existingProduct.name}`,
        type: "PRODUCT_DELETE",
      },
    });

    return res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return res.status(400).json({
      error: errorMessage,
      message: errorMessage,
    });
  }
};
