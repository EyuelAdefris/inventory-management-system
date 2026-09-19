import { Router } from "express";
import { getNotifications, markAsRead } from "../controllers/notification.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticate, getNotifications);
router.patch("/mark-as-read", authenticate, markAsRead);

export default router;
