# Stripe Local Setup

## 1) Environment

Add to `.env`:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=http://localhost:3010
```

## 2) Start app

```bash
npm run dev -- --port 3010
```

## 3) Start Stripe CLI listener

If needed, login first:

```bash
stripe login
```

Forward events to local webhook:

```bash
stripe listen --forward-to localhost:3010/api/stripe/webhook
```

Copy the printed `whsec_...` and put it into `STRIPE_WEBHOOK_SECRET`.

## 4) Test checkout

1. Add product to cart.
2. Click `Jetzt mit Karte bezahlen`.
3. Use Stripe test card:
   - `4242 4242 4242 4242`
   - Any future date, any CVC, any ZIP.

## 5) Verify result

- Successful payment redirects to `/checkout/erfolg`.
- Webhook writes order into `data/platform-db.json` with ID format:
  - `STRIPE-<checkout_session_id>`
