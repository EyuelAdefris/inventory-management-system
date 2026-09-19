import { Request, Response } from "express";
import prisma from "../lib/prisma";

export const getDashboardSummary = async (_req: Request, res: Response): Promise<any> => {
  try {
    const totalActiveProducts = await prisma.product.count({
      where: { isActive: true },
    });

    const activeProducts = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        stockQuantity: true,
        minStockLevel: true,
        costPrice: true,
      },
    });

    const lowStockCount = activeProducts.filter(
      (p) => p.stockQuantity <= p.minStockLevel
    ).length;

    const totalInventoryValue = activeProducts.reduce(
      (sum, p) => sum + p.stockQuantity * p.costPrice,
      0
    );

    const totalStockUnits = activeProducts.reduce(
      (sum, p) => sum + (p.stockQuantity || 0),
      0
    );

    const salesAggregation = await prisma.sale.aggregate({
      _sum: {
        totalAmount: true,
      },
    });

    const totalRevenue = salesAggregation._sum.totalAmount || 0;

    return res.status(200).json({
      totalActiveProducts,
      lowStockCount,
      totalInventoryValue,
      totalRevenue,
      totalStockUnits,
    });
  } catch (error) {
    console.error("Get dashboard summary error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return res.status(400).json({
      error: errorMessage,
      message: errorMessage,
    });
  }
};

export const getLowStockReport = async (_req: Request, res: Response): Promise<any> => {
  try {
    const activeProducts = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: true,
        supplier: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    const lowStockProducts = activeProducts.filter(
      (product) => product.stockQuantity <= product.minStockLevel
    );

    return res.status(200).json(lowStockProducts);
  } catch (error) {
    console.error("Get low stock report error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return res.status(400).json({
      error: errorMessage,
      message: errorMessage,
    });
  }
};

export const getSalesSummary = async (req: Request, res: Response): Promise<any> => {
  try {
    const { startDate, endDate } = req.query;

    const whereClause: any = {};

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate && typeof startDate === "string") {
        whereClause.createdAt.gte = new Date(startDate);
      }
      if (endDate && typeof endDate === "string") {
        const parsedEnd = new Date(endDate);
        if (endDate.length === 10 && !isNaN(parsedEnd.getTime())) {
          parsedEnd.setHours(23, 59, 59, 999);
        }
        whereClause.createdAt.lte = parsedEnd;
      }
    }

    const salesAggregation = await prisma.sale.aggregate({
      where: whereClause,
      _count: {
        id: true,
      },
      _sum: {
        totalAmount: true,
      },
    });

    const totalSalesCount = salesAggregation._count.id || 0;
    const totalRevenue = salesAggregation._sum.totalAmount || 0;

    const saleItemsGrouped = await prisma.saleItem.groupBy({
      by: ["productId"],
      where: Object.keys(whereClause).length > 0 ? { sale: whereClause } : undefined,
      _sum: {
        quantity: true,
        total: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 5,
    });

    const productIds = saleItemsGrouped.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        category: true,
        supplier: true,
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    const topSellingProducts = saleItemsGrouped.map((item) => ({
      product: productMap.get(item.productId) || null,
      totalQuantitySold: item._sum.quantity || 0,
      totalRevenue: item._sum.total || 0,
    }));

    const salesTrendRaw = await prisma.sale.findMany({
      where: whereClause,
      select: { createdAt: true, totalAmount: true },
      orderBy: { createdAt: "asc" },
    });

    const trendMap = new Map<string, number>();
    salesTrendRaw.forEach((s) => {
      const dateKey = s.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      trendMap.set(dateKey, (trendMap.get(dateKey) || 0) + s.totalAmount);
    });

    const salesTrend = Array.from(trendMap.entries()).map(([date, revenue]) => ({
      date,
      revenue,
    }));

    return res.status(200).json({
      totalSalesCount,
      totalRevenue,
      topSellingProducts,
      salesTrend,
    });
  } catch (error) {
    console.error("Get sales summary error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return res.status(400).json({
      error: errorMessage,
      message: errorMessage,
    });
  }
};

