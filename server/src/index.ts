import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes";
import categoryRoutes from "./routes/category.routes";
import supplierRoutes from "./routes/supplier.routes";
import customerRoutes from "./routes/customer.routes";
import productRoutes from "./routes/product.routes";
import saleRoutes from "./routes/sale.routes";
import purchaseRoutes from "./routes/purchase.routes";
import stockMovementRoutes from "./routes/stockMovement.routes";
import reportRoutes from "./routes/report.routes";
import notificationRoutes from "./routes/notification.routes";
import userRoutes from "./routes/user.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Helper to normalize origin URLs (strip whitespace and trailing slashes)
const normalizeOrigin = (url?: string | null): string => {
  if (!url) return "";
  return url.trim().replace(/\/+$/, "");
};

// Dynamic CORS Configuration
const fallbackOrigins = [
  process.env.CLIENT_URL,
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : []),
  "https://inventory-app-abr0.onrender.com",
  "http://localhost:5173",
  "http://localhost:3000",
];

const allowedOrigins = Array.from(
  new Set(
    fallbackOrigins
      .filter((origin): origin is string => Boolean(origin && origin.trim()))
      .map(normalizeOrigin)
  )
);

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server calls)
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = normalizeOrigin(origin);

    if (
      process.env.NODE_ENV !== "production" ||
      allowedOrigins.includes(normalizedOrigin)
    ) {
      return callback(null, true);
    }

    // Deny CORS without throwing an unhandled server-side Error
    return callback(null, false);
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

// 1. CORS Middleware (placed at the top before body parsers and routes)
app.use(cors(corsOptions));

// Explicitly handle preflight OPTIONS across all routes
app.options("*", cors(corsOptions));


// JSON Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/stock-movements", stockMovementRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/notifications", notificationRoutes);

// Health Check Route
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/", (_req: Request, res: Response) => {
  res.send("Inventory Management System API is running");
});

// Global Error Handling Middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Global error middleware caught:", err);
  const status = err.statusCode || err.status || 400;
  const message = err.message || "An unexpected error occurred";
  return res.status(status).json({
    error: message,
    message: message,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
