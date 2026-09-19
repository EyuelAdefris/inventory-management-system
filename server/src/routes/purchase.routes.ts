import { Router } from "express";
import { getPurchases, createPurchase } from "../controllers/purchase.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticate, getPurchases);
router.post("/", authenticate, authorize(["ADMIN"]), createPurchase);

export default router;
