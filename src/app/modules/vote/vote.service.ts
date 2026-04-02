import { prisma } from "../../utils/prisma";

const castVote = async (ideaId: string, userId: string, type: "UPVOTE" | "DOWNVOTE") => {
  const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
  if (!idea || idea.status !== "APPROVED") return { notFound: true } as const;

  const existing = await prisma.vote.findUnique({
    where: { userId_ideaId: { userId, ideaId } },
  });

  if (existing) {
    if (existing.type === type) {
      await prisma.vote.delete({ where: { id: existing.id } });
      return { removed: true } as const;
    }
    return prisma.vote.update({ where: { id: existing.id }, data: { type } });
  }

  return prisma.vote.create({ data: { type, userId, ideaId } });
};

const getVotesForIdea = async (ideaId: string) => {
  return prisma.vote.findMany({
    where: { ideaId },
    select: { userId: true, type: true },
  });
};

export const VoteService = {
  castVote,
  getVotesForIdea,
};
