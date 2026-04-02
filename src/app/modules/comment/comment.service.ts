/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "../../utils/prisma";

const commentModel = (prisma as any).comment;

const getComments = async (ideaId: string) => {
  return commentModel.findMany({
    where: { ideaId, parentId: null },
    include: {
      author: { select: { id: true, name: true } },
      replies: {
        include: {
          author: { select: { id: true, name: true } },
          replies: {
            include: { author: { select: { id: true, name: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

const createComment = async (
  ideaId: string,
  content: string,
  authorId: string,
  parentId?: string
) => {
  const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
  if (!idea || idea.status !== "APPROVED") return { notFound: true } as const;

  if (parentId) {
    const parent = await commentModel.findUnique({ where: { id: parentId } });
    if (!parent || parent.ideaId !== ideaId) return { invalidParent: true } as const;
  }

  return commentModel.create({
    data: { content: content.trim(), authorId, ideaId, parentId: parentId ?? null },
    include: { author: { select: { id: true, name: true } } },
  });
};

const deleteComment = async (id: string, userId: string, userRole: string) => {
  const comment = await commentModel.findUnique({ where: { id } });
  if (!comment) return { notFound: true } as const;

  const isAdmin = userRole === "ADMIN";
  const isOwner = comment.authorId === userId;
  if (!isAdmin && !isOwner) return { forbidden: true } as const;

  await commentModel.delete({ where: { id } });
  return { deleted: true } as const;
};

export const CommentService = {
  getComments,
  createComment,
  deleteComment,
};
