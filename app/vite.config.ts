import { defineConfig, loadEnv, Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import type { IncomingMessage, ServerResponse } from 'node:http';

const B2B_PLAN_META: Record<string, { name: string; unitAmountUsdCents: number; seats: number }> = {
  micro_pyme: {
    name: 'SuriLearn Micro-PYME (Hasta 10 puestos)',
    unitAmountUsdCents: 4900,
    seats: 10,
  },
  growth_pyme: {
    name: 'SuriLearn Growth PYME (Hasta 30 puestos)',
    unitAmountUsdCents: 11900,
    seats: 30,
  },
  enterprise: {
    name: 'SuriLearn Enterprise Centinela (Hasta 100 puestos)',
    unitAmountUsdCents: 24900,
    seats: 100,
  },
};

function readJsonBody(req: IncomingMessage): Promise<Record<string, any>> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, statusCode: number, payload: Record<string, any>) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function stripeCheckoutPlugin(env: Record<string, string>): Plugin {
  let warnedLegacyEnv = false;

  const getStripeSecret = (): string => {
    const serverSecret = env.STRIPE_SECRET_KEY || '';
    if (serverSecret) return serverSecret;

    const legacySecret = env.VITE_STRIPE_SECRET_KEY || '';
    if (legacySecret && !warnedLegacyEnv) {
      warnedLegacyEnv = true;
      console.warn(
        '[Stripe Dev Server] AVISO: Renombra VITE_STRIPE_SECRET_KEY a STRIPE_SECRET_KEY en .env para evitar exponerla en builds.'
      );
    }
    return legacySecret;
  };

  return {
    name: 'stripe-checkout-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const reqPath = (req.url || '').split('?')[0];

        if (reqPath === '/api/create-checkout-session' && req.method === 'POST') {
          try {
            const data = await readJsonBody(req);
            const plan = data.plan === 'annual' ? 'annual' : 'monthly';
            const secretKey = getStripeSecret();

            if (!secretKey) {
              return sendJson(res, 500, {
                error: 'STRIPE_SECRET_KEY no configurada en el archivo .env del servidor.',
              });
            }

            const priceId =
              plan === 'annual'
                ? env.STRIPE_PRICE_ANNUAL || env.VITE_STRIPE_PRICE_ANNUAL || ''
                : env.STRIPE_PRICE_MONTHLY || env.VITE_STRIPE_PRICE_MONTHLY || '';

            const origin = data.returnUrl || 'http://localhost:3000';
            const params = new URLSearchParams();
            params.append('mode', 'subscription');

            if (priceId) {
              params.append('line_items[0][price]', priceId);
            } else {
              params.append('line_items[0][price_data][currency]', 'usd');
              params.append(
                'line_items[0][price_data][unit_amount]',
                plan === 'annual' ? '3999' : '499'
              );
              params.append(
                'line_items[0][price_data][recurring][interval]',
                plan === 'annual' ? 'year' : 'month'
              );
              params.append(
                'line_items[0][price_data][product_data][name]',
                plan === 'annual' ? 'SuriPro Centinela Anual' : 'SuriPro Centinela Mensual'
              );
            }

            params.append('line_items[0][quantity]', '1');
            params.append(
              'success_url',
              `${origin}/tabs/shop?session_id={CHECKOUT_SESSION_ID}&status=success&plan=${plan}`
            );
            params.append('cancel_url', `${origin}/tabs/shop?status=cancelled`);

            if (data.userId) {
              params.append('client_reference_id', String(data.userId));
              params.append('metadata[userId]', String(data.userId));
            }
            if (data.userEmail) {
              params.append('customer_email', String(data.userEmail));
            }
            if (plan === 'monthly') {
              params.append('subscription_data[trial_period_days]', '7');
            }
            params.append('metadata[plan]', plan);
            params.append('metadata[type]', 'b2c_individual');

            const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${secretKey}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: params.toString(),
            });

            const session = await stripeRes.json();
            if (!stripeRes.ok) {
              return sendJson(res, stripeRes.status, {
                error: session.error?.message || 'Error de Stripe',
              });
            }

            return sendJson(res, 200, {
              sessionId: session.id,
              url: session.url,
            });
          } catch (err: any) {
            return sendJson(res, 500, { error: err.message || 'Error en servidor' });
          }
        }

        if (reqPath === '/api/create-b2b-checkout-session' && req.method === 'POST') {
          try {
            const data = await readJsonBody(req);
            const plan = data.plan in B2B_PLAN_META ? data.plan : 'micro_pyme';
            const planCfg = B2B_PLAN_META[plan];
            const secretKey = getStripeSecret();

            if (!secretKey) {
              return sendJson(res, 500, {
                error: 'STRIPE_SECRET_KEY no configurada en el archivo .env del servidor.',
              });
            }

            const priceEnvMap: Record<string, string | undefined> = {
              micro_pyme: env.STRIPE_PRICE_MICRO_PYME,
              growth_pyme: env.STRIPE_PRICE_GROWTH_PYME,
              enterprise: env.STRIPE_PRICE_ENTERPRISE,
            };
            const configuredPriceId = priceEnvMap[plan] || '';
            const origin = data.returnUrl || 'http://localhost:3000';
            const assignedSeats = Number(data.seats) || planCfg.seats;

            const params = new URLSearchParams();
            params.append('mode', 'subscription');

            if (configuredPriceId) {
              params.append('line_items[0][price]', configuredPriceId);
            } else {
              params.append('line_items[0][price_data][currency]', 'usd');
              params.append('line_items[0][price_data][unit_amount]', String(planCfg.unitAmountUsdCents));
              params.append('line_items[0][price_data][recurring][interval]', 'month');
              params.append('line_items[0][price_data][product_data][name]', planCfg.name);
            }

            params.append('line_items[0][quantity]', '1');
            params.append(
              'success_url',
              `${origin}/tabs/organization?session_id={CHECKOUT_SESSION_ID}&status=success&plan=${plan}&orgId=${encodeURIComponent(String(data.orgId || ''))}`
            );
            params.append('cancel_url', `${origin}/tabs/organization?status=cancelled`);

            if (data.adminUid) {
              params.append('client_reference_id', String(data.adminUid));
              params.append('metadata[adminUid]', String(data.adminUid));
            }
            if (data.adminEmail) {
              params.append('customer_email', String(data.adminEmail));
            }

            params.append('metadata[orgId]', String(data.orgId || ''));
            params.append('metadata[orgName]', String(data.orgName || ''));
            params.append('metadata[plan]', plan);
            params.append('metadata[seats]', String(assignedSeats));
            params.append('metadata[type]', 'b2b_organization');

            const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${secretKey}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: params.toString(),
            });

            const session = await stripeRes.json();
            if (!stripeRes.ok) {
              return sendJson(res, stripeRes.status, {
                error: session.error?.message || 'Error de Stripe B2B',
              });
            }

            return sendJson(res, 200, {
              sessionId: session.id,
              url: session.url,
            });
          } catch (err: any) {
            return sendJson(res, 500, { error: err.message || 'Error en servidor B2B' });
          }
        }

        if (reqPath === '/api/verify-checkout-session' && req.method === 'GET') {
          try {
            const parsedUrl = new URL(req.url || '', 'http://localhost');
            const sessionId = parsedUrl.searchParams.get('session_id') || '';

            if (!sessionId || !sessionId.startsWith('cs_')) {
              return sendJson(res, 400, {
                verified: false,
                error: 'Parámetro session_id inválido o ausente.',
              });
            }

            const secretKey = getStripeSecret();
            if (!secretKey) {
              return sendJson(res, 500, {
                verified: false,
                error: 'STRIPE_SECRET_KEY no configurada en el servidor.',
              });
            }

            const stripeRes = await fetch(
              `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
              {
                method: 'GET',
                headers: {
                  Authorization: `Bearer ${secretKey}`,
                },
              }
            );

            const session = await stripeRes.json();
            if (!stripeRes.ok) {
              return sendJson(res, stripeRes.status, {
                verified: false,
                error: session.error?.message || 'Sesión no encontrada en Stripe.',
              });
            }

            const isPaidOrTrial =
              session.status === 'complete' &&
              (session.payment_status === 'paid' || session.payment_status === 'no_payment_required');

            return sendJson(res, 200, {
              verified: isPaidOrTrial,
              paymentStatus: session.payment_status,
              plan: session.metadata?.plan,
              userId: session.client_reference_id || session.metadata?.userId,
              orgId: session.metadata?.orgId,
              mode: session.mode,
            });
          } catch (err: any) {
            return sendJson(res, 500, {
              verified: false,
              error: err.message || 'Error verificando sesión de pago',
            });
          }
        }

        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [vue(), stripeCheckoutPlugin(env)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      host: true,
    },
  };
});
