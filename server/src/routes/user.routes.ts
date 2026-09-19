import { Router } from "express";
import {
  getAllUsers,
  createUser,
  updateUserRole,
  resetPassword,
  toggleUserStatus,
} from "../controllers/user.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

// All user management endpoints require ADMIN role
router.use(authenticate, authorize(["ADMIN"]));

router.get("/", getAllUsers);
router.post("/", createUser);
router.put("/:id/role", updateUserRole);
router.put("/:id/reset-password", resetPassword);
router.patch("/:id/status", toggleUserStatus);

export default router;
