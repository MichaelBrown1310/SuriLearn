import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { translateAuthError } from '../utils/authErrors';
import { B2B_PLANS_CONFIG } from '../services/stripeService';

describe('Authentication Error Translations & Stripe Client Hygiene', () => {
  it('translates Firebase Auth error codes into clear Spanish messages', () => {
    expect(translateAuthError({ code: 'auth/invalid-credential' })).toContain('Correo o contraseña');
    expect(translateAuthError({ code: 'auth/email-already-in-use' })).toContain('ya está registrado');
    expect(translateAuthError({ code: 'auth/weak-password' })).toContain('al menos 6 caracteres');
    expect(translateAuthError({ code: 'auth/network-request-failed' })).toContain('Sin conexión');
  });

  it('keeps consistent B2B SaaS plan tiers, seats, and pricing', () => {
    expect(B2B_PLANS_CONFIG.micro_pyme.priceMonthlyUsd).toBe(49);
    expect(B2B_PLANS_CONFIG.micro_pyme.seats).toBe(10);

    expect(B2B_PLANS_CONFIG.growth_pyme.priceMonthlyUsd).toBe(119);
    expect(B2B_PLANS_CONFIG.growth_pyme.seats).toBe(30);

    expect(B2B_PLANS_CONFIG.enterprise.priceMonthlyUsd).toBe(249);
    expect(B2B_PLANS_CONFIG.enterprise.seats).toBe(100);
  });

  it('never references Stripe secret keys or direct api.stripe.com calls in stripeService.ts', () => {
    const serviceSource = fs.readFileSync(
      path.resolve(__dirname, '../services/stripeService.ts'),
      'utf-8'
    );
    expect(serviceSource).not.toMatch(/VITE_STRIPE_SECRET_KEY/);
    expect(serviceSource).not.toMatch(/api\.stripe\.com/);
    expect(serviceSource).toContain('/api/create-checkout-session');
    expect(serviceSource).toContain('/api/verify-checkout-session');
  });
});
