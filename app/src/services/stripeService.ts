/**
 * SuriLearn - Servicio de Integración Segura con Stripe Checkout
 * Todas las llamadas a Stripe se delegan al backend (/api/*) para nunca exponer llaves secretas en el cliente.
 */

export type SuriProPlan = 'monthly' | 'annual';

export interface CheckoutSessionOptions {
  plan: SuriProPlan;
  userId: string;
  userEmail?: string | null;
}

export interface CheckoutSessionResult {
  sessionId: string;
  url: string;
}

export interface VerifySessionResult {
  verified: boolean;
  paymentStatus?: string;
  plan?: string;
  userId?: string;
  orgId?: string;
  mode?: string;
  error?: string;
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

async function parseJsonResponse(response: Response): Promise<Record<string, any>> {
  const raw = await response.text();
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return { error: raw || `Error HTTP ${response.status}` };
  }
}

/**
 * Solicita al servidor seguro una sesión de Stripe Checkout para SuriPro B2C
 */
export async function createCheckoutSession(
  options: CheckoutSessionOptions
): Promise<CheckoutSessionResult> {
  const { plan, userId, userEmail } = options;
  const returnUrl = window.location.origin;

  const response = await fetch(`${API_BASE}/api/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      plan,
      userId,
      userEmail: userEmail || undefined,
      returnUrl,
    }),
  });

  const data = await parseJsonResponse(response);

  if (!response.ok || !data.url) {
    throw new Error(
      data.error ||
        'No se pudo generar la sesión de pago en el servidor. Verifica STRIPE_SECRET_KEY y el endpoint /api/create-checkout-session.'
    );
  }

  return {
    sessionId: data.sessionId,
    url: data.url,
  };
}

/**
 * Inicia el flujo de suscripción B2C y redirige al usuario a Stripe Checkout
 */
export async function redirectToStripeCheckout(
  options: CheckoutSessionOptions
): Promise<void> {
  const session = await createCheckoutSession(options);
  if (session.url) {
    window.location.href = session.url;
  } else {
    throw new Error('No se recibió la URL de redirección de Stripe');
  }
}

// ==========================================
// B2B SAAS CORPORATE STRIPE PLANS
// ==========================================

export type B2BPlan = 'micro_pyme' | 'growth_pyme' | 'enterprise';

export interface B2BCheckoutOptions {
  plan: B2BPlan;
  orgId: string;
  orgName: string;
  adminEmail: string;
  adminUid: string;
  seats?: number;
}

export const B2B_PLANS_CONFIG: Record<
  B2BPlan,
  { name: string; seats: number; priceMonthlyUsd: number; description: string; features: string[] }
> = {
  micro_pyme: {
    name: 'Micro-PYME',
    seats: 10,
    priceMonthlyUsd: 49,
    description: 'Hasta 10 colaboradores con entrenamiento continuo y telemetría de phishing.',
    features: ['10 Puestos corporativos', 'Misiones ilimitadas', 'Liga privada de empresa', 'Dashboard CISO'],
  },
  growth_pyme: {
    name: 'Growth PYME',
    seats: 30,
    priceMonthlyUsd: 119,
    description: 'Hasta 30 puestos, ligas privadas de empresa y reportes ejecutivos CISO.',
    features: ['30 Puestos corporativos', 'Ligas privadas y torneos', 'Métricas de riesgo individuales', 'Soporte prioritario'],
  },
  enterprise: {
    name: 'Enterprise Centinela',
    seats: 100,
    priceMonthlyUsd: 249,
    description: 'Hasta 100 puestos corporativos, SLA prioritario y módulos avanzados.',
    features: ['100 Puestos corporativos', 'Módulos corporativos a medida', 'Acceso API y SSO', 'SLA 99.9%'],
  },
};

/**
 * Solicita al servidor seguro una sesión de Stripe Checkout para planes B2B PYME
 */
export async function createB2BCheckoutSession(
  options: B2BCheckoutOptions
): Promise<CheckoutSessionResult> {
  const { plan, orgId, orgName, adminEmail, adminUid, seats } = options;
  const returnUrl = window.location.origin;
  const planCfg = B2B_PLANS_CONFIG[plan] || B2B_PLANS_CONFIG.micro_pyme;
  const assignedSeats = seats || planCfg.seats;

  const response = await fetch(`${API_BASE}/api/create-b2b-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      plan,
      orgId,
      orgName,
      adminEmail,
      adminUid,
      seats: assignedSeats,
      returnUrl,
    }),
  });

  const data = await parseJsonResponse(response);

  if (!response.ok || !data.url) {
    throw new Error(
      data.error ||
        'No se pudo generar la sesión de pago corporativa. Verifica el backend de Stripe (/api/create-b2b-checkout-session).'
    );
  }

  return {
    sessionId: data.sessionId,
    url: data.url,
  };
}

export async function redirectToB2BStripeCheckout(
  options: B2BCheckoutOptions
): Promise<void> {
  const session = await createB2BCheckoutSession(options);
  if (session.url) {
    window.location.href = session.url;
  } else {
    throw new Error('No se recibió la URL de redirección de Stripe');
  }
}

/**
 * Verifica en el servidor que una sesión de Stripe Checkout realmente fue pagada o iniciada en trial
 */
export async function verifyCheckoutSession(sessionId: string): Promise<VerifySessionResult> {
  if (!sessionId || !sessionId.startsWith('cs_')) {
    return {
      verified: false,
      error: 'Identificador de sesión de pago inválido.',
    };
  }

  const response = await fetch(
    `${API_BASE}/api/verify-checkout-session?session_id=${encodeURIComponent(sessionId)}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    }
  );

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    return {
      verified: false,
      error: data.error || 'No se pudo confirmar la sesión con Stripe.',
    };
  }

  return {
    verified: Boolean(data.verified),
    paymentStatus: data.paymentStatus,
    plan: data.plan,
    userId: data.userId,
    orgId: data.orgId,
    mode: data.mode,
    error: data.error,
  };
}
