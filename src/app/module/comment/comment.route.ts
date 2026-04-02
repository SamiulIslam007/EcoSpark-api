import { Router } from "express";
import { CommentController } from "./comment.controller.js";
import { protect } from "../../middleware/auth.middleware.js";

const router = Router();

router.get("/:ideaId", CommentController.getComments);
router.post("/:ideaId", protect, CommentController.createComment);
router.delete("/:id", protect, CommentController.deleteComment);

export default router;
