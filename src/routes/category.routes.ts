import { Router } from "express";
import { getCategories, createCategory, deleteCategory } from "../controllers/category.controller.js";
import { protect } from "../middlewares/protect.middleware.js";
import { adminOnly } from "../middlewares/adminOnly.middleware.js";

const router = Router();

router.get("/", getCategories);
router.post("/", protect, adminOnly, createCategory);
router.delete("/:id", protect, adminOnly, deleteCategory);

export default router;
