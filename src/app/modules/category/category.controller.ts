import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { CategoryService } from "./category.service.js";

const getCategories = catchAsync(async (_req: Request, res: Response) => {
  const categories = await CategoryService.getCategories();
  res.json(categories);
});

const createCategory = catchAsync(async (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name?.trim()) {
    res.status(400).json({ message: "Category name is required" });
    return;
  }

  const result = await CategoryService.createCategory(name);
  if ("conflict" in result) {
    res.status(409).json({ message: "Category already exists" });
    return;
  }

  res.status(201).json(result);
});

const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await CategoryService.deleteCategory(req.params["id"] as string);
  if ("conflict" in result) {
    res.status(400).json({ message: "Cannot delete category with existing ideas" });
    return;
  }
  res.json({ message: "Category deleted" });
});

export const CategoryController = {
  getCategories,
  createCategory,
  deleteCategory,
};
