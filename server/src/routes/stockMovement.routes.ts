import { Router } from "express";
import { getStockMovements, adjustStock } from "../controllers/stockMovement.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticate, getStockMovements);
router.post("/adjust", authenticate, authorize(["ADMIN"]), adjustStock);

export default router;
