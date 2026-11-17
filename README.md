# 3.33AM Store

A Next.js App Router storefront with a local cart, PostgreSQL/Prisma catalog and order data, Stripe Checkout, a Stripe webhook, and token-protected admin APIs.

## Run locally

1. Install Node.js 20 or newer, then run `npm install`.
2. Copy `.env.example` to `.env` and set `DATABASE_URL`.
3. Run `npm run db:push` and `npm run db:seed`.
4. Set a long random `ADMIN_API_TOKEN` before opening `/admin`.
5. Run `npm run dev` and open `http://localhost:3000`.

The sample collection is shown as a local preview when the database API is unavailable. Database-backed orders and admin actions require a working PostgreSQL connection. Catalog changes are read from the database after seeding.

## Payments and images

Set `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_SITE_URL` to enable Checkout. Configure a Stripe webhook pointing to `/api/webhooks/payment` and set `STRIPE_WEBHOOK_SECRET`; listen for `checkout.session.completed`, `checkout.session.async_payment_succeeded`, and `checkout.session.expired`. Inventory is reserved during checkout and returned when a payment session expires.

Cloudinary credentials are optional. `POST /api/upload` returns signed Cloudinary upload parameters and requires `Authorization: Bearer <ADMIN_API_TOKEN>`. Design image URLs can also be supplied directly in the admin form.

The admin API token is held in the browser session for the active tab and sent only to this application's API. Use HTTPS and a strong secret in deployed environments. Customer accounts/authentication, refunds, tax calculation, and shipping-carrier integrations are not configured in this starter.
