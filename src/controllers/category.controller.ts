import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const getCategories = async (_req: Request, res: Response) => {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  res.json(categories);
};

export const createCategory = async (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name?.trim()) {
    res.status(400).json({ message: "Category name is required" });
    return;
  }
  const existing = await prisma.category.findUnique({ where: { name } });
  if (existing) {
    res.status(409).json({ message: "Category already exists" });
    return;
  }
  const category = await prisma.category.create({ data: { name: name.trim() } });
  res.status(201).json(category);
};

export const deleteCategory = async (req: Request, res: Response) => {
  const id = req.params["id"] as string;
  const ideas = await prisma.idea.count({ where: { categoryId: id } });
  if (ideas > 0) {
    res.status(400).json({ message: "Cannot delete category with existing ideas" });
    return;
  }
  await prisma.category.delete({ where: { id } });
  res.json({ message: "Category deleted" });
};
