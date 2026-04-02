/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import { catchAsync } from "../lib/catchAsync";
import { prisma } from "../lib/prisma";

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

export const getApprovedIdeas = catchAsync(async (req: Request, res: Response) => {
  const {
    page = "1",
    limit = "10",
    category,
    sort = "recent",
    search,
    isPaid,
    authorId,
    minVotes,
  } = req.query as Record<string, string>;

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

  res.json({ ideas, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
});

export const getIdeaById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params["id"] as string;

  const idea = await prisma.idea.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true } },
      category: true,
      votes: { select: { userId: true, type: true } },
    },
  });

  if (!idea || idea.status !== "APPROVED") {
    res.status(404).json({ message: "Idea not found" });
    return;
  }

  if (idea.isPaid) {
    if (!req.user) {
      res.status(401).json({ message: "Login required to view this idea" });
      return;
    }

    if (req.user.role !== "ADMIN") {
      const purchase = await prisma.purchase.findUnique({
        where: { userId_ideaId: { userId: req.user.id, ideaId: idea.id } },
      });
      if (!purchase) {
        res.status(403).json({
          message: "Purchase required",
          needsPurchase: true,
          price: idea.price,
          teaser: { title: idea.title, category: idea.category, author: idea.author },
        });
        return;
      }
    }
  }

  res.json(idea);
});

export const createIdea = catchAsync(async (req: Request, res: Response) => {
  const { title, problemStatement, proposedSolution, description, categoryId, isPaid, price, images, status } =
    req.body;

  if (!title || !problemStatement || !proposedSolution || !description || !categoryId) {
    res.status(400).json({ message: "All required fields must be filled" });
    return;
  }

  if (isPaid && (!price || Number(price) <= 0)) {
    res.status(400).json({ message: "Paid ideas require a valid price" });
    return;
  }

  const targetStatus = status === "UNDER_REVIEW" ? "UNDER_REVIEW" : "DRAFT";

  const idea = await prisma.idea.create({
    data: {
      title,
      problemStatement,
      proposedSolution,
      description,
      images: images ?? [],
      isPaid: Boolean(isPaid),
      price: isPaid ? Number(price) : null,
      status: targetStatus,
      authorId: req.user!.id,
      categoryId,
    },
    include: {
      category: true,
      author: { select: { id: true, name: true } },
    },
  });

  res.status(201).json(idea);
});

export const updateIdea = catchAsync(async (req: Request, res: Response) => {
  const id = req.params["id"] as string;
  const idea = await prisma.idea.findUnique({ where: { id } });

  if (!idea) {
    res.status(404).json({ message: "Idea not found" });
    return;
  }

  if (idea.authorId !== req.user!.id) {
    res.status(403).json({ message: "Not your idea" });
    return;
  }

  if (idea.status === "APPROVED" || idea.status === "UNDER_REVIEW") {
    res.status(400).json({ message: "Cannot edit an approved or under-review idea" });
    return;
  }

  const { title, problemStatement, proposedSolution, description, categoryId, isPaid, price, images } = req.body;

  const updated = await prisma.idea.update({
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

  res.json(updated);
});

export const deleteIdea = catchAsync(async (req: Request, res: Response) => {
  const id = req.params["id"] as string;
  const idea = await prisma.idea.findUnique({ where: { id } });

  if (!idea) {
    res.status(404).json({ message: "Idea not found" });
    return;
  }

  if (idea.authorId !== req.user!.id) {
    res.status(403).json({ message: "Not your idea" });
    return;
  }

  if (idea.status === "APPROVED") {
    res.status(400).json({ message: "Cannot delete an approved idea" });
    return;
  }

  await prisma.idea.delete({ where: { id } });
  res.json({ message: "Idea deleted" });
});

export const submitForReview = catchAsync(async (req: Request, res: Response) => {
  const id = req.params["id"] as string;
  const idea = await prisma.idea.findUnique({ where: { id } });

  if (!idea) {
    res.status(404).json({ message: "Idea not found" });
    return;
  }

  if (idea.authorId !== req.user!.id) {
    res.status(403).json({ message: "Not your idea" });
    return;
  }

  if (idea.status !== "DRAFT" && idea.status !== "REJECTED") {
    res.status(400).json({ message: "Only draft or rejected ideas can be submitted for review" });
    return;
  }

  const updated = await prisma.idea.update({
    where: { id },
    data: { status: "UNDER_REVIEW", rejectionFeedback: null },
  });

  res.json(updated);
});

export const approveIdea = catchAsync(async (req: Request, res: Response) => {
  const id = req.params["id"] as string;
  const idea = await prisma.idea.findUnique({ where: { id } });
  if (!idea) {
    res.status(404).json({ message: "Idea not found" });
    return;
  }

  const updated = await prisma.idea.update({
    where: { id },
    data: { status: "APPROVED" },
  });

  res.json(updated);
});

export const rejectIdea = catchAsync(async (req: Request, res: Response) => {
  const id = req.params["id"] as string;
  const { feedback } = req.body;
  if (!feedback?.trim()) {
    res.status(400).json({ message: "Rejection feedback is required" });
    return;
  }

  const idea = await prisma.idea.findUnique({ where: { id } });
  if (!idea) {
    res.status(404).json({ message: "Idea not found" });
    return;
  }

  const updated = await prisma.idea.update({
    where: { id },
    data: { status: "REJECTED", rejectionFeedback: feedback.trim() },
  });

  res.json(updated);
});

export const getMyIdeas = catchAsync(async (req: Request, res: Response) => {
  const ideas = await prisma.idea.findMany({
    where: { authorId: req.user!.id },
    include: {
      category: { select: { id: true, name: true } },
      _count: { select: { votes: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json(ideas);
});

export const getAllIdeasAdmin = catchAsync(async (req: Request, res: Response) => {
  const { status, page = "1", limit = "20" } = req.query as Record<string, string>;
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

  res.json({ ideas, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
});
