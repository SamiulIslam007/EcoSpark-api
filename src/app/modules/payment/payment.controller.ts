import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { PaymentService } from "./payment.service.js";

const createCheckoutSession = catchAsync(async (req: Request, res: Response) => {
  const { ideaId } = req.body;
  const result = await PaymentService.createCheckoutSession(ideaId, req.user!.id);

  if ("invalid" in result) { res.status(400).json({ message: "Invalid idea for purchase" }); return; }
  if ("alreadyOwned" in result) { res.status(400).json({ message: "You already own this idea" }); return; }

  res.json(result);
});

const stripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"];
  if (!sig) { res.status(400).json({ message: "Missing stripe signature" }); return; }

  const result = await PaymentService.handleWebhook(req.body as Buffer, sig as string);
  if ("invalid" in result) { res.status(400).json({ message: "Webhook signature verification failed" }); return; }

  res.json(result);
};

const checkPurchaseStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.checkPurchaseStatus(
    req.params["ideaId"] as string,
    req.user!.id
  );
  res.json(result);
});

export const PaymentController = {
  createCheckoutSession,
  stripeWebhook,
  checkPurchaseStatus,
};
