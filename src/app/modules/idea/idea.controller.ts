import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { IdeaService } from "./idea.service";
import { IGetIdeasQuery } from "./idea.interface";
import { uploadToCloudinary } from "../../utils/cloudinary";

const getApprovedIdeas = catchAsync(async (req: Request, res: Response) => {
  const result = await IdeaService.getApprovedIdeas(req.query as IGetIdeasQuery);
  res.json(result);
});

const getIdeaById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params["id"] as string;
  const result = await IdeaService.getIdeaById(id, req.user?.id, req.user?.role);

  if (!result) {
    res.status(404).json({ message: "Idea not found" });
    return;
  }

  if ("requiresAuth" in result) {
    res.status(401).json({ message: "Login required to view this idea" });
    return;
  }

  if ("requiresPurchase" in result) {
    res.status(403).json({ message: "Purchase required", needsPurchase: true, ...result });
    return;
  }

  res.json(result);
});

const createIdea = catchAsync(async (req: Request, res: Response) => {
  const { title, problemStatement, proposedSolution, description, categoryId, isPaid, price } = req.body;

  if (!title || !problemStatement || !proposedSolution || !description || !categoryId) {
    res.status(400).json({ message: "All required fields must be filled" });
    return;
  }

  if (isPaid && (!price || Number(price) <= 0)) {
    res.status(400).json({ message: "Paid ideas require a valid price" });
    return;
  }

  // Upload any attached image files to Cloudinary
  const files = req.files as Express.Multer.File[] | undefined;
  let imageUrls: string[] = req.body.images ?? [];
  if (files && files.length > 0) {
    imageUrls = await Promise.all(files.map((f) => uploadToCloudinary(f.buffer)));
  }

  const idea = await IdeaService.createIdea({ ...req.body, images: imageUrls }, req.user!.id);
  res.status(201).json(idea);
});

const updateIdea = catchAsync(async (req: Request, res: Response) => {
  // Upload newly attached images to Cloudinary
  const files = req.files as Express.Multer.File[] | undefined;
  let imageUrls: string[] | undefined = req.body.images;
  if (files && files.length > 0) {
    imageUrls = await Promise.all(files.map((f) => uploadToCloudinary(f.buffer)));
  }

  const result = await IdeaService.updateIdea(
    req.params["id"] as string,
    { ...req.body, ...(imageUrls !== undefined && { images: imageUrls }) },
    req.user!.id
  );

  if ("notFound" in result) { res.status(404).json({ message: "Idea not found" }); return; }
  if ("forbidden" in result) { res.status(403).json({ message: "Not your idea" }); return; }
  if ("conflict" in result) { res.status(400).json({ message: "Cannot edit an approved or under-review idea" }); return; }

  res.json(result);
});

const deleteIdea = catchAsync(async (req: Request, res: Response) => {
  const result = await IdeaService.deleteIdea(req.params["id"] as string, req.user!.id);

  if ("notFound" in result) { res.status(404).json({ message: "Idea not found" }); return; }
  if ("forbidden" in result) { res.status(403).json({ message: "Not your idea" }); return; }
  if ("conflict" in result) { res.status(400).json({ message: "Cannot delete an approved idea" }); return; }

  res.json({ message: "Idea deleted" });
});

const submitForReview = catchAsync(async (req: Request, res: Response) => {
  const result = await IdeaService.submitForReview(req.params["id"] as string, req.user!.id);

  if ("notFound" in result) { res.status(404).json({ message: "Idea not found" }); return; }
  if ("forbidden" in result) { res.status(403).json({ message: "Not your idea" }); return; }
  if ("conflict" in result) { res.status(400).json({ message: "Only draft or rejected ideas can be submitted for review" }); return; }

  res.json(result);
});

const approveIdea = catchAsync(async (req: Request, res: Response) => {
  const idea = await IdeaService.approveIdea(req.params["id"] as string);
  if (!idea) { res.status(404).json({ message: "Idea not found" }); return; }
  res.json(idea);
});

const rejectIdea = catchAsync(async (req: Request, res: Response) => {
  const { feedback } = req.body;
  if (!feedback?.trim()) {
    res.status(400).json({ message: "Rejection feedback is required" });
    return;
  }
  const idea = await IdeaService.rejectIdea(req.params["id"] as string, feedback);
  if (!idea) { res.status(404).json({ message: "Idea not found" }); return; }
  res.json(idea);
});

const getMyIdeas = catchAsync(async (req: Request, res: Response) => {
  const ideas = await IdeaService.getMyIdeas(req.user!.id);
  res.json(ideas);
});

const getAllIdeasAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await IdeaService.getAllIdeasAdmin(req.query as Record<string, string>);
  res.json(result);
});

export const IdeaController = {
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
