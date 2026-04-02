import { Request, Response } from "express";
import { catchAsync } from "../../lib/catchAsync.js";
import { VoteService } from "./vote.service.js";
import { VoteType } from "./vote.interface.js";

const castVote = catchAsync(async (req: Request, res: Response) => {
  const ideaId = req.params["ideaId"] as string;
  const { type } = req.body as { type?: VoteType };

  if (type !== "UPVOTE" && type !== "DOWNVOTE") {
    res.status(400).json({ message: "Vote type must be UPVOTE or DOWNVOTE" });
    return;
  }

  const result = await VoteService.castVote(ideaId, req.user!.id, type);

  if ("notFound" in result) {
    res.status(404).json({ message: "Idea not found" });
    return;
  }

  if ("removed" in result) {
    res.json({ message: "Vote removed" });
    return;
  }

  res.status(201).json(result);
});

const getVotesForIdea = catchAsync(async (req: Request, res: Response) => {
  const votes = await VoteService.getVotesForIdea(req.params["ideaId"] as string);
  res.json(votes);
});

export const VoteController = {
  castVote,
  getVotesForIdea,
};
