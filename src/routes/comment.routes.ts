import { Router } from "express";
import {
  getComments,
  createComment,
  deleteComment,
} from "../controllers/comment.controller";
import { protect } from "../middlewares/protect.middleware";

const router = Router();

router.get("/:ideaId", getComments);
router.post("/:ideaId", protect, createComment);
router.delete("/:id", protect, deleteComment);

export default router;
