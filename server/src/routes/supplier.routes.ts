import { Router } from "express";
import { getSuppliers, createSupplier } from "../controllers/supplier.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticate, getSuppliers);
router.post("/", authenticate, authorize(["ADMIN"]), createSupplier);

export default router;
