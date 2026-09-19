import { Router } from "express";
import {
  getDashboardSummary,
  getFinancialSummary,
  getLowStockReport,
  getSalesSummary,
} from "../controllers/report.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate, authorize(["ADMIN", "STAFF"]));

router.get("/dashboard-summary", getDashboardSummary);
router.get("/financial-summary", getFinancialSummary);
router.get("/low-stock", getLowStockReport);
router.get("/sales-summary", getSalesSummary);

export default router;
