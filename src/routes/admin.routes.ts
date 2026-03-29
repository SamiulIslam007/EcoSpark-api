import { Router } from "express";
import {
  getAllUsers,
  toggleUserActive,
  changeUserRole,
  getDashboardStats,
  subscribeNewsletter,
} from "../controllers/admin.controller";
import { protect } from "../middlewares/protect.middleware";
import { adminOnly } from "../middlewares/adminOnly.middleware";

const router = Router();

router.get("/stats", protect, adminOnly, getDashboardStats);
router.get("/users", protect, adminOnly, getAllUsers);
router.patch("/users/:id/toggle-active", protect, adminOnly, toggleUserActive);
router.patch("/users/:id/role", protect, adminOnly, changeUserRole);
router.post("/newsletter/subscribe", subscribeNewsletter);

export default router;
