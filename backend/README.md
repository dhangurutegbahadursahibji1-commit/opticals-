# American Optical Patiala — Backend API

NestJS + Prisma + PostgreSQL (Supabase) + Cloudflare R2, built from the backend specification (v2.0).
Powers both the customer website (`/american-optical`) and the admin dashboard (`/admin-dashboard`).

## Read this first: what's real vs. what needs your input

This backend has genuine, working business logic — not stubs — for every module listed below.
What it **cannot** do without you is:

1. **Connect to a real database.** I have no network access to Supabase/any live Postgres from this
   sandbox. You need to create a Supabase project (or any Postgres 14+), put its connection string in
   `DATABASE_URL`, then run `npx prisma generate && npx prisma migrate dev --name init`.
2. **Generate the Prisma Client.** `npx prisma generate` downloads a query-engine binary from
   `binaries.prisma.sh`, which this sandbox's network policy blocks. I could not run this step or a
   full `tsc` build here — see "What I verified" below for exactly how far I could check the code.
3. **Connect to real Cloudflare R2.** Same story — needs your account ID, access/secret keys, and
   bucket, in `.env`.
4. **Deploy.** `render.yaml` is ready for Render's Blueprint deploy; you still need to connect your
   GitHub repo and fill in the secret env vars in the Render dashboard (they're marked `sync: false`).

None of this is unusual for a backend like this — every real deployment needs its own database and
storage credentials — but I want to be direct that "it runs" is not something I can personally verify
end-to-end here, only "the code is structurally correct and the parts I could check compile clean."

## What I verified

- `npx tsc --noEmit` against the full source tree. After filtering out every error caused by the
  *missing* generated Prisma Client (which resolves once you run `prisma generate` against a real
  schema — those errors are all "Property X does not exist on PrismaService" / "@prisma/client has no
  exported member Y", the expected shape of that gap), **three real errors remained**, all in one
  file (`http-exception.filter.ts`, a narrowing issue caused by the same missing-client problem) — I
  fixed the two JWT `expiresIn` typing issues that were genuine bugs independent of Prisma generation.
  In short: the code is about as clean as I can confirm without a live database.
- The admin dashboard (`/admin-dashboard`) builds with **zero TypeScript errors** — it has no Prisma
  dependency, so this is a full, real build verification.
- The customer site (`/american-optical`) builds with **zero TypeScript errors** after being wired to
  call this API.

I could not run `prisma migrate`, seed the database, start the server, or hit a single live endpoint,
because there's no real Postgres/R2 reachable from here. **Please run it locally or on Render and
smoke-test the core flows (login, create a product, submit a booking) before relying on it.**

## Setup

```bash
npm install
cp .env.example .env          # fill in DATABASE_URL, JWT secrets, R2 credentials
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed            # creates a Super Admin (see .env SEED_ADMIN_EMAIL/PASSWORD) + sample data
npm run start:dev
```

API docs (Swagger): `http://localhost:3000/api/docs`
Health checks: `/api/health`, `/api/health/live`, `/api/health/ready`

All routes are versioned and prefixed: `/api/v1/...` (Swagger reflects this).

**Change the seeded admin password immediately** — it's a known default in `.env.example`.

## Architecture

```
src/
  auth/            JWT + refresh token rotation + RBAC + bcrypt + account lockout
  users/           Staff management, roles, per-user permission overrides
  audit-log/       Every mutation is recorded here (who/what/when/IP)
  products/        Full lifecycle: draft -> published -> sold/archived -> deleted (recycle bin,
                   7-day retention) -> permanently purged. Includes the daily 2AM cleanup cron.
  brands/ categories/ blogs/ offers/ testimonials/ gallery/
                   Full CRUD, soft-delete where the spec calls for it
  bookings/        Eye test bookings (public submit, admin manage + CSV export)
  enquiries/       Contact form submissions (public submit, admin manage)
  notifications/   Low-stock alerts, generic notification feed
  settings/        Key-value store for store info (address, hours, phone, etc.)
  dashboard/       Stats aggregation + global search, for the admin dashboard's home screen
  storage/         Cloudflare R2 (S3-compatible) upload/delete/presign service
  upload/          Generic admin upload endpoint (direct multipart + presigned-URL modes)
  common/          Guards (JWT, roles, permissions), filters, interceptors, pagination DTO
  health/          Liveness/readiness/DB/R2 checks for Render + uptime monitors
  logger/          Winston, daily-rotating file logs + console
prisma/
  schema.prisma    The full data model
  seed.ts          Super Admin + sample brands/categories/products/offers/blog/testimonial
```

## Product lifecycle (as specified)

`DRAFT -> PUBLISHED -> OUT_OF_STOCK -> SOLD -> ARCHIVED -> DELETED -> (7-day recycle bin) -> purged`

- **Delete** is always soft: sets `status = DELETED`, `deletedAt`, `purgeAt` (+7 days), hides from the
  public API immediately, keeps the DB row + R2 images.
- **Mark Sold** removes it from the public catalogue but keeps the record; a `purgeAt` is set so the
  daily cron cleans up just the R2 *images* (not the record) after 7 days.
- **Restore** is available any time before `purgeAt`.
- **Permanent removal** — via the daily cron (`ProductsCleanupCron`, runs at 2AM) or an explicit
  Super-Admin-only `DELETE /admin/products/:id/permanent` — deletes the R2 images (bulk `DeleteObjects`
  call) and the database row, and writes an audit log entry. Failures are logged and naturally retried
  the next night, since a failed purge leaves `purgeAt` in the past.

## Auth & RBAC

- Access tokens (short-lived, default 15m) + refresh tokens (7d, rotated on every use, stored hashed
  in the DB so they can be revoked).
- 5 failed logins locks the account for 15 minutes.
- Role hierarchy: `VIEWER < STAFF < MANAGER < ADMIN < SUPER_ADMIN` — `@Roles(...)` checks the minimum
  required level, so higher roles automatically satisfy lower-role routes.
- `UserPermission` lets a Super Admin override one specific permission for one specific user without
  touching their base role (e.g. revoke `products:delete` for a STAFF account) — checked by
  `PermissionsGuard` alongside `RolesGuard`.
- Every controller route is guarded by default (`JwtAuthGuard` is a global `APP_GUARD`); only routes
  explicitly marked `@Public()` skip auth — used for the customer-facing endpoints and login/register.

## Known gaps / things you should treat as follow-up work, not done

- **No email delivery.** `forgotPassword` logs the reset token instead of emailing it — wire up
  SendGrid/Postmark/etc. in `auth.service.ts`.
- **No real orders/payments model.** The spec confirmed WhatsApp-only checkout, so there's no revenue
  tracking — the dashboard stats endpoint says so explicitly rather than faking a number.
- **Frame-booking submissions aren't persisted server-side** — the customer site's frame Booking Form
  still opens WhatsApp directly with the details (matching the original v1 site's design); it doesn't
  POST to this backend. Eye test bookings and contact enquiries do post here. If you want frame
  bookings in the admin dashboard too, that's a small additive change (new `FrameBooking` Prisma model
  + module, following the `EyeTestBooking` pattern exactly).
- **suitableFaceShapes/tags exist on the schema now but nothing populates recommendations server-side**
  — the Virtual Try-On feature's local, on-device face-shape logic on the customer site is unaffected.
- **Image compression/thumbnailing isn't automated.** The upload service stores whatever buffer it's
  given; generating WebP/AVIF variants and thumbnails server-side (e.g. via `sharp`) is not implemented
  — the customer site's `ProductImage` type has fields for these variants, but populating them today
  means uploading pre-processed files.
- **No automated tests.** Given the scope of this session, I prioritized breadth of working modules
  over test coverage. None of the 15 deliverables explicitly required tests, but a real production
  rollout should have them, especially around the product lifecycle/recycle-bin logic.

## Deployment

- **Render**: `render.yaml` is a ready Blueprint — connect your repo in the Render dashboard, it reads
  this file. Fill in the `sync: false` env vars there (DATABASE_URL, R2 credentials, CORS_ORIGINS).
- **Database migrations on deploy**: the Render build command runs `prisma migrate deploy` — make sure
  your Supabase `DATABASE_URL` is reachable from Render before the first deploy.
- **Admin dashboard & customer site**: both are separate Vite apps — deploy each to Vercel as its own
  project, and set `VITE_API_URL` (customer site) / `VITE_API_URL` (admin dashboard, same variable
  name, see its own `.env.example`) to your Render backend URL + `/api/v1`.

## Environment variables

See `.env.example` for the full list with comments. The required ones (backend won't boot without
them, per `src/config/validation.ts`): `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`,
`R2_ACCOUNT_ID`, `R2_ACCESS_KEY`, `R2_SECRET_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL`.
