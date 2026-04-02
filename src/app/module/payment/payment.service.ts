import Stripe from "stripe";
import { prisma } from "../../lib/prisma.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

const createCheckoutSession = async (ideaId: string, userId: string) => {
  const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
  if (!idea || !idea.isPaid || idea.status !== "APPROVED") return { invalid: true } as const;

  const existing = await prisma.purchase.findUnique({
    where: { userId_ideaId: { userId, ideaId } },
  });
  if (existing) return { alreadyOwned: true } as const;

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
    metadata: { ideaId, userId },
  });

  return { url: session.url };
};

const handleWebhook = async (rawBody: Buffer, signature: string) => {
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return { invalid: true } as const;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { ideaId, userId } = session.metadata!;

    await prisma.purchase.upsert({
      where: { userId_ideaId: { userId, ideaId } },
      update: {},
      create: { userId, ideaId, stripePaymentId: session.payment_intent as string },
    });
  }

  return { received: true } as const;
};

const checkPurchaseStatus = async (ideaId: string, userId: string) => {
  const purchase = await prisma.purchase.findUnique({
    where: { userId_ideaId: { userId, ideaId } },
  });
  return { purchased: Boolean(purchase) };
};

export const PaymentService = {
  createCheckoutSession,
  handleWebhook,
  checkPurchaseStatus,
};
