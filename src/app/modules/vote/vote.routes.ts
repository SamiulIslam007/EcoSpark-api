import { Router } from "express";
import { VoteController } from "./vote.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/:ideaId", VoteController.getVotesForIdea);
router.post("/:ideaId", protect, VoteController.castVote);

export default router;
