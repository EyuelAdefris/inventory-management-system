import { Router } from "express";
import { getCustomers, createCustomer } from "../controllers/customer.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticate, getCustomers);
router.post("/", authenticate, authorize(["ADMIN"]), createCustomer);

export default router;
