import Stripe from "stripe";
import Payment from "./payment.model.js";
import Order from "../order/order.model.js";
import { decrementByProductVariant } from "../stock/stock.service.js";
import { env } from "../../config/env.js";
import { Types } from "mongoose";

const stripe = new Stripe(env.STRIPE_SECRET_KEY); // ✅ plus de apiVersion ici

/** Convertit un montant en euros → en cents (entier) de manière sûre */
function toCents(amount: number) {
  return Math.round(amount * 100);
}

/** Crée un PaymentIntent pour l’ordre (retourne client_secret + intent id). */
export async function createStripeIntentForOrder(userId: string, orderId: string) {
  if (!Types.ObjectId.isValid(orderId)) throw new Error("ORDER_NOT_FOUND");

  const order = await Order.findOne({ _id: orderId, user_id: userId });
  if (!order) throw new Error("ORDER_NOT_FOUND");

  if (order.status !== "draft") throw new Error("ORDER_NOT_DRAFT");

  const amountTtc = order.totals?.ttc ?? 0;
  if (amountTtc <= 0) throw new Error("INVALID_TOTAL");

  const amountInCents = toCents(amountTtc);
  const currency = (order.currency || "EUR").toLowerCase();

  // Crée le PaymentIntent Stripe
  const intent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency,
    metadata: {
      order_id: String(order._id),
      user_id: String(order.user_id)
    },
    automatic_payment_methods: { enabled: true }
  });

  // Enregistre/Met à jour un paiement "pending" local (idempotent sur tx_ref)
  await Payment.findOneAndUpdate(
    { provider: "stripe", tx_ref: intent.id },
    {
      $setOnInsert: {
        order_id: order._id,
        provider: "stripe",
        status: "pending",
        amount: amountTtc,
        currency
      }
    },
    { upsert: true, new: true }
  );

  return { client_secret: intent.client_secret, intent_id: intent.id };
}

/**
 * Traite le webhook Stripe (idempotent).
 * - payment_intent.succeeded => Payment.succeeded, Order.paid, décrément du stock.
 * - payment_intent.payment_failed => Payment.failed (on ne change pas la commande).
 */
export async function handleStripeWebhook(payload: Buffer, signature: string | undefined) {
  if (!signature) throw new Error("NO_SIGNATURE");

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    const err: any = new Error("INVALID_SIGNATURE");
    err.code = "INVALID_SIGNATURE";
    throw err;
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const intent = event.data.object as Stripe.PaymentIntent;
      const txRef = intent.id;
      const orderId = intent.metadata?.order_id;

      const existing = await Payment.findOne({ provider: "stripe", tx_ref: txRef });
      if (existing && existing.status === "succeeded") {
        // déjà traité → idempotent
        return { ok: true, processed: false };
      }

      // Mettre à jour le paiement
      const payment = await Payment.findOneAndUpdate(
        { provider: "stripe", tx_ref: txRef },
        {
          $set: {
            status: "succeeded"
          }
        },
        { new: true }
      );

      // Si pas trouvé (rare), on crée
      const currency = intent.currency?.toUpperCase() || "EUR";
      const amount = (payment?.amount ?? (intent.amount_received ?? intent.amount) / 100) as number;

      const orderObjId = orderId && Types.ObjectId.isValid(orderId) ? new Types.ObjectId(orderId) : undefined;

      const payDoc = payment
        ? payment
        : await Payment.create({
            order_id: orderObjId,
            provider: "stripe",
            status: "succeeded",
            amount,
            currency,
            tx_ref: txRef
          });

      // Marquer la commande comme payée + décrémenter le stock
      if (orderObjId) {
        const order = await Order.findById(orderObjId);
        if (order && order.status === "draft") {
          // décrément stock pour chaque ligne
          for (const line of order.lines) {
            const updated = await decrementByProductVariant(String(line.bouquet_id), line.variant_code || "", line.qty);
            if (!updated) {
              // Si stock insuffisant, tu peux choisir d'alerter, mais on ne "rollback" pas le paiement.
              // Log/monitoring ici.
            }
          }
          order.status = "paid";
          await order.save();
        }
      }

      return { ok: true, processed: true, payment_id: payDoc?._id };
    }

    case "payment_intent.payment_failed": {
      const intent = event.data.object as Stripe.PaymentIntent;
      const txRef = intent.id;

      await Payment.findOneAndUpdate(
        { provider: "stripe", tx_ref: txRef },
        { $set: { status: "failed" } },
        { upsert: true }
      );
      return { ok: true, processed: true };
    }

    default:
      return { ok: true, ignored: true, type: event.type };
  }
}

/** Liste les paiements liés à une commande (admin ou propriétaire). */
export async function listPaymentsForOrder(requester: { id: string; role: string }, orderId: string) {
  if (!Types.ObjectId.isValid(orderId)) return [];

  const order = await Order.findById(orderId).select("user_id");
  if (!order) return [];

  // si pas admin, vérifier ownership
  if (requester.role !== "admin" && String(order.user_id) !== requester.id) {
    throw new Error("FORBIDDEN");
  }

  return Payment.find({ order_id: orderId }).sort({ created_at: -1 }).lean();
}
