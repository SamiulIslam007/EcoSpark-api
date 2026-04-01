import { Request, Response } from "express";
import { catchAsync } from "../lib/catchAsync";
import { prisma } from "../lib/prisma";

// GET /comments/:ideaId — fetch all top-level comments with nested replies
export const getComments = catchAsync(async (req: Request, res: Response) => {
  const ideaId = req.params["ideaId"] as string;

  const comments = await prisma.comment.findMany({
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

// POST /comments/:ideaId — create a new comment or reply
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

  // Validate parentId if replying
  if (parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: parentId } });
    if (!parent || parent.ideaId !== ideaId) {
      res.status(400).json({ message: "Invalid parent comment" });
      return;
    }
  }

  const comment = await prisma.comment.create({
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

// DELETE /comments/:id — user deletes own comment, admin deletes any
export const deleteComment = catchAsync(async (req: Request, res: Response) => {
  const id = req.params["id"] as string;

  const comment = await prisma.comment.findUnique({ where: { id } });
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

  await prisma.comment.delete({ where: { id } });
  res.json({ message: "Comment deleted" });
});
