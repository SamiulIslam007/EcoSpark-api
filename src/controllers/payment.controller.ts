import { Request, Response } from "express";
import Stripe from "stripe";
import { catchAsync } from "../lib/catchAsync";
import { prisma } from "../lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

export const createCheckoutSession = catchAsync(async (req: Request, res: Response) => {
  const { ideaId } = req.body;

  const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
  if (!idea || !idea.isPaid || idea.status !== "APPROVED") {
    res.status(400).json({ message: "Invalid idea for purchase" });
    return;
  }

  const existing = await prisma.purchase.findUnique({
    where: { userId_ideaId: { userId: req.user!.id, ideaId } },
  });
  if (existing) {
    res.status(400).json({ message: "You already own this idea" });
    return;
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: idea.title },
          unit_amount: Math.round(idea.price! * 100),
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${process.env.CLIENT_URL}/ideas/${ideaId}?purchase=success`,
    cancel_url: `${process.env.CLIENT_URL}/ideas/${ideaId}?purchase=canceled`,
    metadata: { ideaId, userId: req.user!.id },
  });

  res.json({ url: session.url });
});

export const stripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"];
  if (!sig) {
    res.status(400).json({ message: "Missing stripe signature" });
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig as string,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    res.status(400).json({ message: "Webhook signature verification failed" });
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { ideaId, userId } = session.metadata!;

    await prisma.purchase.upsert({
      where: { userId_ideaId: { userId, ideaId } },
      update: {},
      create: {
        userId,
        ideaId,
        stripePaymentId: session.payment_intent as string,
      },
    });
  }

  res.json({ received: true });
};

export const checkPurchaseStatus = catchAsync(async (req: Request, res: Response) => {
  const ideaId = req.params["ideaId"] as string;
  const purchase = await prisma.purchase.findUnique({
    where: { userId_ideaId: { userId: req.user!.id, ideaId } },
  });
  res.json({ purchased: Boolean(purchase) });
});
