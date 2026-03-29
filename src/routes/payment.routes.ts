import { Router } from "express";
import { createCheckoutSession, stripeWebhook, checkPurchaseStatus } from "../controllers/payment.controller";
import { protect } from "../middlewares/protect.middleware";

const router = Router();

router.post("/webhook", stripeWebhook);
router.post("/checkout", protect, createCheckoutSession);
router.get("/status/:ideaId", protect, checkPurchaseStatus);

export default router;
