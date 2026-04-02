import { Router } from "express";
import { CategoryController } from "./category.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { adminOnly } from "../../middlewares/adminOnly.middleware.js";

const router = Router();

router.get("/", CategoryController.getCategories);
router.post("/", protect, adminOnly, CategoryController.createCategory);
router.delete("/:id", protect, adminOnly, CategoryController.deleteCategory);

export default router;
