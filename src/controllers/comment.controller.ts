/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import { catchAsync } from "../lib/catchAsync.js";
import { prisma } from "../lib/prisma.js";

const commentModel = (prisma as any).comment;

export const getComments = catchAsync(async (req: Request, res: Response) => {
  const ideaId = req.params["ideaId"] as string;

  const comments = await commentModel.findMany({
    where: { ideaId, parentId: null },
    include: {
      author: { select: { id: true, name: true } },
      replies: {
        include: {
          author: { select: { id: true, name: true } },
          replies: {
            include: {
              author: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json(comments);
});

export const createComment = catchAsync(async (req: Request, res: Response) => {
  const ideaId = req.params["ideaId"] as string;
  const { content, parentId } = req.body;

  if (!content?.trim()) {
    res.status(400).json({ message: "Comment content is required" });
    return;
  }

  const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
  if (!idea || idea.status !== "APPROVED") {
    res.status(404).json({ message: "Idea not found" });
    return;
  }

  if (parentId) {
    const parent = await commentModel.findUnique({ where: { id: parentId } });
    if (!parent || parent.ideaId !== ideaId) {
      res.status(400).json({ message: "Invalid parent comment" });
      return;
    }
  }

  const comment = await commentModel.create({
    data: {
      content: content.trim(),
      authorId: req.user!.id,
      ideaId,
      parentId: parentId ?? null,
    },
    include: {
      author: { select: { id: true, name: true } },
    },
  });

  res.status(201).json(comment);
});

export const deleteComment = catchAsync(async (req: Request, res: Response) => {
  const id = req.params["id"] as string;

  const comment = await commentModel.findUnique({ where: { id } });
  if (!comment) {
    res.status(404).json({ message: "Comment not found" });
    return;
  }

  const isAdmin = req.user!.role === "ADMIN";
  const isOwner = comment.authorId === req.user!.id;

  if (!isAdmin && !isOwner) {
    res.status(403).json({ message: "Not authorized to delete this comment" });
    return;
  }

  await commentModel.delete({ where: { id } });
  res.json({ message: "Comment deleted" });
});
