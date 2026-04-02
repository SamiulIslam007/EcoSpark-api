import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { CommentService } from "./comment.service.js";

const getComments = catchAsync(async (req: Request, res: Response) => {
  const comments = await CommentService.getComments(req.params["ideaId"] as string);
  res.json(comments);
});

const createComment = catchAsync(async (req: Request, res: Response) => {
  const ideaId = req.params["ideaId"] as string;
  const { content, parentId } = req.body;

  if (!content?.trim()) {
    res.status(400).json({ message: "Comment content is required" });
    return;
  }

  const result = await CommentService.createComment(ideaId, content, req.user!.id, parentId);

  if ("notFound" in result) { res.status(404).json({ message: "Idea not found" }); return; }
  if ("invalidParent" in result) { res.status(400).json({ message: "Invalid parent comment" }); return; }

  res.status(201).json(result);
});

const deleteComment = catchAsync(async (req: Request, res: Response) => {
  const result = await CommentService.deleteComment(
    req.params["id"] as string,
    req.user!.id,
    req.user!.role
  );

  if ("notFound" in result) { res.status(404).json({ message: "Comment not found" }); return; }
  if ("forbidden" in result) { res.status(403).json({ message: "Not authorized to delete this comment" }); return; }

  res.json({ message: "Comment deleted" });
});

export const CommentController = {
  getComments,
  createComment,
  deleteComment,
};
