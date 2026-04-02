import { Router } from "express";
import {
  getComments,
  createComment,
  deleteComment,
} from "../controllers/comment.controller.js";
import { protect } from "../middlewares/protect.middleware.js";

const router = Router();

router.get("/:ideaId", getComments);
router.post("/:ideaId", protect, createComment);
router.delete("/:id", protect, deleteComment);

export default router;
