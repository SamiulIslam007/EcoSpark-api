import { Router } from "express";
import { CommentController } from "./comment.controller";
import { protect } from "../../middlewares/auth.middleware";

const router = Router();

router.get("/:ideaId", CommentController.getComments);
router.post("/:ideaId", protect, CommentController.createComment);
router.delete("/:id", protect, CommentController.deleteComment);

export default router;
