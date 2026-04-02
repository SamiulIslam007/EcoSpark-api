/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "../../utils/prisma.js";
import { ICreateIdeaPayload, IGetIdeasQuery, IUpdateIdeaPayload } from "./idea.interface.js";

const ideaPublicSelect = {
  id: true,
  title: true,
  description: true,
  images: true,
  isPaid: true,
  price: true,
  status: true,
  createdAt: true,
  author: { select: { id: true, name: true } },
  category: { select: { id: true, name: true } },
  _count: { select: { votes: true } },
};

const getApprovedIdeas = async (query: IGetIdeasQuery) => {
  const {
    page = "1",
    limit = "10",
    category,
    sort = "recent",
    search,
    isPaid,
    authorId,
    minVotes,
  } = query;

  const skip = (Number(page) - 1) * Number(limit);

  const where: any = { status: "APPROVED" };
  if (category) where.categoryId = category;
  if (isPaid !== undefined) where.isPaid = isPaid === "true";
  if (authorId) where.authorId = authorId;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const orderBy: any =
    sort === "top_voted" ? { votes: { _count: "desc" } } : { createdAt: "desc" };

  let ideas = await prisma.idea.findMany({
    where,
    skip,
    take: Number(limit),
    orderBy,
    select: ideaPublicSelect,
  });

  if (minVotes) {
    const min = Number(minVotes);
    const ideaIds = ideas.map((i) => i.id);
    const voteCounts = await prisma.vote.groupBy({
      by: ["ideaId"],
      where: { ideaId: { in: ideaIds }, type: "UPVOTE" },
      _count: { ideaId: true },
    });
    const countMap = new Map(voteCounts.map((v) => [v.ideaId, v._count.ideaId]));
    ideas = ideas.filter((i) => (countMap.get(i.id) ?? 0) >= min);
  }

  const total = await prisma.idea.count({ where });

  return { ideas, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
};

const getIdeaById = async (id: string, userId?: string, userRole?: string) => {
  const idea = await prisma.idea.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true } },
      category: true,
      votes: { select: { userId: true, type: true } },
    },
  });

  if (!idea || idea.status !== "APPROVED") return null;

  if (idea.isPaid) {
    if (!userId) return { requiresAuth: true } as const;

    if (userRole !== "ADMIN") {
      const purchase = await prisma.purchase.findUnique({
        where: { userId_ideaId: { userId, ideaId: idea.id } },
      });
      if (!purchase) {
        return {
          requiresPurchase: true,
          price: idea.price,
          teaser: { title: idea.title, category: idea.category, author: idea.author },
        } as const;
      }
    }
  }

  return idea;
};

const createIdea = async (payload: ICreateIdeaPayload, authorId: string) => {
  const { title, problemStatement, proposedSolution, description, categoryId, isPaid, price, images, status } =
    payload;

  const targetStatus = status === "UNDER_REVIEW" ? "UNDER_REVIEW" : "DRAFT";

  return prisma.idea.create({
    data: {
      title,
      problemStatement,
      proposedSolution,
      description,
      images: images ?? [],
      isPaid: Boolean(isPaid),
      price: isPaid ? Number(price) : null,
      status: targetStatus,
      authorId,
      categoryId,
    },
    include: {
      category: true,
      author: { select: { id: true, name: true } },
    },
  });
};

const updateIdea = async (id: string, payload: IUpdateIdeaPayload, userId: string) => {
  const idea = await prisma.idea.findUnique({ where: { id } });
  if (!idea) return { notFound: true } as const;
  if (idea.authorId !== userId) return { forbidden: true } as const;
  if (idea.status === "APPROVED" || idea.status === "UNDER_REVIEW") {
    return { conflict: true } as const;
  }

  const { title, problemStatement, proposedSolution, description, categoryId, isPaid, price, images } = payload;

  return prisma.idea.update({
    where: { id },
    data: {
      title,
      problemStatement,
      proposedSolution,
      description,
      categoryId,
      images: images ?? idea.images,
      isPaid: Boolean(isPaid),
      price: isPaid ? Number(price) : null,
    },
    include: {
      category: true,
      author: { select: { id: true, name: true } },
    },
  });
};

const deleteIdea = async (id: string, userId: string) => {
  const idea = await prisma.idea.findUnique({ where: { id } });
  if (!idea) return { notFound: true } as const;
  if (idea.authorId !== userId) return { forbidden: true } as const;
  if (idea.status === "APPROVED") return { conflict: true } as const;

  await prisma.idea.delete({ where: { id } });
  return { deleted: true } as const;
};

const submitForReview = async (id: string, userId: string) => {
  const idea = await prisma.idea.findUnique({ where: { id } });
  if (!idea) return { notFound: true } as const;
  if (idea.authorId !== userId) return { forbidden: true } as const;
  if (idea.status !== "DRAFT" && idea.status !== "REJECTED") return { conflict: true } as const;

  return prisma.idea.update({
    where: { id },
    data: { status: "UNDER_REVIEW", rejectionFeedback: null },
  });
};

const approveIdea = async (id: string) => {
  const idea = await prisma.idea.findUnique({ where: { id } });
  if (!idea) return null;
  return prisma.idea.update({ where: { id }, data: { status: "APPROVED" } });
};

const rejectIdea = async (id: string, feedback: string) => {
  const idea = await prisma.idea.findUnique({ where: { id } });
  if (!idea) return null;
  return prisma.idea.update({
    where: { id },
    data: { status: "REJECTED", rejectionFeedback: feedback.trim() },
  });
};

const getMyIdeas = async (userId: string) => {
  return prisma.idea.findMany({
    where: { authorId: userId },
    include: {
      category: { select: { id: true, name: true } },
      _count: { select: { votes: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

const getAllIdeasAdmin = async (query: { status?: string; page?: string; limit?: string }) => {
  const { status, page = "1", limit = "20" } = query;
  const skip = (Number(page) - 1) * Number(limit);

  const where: any = {};
  if (status) where.status = status;

  const [ideas, total] = await Promise.all([
    prisma.idea.findMany({
      where,
      skip,
      take: Number(limit),
      include: {
        author: { select: { id: true, name: true, email: true } },
        category: true,
        _count: { select: { votes: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.idea.count({ where }),
  ]);

  return { ideas, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
};

export const IdeaService = {
  getApprovedIdeas,
  getIdeaById,
  createIdea,
  updateIdea,
  deleteIdea,
  submitForReview,
  approveIdea,
  rejectIdea,
  getMyIdeas,
  getAllIdeasAdmin,
};
