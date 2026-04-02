import { prisma } from "../../utils/prisma.js";

const getCategories = async () => {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
};

const createCategory = async (name: string) => {
  const existing = await prisma.category.findUnique({ where: { name } });
  if (existing) return { conflict: true } as const;
  return prisma.category.create({ data: { name: name.trim() } });
};

const deleteCategory = async (id: string) => {
  const ideas = await prisma.idea.count({ where: { categoryId: id } });
  if (ideas > 0) return { conflict: true } as const;
  await prisma.category.delete({ where: { id } });
  return { deleted: true } as const;
};

export const CategoryService = {
  getCategories,
  createCategory,
  deleteCategory,
};
