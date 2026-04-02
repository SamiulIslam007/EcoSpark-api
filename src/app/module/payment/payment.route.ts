import { Router } from "express";
import { PaymentController } from "./payment.controller.js";
import { protect } from "../../middleware/auth.middleware.js";

const router = Router();

router.post("/webhook", PaymentController.stripeWebhook);
router.post("/checkout", protect, PaymentController.createCheckoutSession);
router.get("/status/:ideaId", protect, PaymentController.checkPurchaseStatus);

export default router;
