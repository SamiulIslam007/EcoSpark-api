import { Router } from "express";
import {
  getAllUsers,
  toggleUserActive,
  changeUserRole,
  getDashboardStats,
  subscribeNewsletter,
  adminDeleteIdea,
} from "../controllers/admin.controller.js";
import { protect } from "../middlewares/protect.middleware.js";
import { adminOnly } from "../middlewares/adminOnly.middleware.js";

const router = Router();

router.get("/stats", protect, adminOnly, getDashboardStats);
router.get("/users", protect, adminOnly, getAllUsers);
router.patch("/users/:id/toggle-active", protect, adminOnly, toggleUserActive);
router.patch("/users/:id/role", protect, adminOnly, changeUserRole);
router.delete("/ideas/:id", protect, adminOnly, adminDeleteIdea);
router.post("/newsletter/subscribe", subscribeNewsletter);

export default router;
