import { Request, Response } from "express";
import { catchAsync } from "../lib/catchAsync.js";
import { prisma } from "../lib/prisma.js";

export const castVote = catchAsync(async (req: Request, res: Response) => {
  const ideaId = req.params["ideaId"] as string;
  const { type } = req.body;

  if (type !== "UPVOTE" && type !== "DOWNVOTE") {
    res.status(400).json({ message: "Vote type must be UPVOTE or DOWNVOTE" });
    return;
  }

  const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
  if (!idea || idea.status !== "APPROVED") {
    res.status(404).json({ message: "Idea not found" });
    return;
  }

  const existing = await prisma.vote.findUnique({
    where: { userId_ideaId: { userId: req.user!.id, ideaId } },
  });

  if (existing) {
    if (existing.type === type) {
      await prisma.vote.delete({ where: { id: existing.id } });
      res.json({ message: "Vote removed" });
      return;
    }
    const updated = await prisma.vote.update({ where: { id: existing.id }, data: { type } });
    res.json(updated);
    return;
  }

  const vote = await prisma.vote.create({ data: { type, userId: req.user!.id, ideaId } });
  res.status(201).json(vote);
});

export const getVotesForIdea = catchAsync(async (req: Request, res: Response) => {
  const ideaId = req.params["ideaId"] as string;
  const votes = await prisma.vote.findMany({
    where: { ideaId },
    select: { userId: true, type: true },
  });
  res.json(votes);
});
