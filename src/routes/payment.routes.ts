import { Router } from "express";
import { createCheckoutSession, stripeWebhook, checkPurchaseStatus } from "../controllers/payment.controller.js";
import { protect } from "../middlewares/protect.middleware.js";

const router = Router();

router.post("/webhook", stripeWebhook);
router.post("/checkout", protect, createCheckoutSession);
router.get("/status/:ideaId", protect, checkPurchaseStatus);

export default router;
