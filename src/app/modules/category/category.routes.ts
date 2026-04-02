import { Router } from "express";
import { CategoryController } from "./category.controller";
import { protect } from "../../middlewares/auth.middleware";
import { adminOnly } from "../../middlewares/adminOnly.middleware";

const router = Router();

router.get("/", CategoryController.getCategories);
router.post("/", protect, adminOnly, CategoryController.createCategory);
router.delete("/:id", protect, adminOnly, CategoryController.deleteCategory);

export default router;
