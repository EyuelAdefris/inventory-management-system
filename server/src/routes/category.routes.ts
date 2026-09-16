import { Router } from "express";
import { getCategories, createCategory } from "../controllers/category.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticate, getCategories);
router.post("/", authenticate, authorize(["ADMIN"]), createCategory);

export default router;
