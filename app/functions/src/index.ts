import { onRequest } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import Stripe from 'stripe';

initializeApp();
const db = getFirestore();

const B2B_PLANS: Record<string, { name: string; unitAmountCents: number; seats: number }> = {
  micro_pyme: {
    name: 'SuriLearn Micro-PYME (10 puestos)',
    unitAmountCents: 4900,
    seats: 10,
  },
  growth_pyme: {
    name: 'SuriLearn Growth PYME (30 puestos)',
    unitAmountCents: 11900,
    seats: 30,
  },
  enterprise: {
    name: 'SuriLearn Enterprise Centinela (100 puestos)',
    unitAmountCents: 24900,
    seats: 100,
  },
};

function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY no configurada en secretos de Cloud Functions.');
  }
  return new Stripe(key);
}

export const createCheckoutSession = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const stripe = getStripeClient();
    const { plan, userId, userEmail, returnUrl } = req.body || {};
    const resolvedPlan = plan === 'annual' ? 'annual' : 'monthly';
    const origin = typeof returnUrl === 'string' && returnUrl ? returnUrl : 'https://surilearn-9b60e.web.app';

    const priceId =
      resolvedPlan === 'annual'
        ? process.env.STRIPE_PRICE_ANNUAL
        : process.env.STRIPE_PRICE_MONTHLY;

    const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = priceId
      ? { price: priceId, quantity: 1 }
      : {
          price_data: {
            currency: 'usd',
            unit_amount: resolvedPlan === 'annual' ? 3999 : 499,
            recurring: { interval: resolvedPlan === 'annual' ? 'year' : 'month' },
            product_data: {
              name: resolvedPlan === 'annual' ? 'SuriPro Centinela Anual' : 'SuriPro Centinela Mensual',
            },
          },
          quantity: 1,
        };

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [lineItem],
      success_url: `${origin}/tabs/shop?session_id={CHECKOUT_SESSION_ID}&status=success&plan=${resolvedPlan}`,
      cancel_url: `${origin}/tabs/shop?status=cancelled`,
      client_reference_id: userId ? String(userId) : undefined,
      customer_email: userEmail ? String(userEmail) : undefined,
      subscription_data: resolvedPlan === 'monthly' ? { trial_period_days: 7 } : undefined,
      metadata: {
        userId: String(userId || ''),
        plan: resolvedPlan,
        type: 'b2c_individual',
      },
    });

    res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Error creando sesión de pago' });
  }
});

export const createB2BCheckoutSession = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const stripe = getStripeClient();
    const { plan, orgId, orgName, adminEmail, adminUid, seats, returnUrl } = req.body || {};
    const resolvedPlan = plan in B2B_PLANS ? plan : 'micro_pyme';
    const planCfg = B2B_PLANS[resolvedPlan];
    const origin = typeof returnUrl === 'string' && returnUrl ? returnUrl : 'https://surilearn-9b60e.web.app';
    const assignedSeats = Number(seats) || planCfg.seats;

    const priceMap: Record<string, string | undefined> = {
      micro_pyme: process.env.STRIPE_PRICE_MICRO_PYME,
      growth_pyme: process.env.STRIPE_PRICE_GROWTH_PYME,
      enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
    };
    const configuredPriceId = priceMap[resolvedPlan];

    const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = configuredPriceId
      ? { price: configuredPriceId, quantity: 1 }
      : {
          price_data: {
            currency: 'usd',
            unit_amount: planCfg.unitAmountCents,
            recurring: { interval: 'month' },
            product_data: { name: planCfg.name },
          },
          quantity: 1,
        };

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [lineItem],
      success_url: `${origin}/tabs/organization?session_id={CHECKOUT_SESSION_ID}&status=success&plan=${resolvedPlan}&orgId=${encodeURIComponent(String(orgId || ''))}`,
      cancel_url: `${origin}/tabs/organization?status=cancelled`,
      client_reference_id: adminUid ? String(adminUid) : undefined,
      customer_email: adminEmail ? String(adminEmail) : undefined,
      metadata: {
        orgId: String(orgId || ''),
        orgName: String(orgName || ''),
        plan: resolvedPlan,
        seats: String(assignedSeats),
        type: 'b2b_organization',
      },
    });

    res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Error creando sesión corporativa' });
  }
});

export const verifyCheckoutSession = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ verified: false, error: 'Method Not Allowed' });
    return;
  }

  try {
    const sessionId = String(req.query.session_id || '');
    if (!sessionId || !sessionId.startsWith('cs_')) {
      res.status(400).json({ verified: false, error: 'session_id inválido.' });
      return;
    }

    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const verified =
      session.status === 'complete' &&
      (session.payment_status === 'paid' || session.payment_status === 'no_payment_required');

    res.status(200).json({
      verified,
      paymentStatus: session.payment_status,
      plan: session.metadata?.plan,
      userId: session.client_reference_id || session.metadata?.userId,
      orgId: session.metadata?.orgId,
      mode: session.mode,
    });
  } catch (err: any) {
    res.status(500).json({ verified: false, error: err?.message || 'Error verificando sesión' });
  }
});

export const stripeWebhook = onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers['stripe-signature'];
  if (!webhookSecret || !sig) {
    res.status(400).send('Falta firma Stripe o STRIPE_WEBHOOK_SECRET');
    return;
  }

  try {
    const stripe = getStripeClient();
    const event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const meta = session.metadata || {};

      if (meta.type === 'b2b_organization' && meta.orgId) {
        const plan = meta.plan in B2B_PLANS ? meta.plan : 'micro_pyme';
        const seats = Number(meta.seats) || B2B_PLANS[plan].seats;
        await db.collection('organizations').doc(meta.orgId).set(
          {
            plan,
            maxSeats: seats,
            subscriptionStatus: 'active',
            stripeCustomerId: session.customer ? String(session.customer) : null,
            stripeSubscriptionId: session.subscription ? String(session.subscription) : null,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      } else {
        const uid = session.client_reference_id || meta.userId;
        if (uid) {
          const expires = new Date();
          if (meta.plan === 'annual') {
            expires.setFullYear(expires.getFullYear() + 1);
          } else {
            expires.setMonth(expires.getMonth() + 1);
          }
          await db.collection('users').doc(uid).set(
            {
              isPro: true,
              proPlan: meta.plan === 'annual' ? 'annual' : 'monthly',
              proExpiresAt: expires.toISOString(),
              hearts: 5,
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (err: any) {
    res.status(400).send(`Webhook Error: ${err?.message || 'Firma inválida'}`);
  }
});
