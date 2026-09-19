import { Router } from "express";
import { getSales, getSaleById, createSale } from "../controllers/sale.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticate, getSales);
router.get("/:id", authenticate, getSaleById);
router.post("/", authenticate, createSale);

export default router;
