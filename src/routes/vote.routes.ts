import { Router } from "express";
import { castVote, getVotesForIdea } from "../controllers/vote.controller.js";
import { protect } from "../middlewares/protect.middleware.js";

const router = Router();

router.get("/:ideaId", getVotesForIdea);
router.post("/:ideaId", protect, castVote);

export default router;
