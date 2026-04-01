/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import { catchAsync } from "../lib/catchAsync";
import { prisma } from "../lib/prisma";

export const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const { page = "1", limit = "20", search } = req.query as Record<string, string>;
  const skip = (Number(page) - 1) * Number(limit);

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: Number(limit),
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: { select: { ideas: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({ users, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
});

export const toggleUserActive = catchAsync(async (req: Request, res: Response) => {
  const id = req.params["id"] as string;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  if (user.id === req.user!.id) {
    res.status(400).json({ message: "Cannot deactivate your own account" });
    return;
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { isActive: !user.isActive },
    select: { id: true, name: true, isActive: true },
  });

  res.json(updated);
});

export const changeUserRole = catchAsync(async (req: Request, res: Response) => {
  const id = req.params["id"] as string;
  const { role } = req.body;
  if (role !== "MEMBER" && role !== "ADMIN") {
    res.status(400).json({ message: "Role must be MEMBER or ADMIN" });
    return;
  }

  if (id === req.user!.id) {
    res.status(400).json({ message: "Cannot change your own role" });
    return;
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, name: true, role: true },
  });

  res.json(updated);
});

export const getDashboardStats = catchAsync(async (_req: Request, res: Response) => {
  const [totalUsers, totalIdeas, pendingIdeas, approvedIdeas] = await Promise.all([
    prisma.user.count(),
    prisma.idea.count(),
    prisma.idea.count({ where: { status: "UNDER_REVIEW" } }),
    prisma.idea.count({ where: { status: "APPROVED" } }),
  ]);

  res.json({ totalUsers, totalIdeas, pendingIdeas, approvedIdeas });
});

export const subscribeNewsletter = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ message: "Email is required" });
    return;
  }
  await prisma.newsletterSubscriber.upsert({
    where: { email },
    update: {},
    create: { email },
  });
  res.json({ message: "Subscribed successfully" });
});