export const getFinancialSummary = async (req: Request, res: Response): Promise<any> => {
  try {
    const { startDate, endDate } = req.query;

    const whereClause: any = {};

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate && typeof startDate === "string") {
        whereClause.createdAt.gte = new Date(startDate);
      }
      if (endDate && typeof endDate === "string") {
        const parsedEnd = new Date(endDate);
        if (endDate.length === 10 && !isNaN(parsedEnd.getTime())) {
          parsedEnd.setHours(23, 59, 59, 999);
        }
        whereClause.createdAt.lte = parsedEnd;
      }
    }

    // 1. Fetch sales with items and product details
    const sales = await prisma.sale.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 2. Compute total revenue and total cost from sales
    let totalRevenue = 0;
    let totalCost = 0;

    const categoryMap = new Map<string, {
      categoryId: string;
      categoryName: string;
      unitsSold: number;
      revenue: number;
      cost: number;
      grossProfit: number;
      profitMargin: number;
    }>();

    const productMap = new Map<string, {
      productId: string;
      productName: string;
      categoryName: string;
      unitsSold: number;
      revenue: number;
      cost: number;
      grossProfit: number;
      profitMargin: number;
    }>();

    for (const sale of sales) {
      totalRevenue += sale.totalAmount || 0;

      for (const item of sale.items) {
        const costPrice = item.product?.costPrice ?? 0;
        const lineCost = costPrice * item.quantity;
        const lineRevenue = item.total ?? (item.unitPrice * item.quantity);
        totalCost += lineCost;

        // Group by Category
        const catId = item.product?.category?.id || "uncategorized";
        const catName = item.product?.category?.name || "Uncategorized";
        const existingCat = categoryMap.get(catId) || {
          categoryId: catId,
          categoryName: catName,
          unitsSold: 0,
          revenue: 0,
          cost: 0,
          grossProfit: 0,
          profitMargin: 0,
        };
        existingCat.unitsSold += item.quantity;
        existingCat.revenue += lineRevenue;
        existingCat.cost += lineCost;
        categoryMap.set(catId, existingCat);

        // Group by Product
        const prodId = item.productId;
        const prodName = item.product?.name || "Unknown Product";
        const existingProd = productMap.get(prodId) || {
          productId: prodId,
          productName: prodName,
          categoryName: catName,
          unitsSold: 0,
          revenue: 0,
          cost: 0,
          grossProfit: 0,
          profitMargin: 0,
        };
        existingProd.unitsSold += item.quantity;
        existingProd.revenue += lineRevenue;
        existingProd.cost += lineCost;
        productMap.set(prodId, existingProd);
      }
    }

    const grossProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? Number(((grossProfit / totalRevenue) * 100).toFixed(2)) : 0;

    // 3. Current inventory valuation & potential revenue for active products
    const inventoryAggregate = await prisma.product.aggregate({
      where: { isActive: true },
      _sum: {
        stockQuantity: true,
      },
    });
    const totalStockUnits = inventoryAggregate._sum.stockQuantity || 0;

    const activeProducts = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        stockQuantity: true,
        costPrice: true,
        sellingPrice: true,
      },
    });

    const inventoryValuation = activeProducts.reduce(
      (sum, p) => sum + (p.stockQuantity || 0) * (p.costPrice || 0),
      0
    );

    const potentialRevenue = activeProducts.reduce(
      (sum, p) => sum + (p.stockQuantity || 0) * (p.sellingPrice || 0),
      0
    );

    const categoryBreakdown = Array.from(categoryMap.values())
      .map((c) => {
        const gp = c.revenue - c.cost;
        const pm = c.revenue > 0 ? Number(((gp / c.revenue) * 100).toFixed(2)) : 0;
        return { ...c, grossProfit: gp, profitMargin: pm };
      })
      .sort((a, b) => b.revenue - a.revenue);

    const productBreakdown = Array.from(productMap.values())
      .map((p) => {
        const gp = p.revenue - p.cost;
        const pm = p.revenue > 0 ? Number(((gp / p.revenue) * 100).toFixed(2)) : 0;
        return { ...p, grossProfit: gp, profitMargin: pm };
      })
      .sort((a, b) => b.revenue - a.revenue);

    return res.status(200).json({
      totalRevenue,
      totalCost,
      grossProfit,
      profitMargin,
      inventoryValuation,
      potentialRevenue,
      totalStockUnits,
      categoryBreakdown,
      productBreakdown,
    });
  } catch (error) {
    console.error("Get financial summary error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return res.status(400).json({
      error: errorMessage,
      message: errorMessage,
    });
  }
};

