import { Router } from "express";
import { castVote, getVotesForIdea } from "../controllers/vote.controller";
import { protect } from "../middlewares/protect.middleware";

const router = Router();

router.get("/:ideaId", getVotesForIdea);
router.post("/:ideaId", protect, castVote);

export default router;
