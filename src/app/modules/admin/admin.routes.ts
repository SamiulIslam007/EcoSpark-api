import { Router } from "express";
import { AdminController } from "./admin.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { adminOnly } from "../../middlewares/adminOnly.middleware.js";

const router = Router();

router.get("/stats", protect, adminOnly, AdminController.getDashboardStats);
router.get("/users", protect, adminOnly, AdminController.getAllUsers);
router.patch("/users/:id/toggle-active", protect, adminOnly, AdminController.toggleUserActive);
router.patch("/users/:id/role", protect, adminOnly, AdminController.changeUserRole);
router.delete("/ideas/:id", protect, adminOnly, AdminController.adminDeleteIdea);
router.post("/newsletter/subscribe", AdminController.subscribeNewsletter);

export default router;
