import { Router } from "express";
import { getCategories, createCategory, deleteCategory } from "../controllers/category.controller";
import { protect } from "../middlewares/protect.middleware";
import { adminOnly } from "../middlewares/adminOnly.middleware";

const router = Router();

router.get("/", getCategories);
router.post("/", protect, adminOnly, createCategory);
router.delete("/:id", protect, adminOnly, deleteCategory);

export default router;
