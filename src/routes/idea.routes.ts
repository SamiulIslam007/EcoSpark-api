import { Router } from "express";
import {
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
} from "../controllers/idea.controller.js";
import { protect } from "../middlewares/protect.middleware.js";
import { adminOnly } from "../middlewares/adminOnly.middleware.js";

const router = Router();

router.get("/", getApprovedIdeas);
router.get("/my", protect, getMyIdeas);
router.get("/admin/all", protect, adminOnly, getAllIdeasAdmin);
router.get("/:id", getIdeaById);
router.post("/", protect, createIdea);
router.patch("/:id", protect, updateIdea);
router.delete("/:id", protect, deleteIdea);
router.patch("/:id/submit", protect, submitForReview);
router.patch("/:id/approve", protect, adminOnly, approveIdea);
router.patch("/:id/reject", protect, adminOnly, rejectIdea);

export default router;
