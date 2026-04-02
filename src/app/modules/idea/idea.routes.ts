import { Router } from "express";
import { IdeaController } from "./idea.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { adminOnly } from "../../middlewares/adminOnly.middleware.js";
import { upload } from "../../middlewares/upload.middleware.js";

const router = Router();

router.get("/", IdeaController.getApprovedIdeas);
router.get("/my", protect, IdeaController.getMyIdeas);
router.get("/admin/all", protect, adminOnly, IdeaController.getAllIdeasAdmin);
router.get("/:id", IdeaController.getIdeaById);
router.post("/", protect, upload.array("images", 5), IdeaController.createIdea);
router.patch("/:id", protect, upload.array("images", 5), IdeaController.updateIdea);
router.delete("/:id", protect, IdeaController.deleteIdea);
router.patch("/:id/submit", protect, IdeaController.submitForReview);
router.patch("/:id/approve", protect, adminOnly, IdeaController.approveIdea);
router.patch("/:id/reject", protect, adminOnly, IdeaController.rejectIdea);

export default router;
