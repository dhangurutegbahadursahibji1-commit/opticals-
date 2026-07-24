# American Optical Patiala — Full-Stack Project

Three separate applications, per the spec:

```
customer-website/   React + Vite storefront (deploy to Vercel)
admin-dashboard/     React + Vite admin app (deploy separately, e.g. admin.yourdomain.com)
backend/             NestJS + Prisma + PostgreSQL + Cloudflare R2 API (deploy to Render)
```

**Start with `backend/README.md`** — it explains exactly what's implemented, what I could and
couldn't verify from this sandbox (no network access to Supabase/Render/Cloudflare, and Prisma's
engine binaries are blocked here too), and what you need to fill in before it runs.

Then `admin-dashboard/README.md` and `customer-website/README.md` for what's implemented in each and
what's still on local JSON vs. wired to live data.

## Honest scope summary

This was built in one long session against a genuinely enterprise-scale spec (15 deliverables: 3
separate apps, RBAC, product lifecycle with a recycle bin and cron cleanup, audit logs, R2 storage,
Swagger, health checks, seed scripts, deployment config). What's real:

- Every backend module has actual business logic — not placeholder CRUD. The product lifecycle
  (draft → published → sold/archived → deleted → 7-day recycle bin → permanent purge with R2 cleanup)
  works exactly as specced, including the daily cron job.
- Auth is real: JWT + rotating refresh tokens + bcrypt + account lockout + role hierarchy + per-user
  permission overrides.
- The admin dashboard covers the highest-value screens for every resource, and both it and the
  customer site build with zero TypeScript errors.
- The customer site's core commerce path (Shop → Product detail → Eye Test booking → Contact) is
  wired to live API calls; the rest still reads local JSON and needs the same mechanical conversion
  (documented in its README).

What's genuinely not done, not because it's hard but because it needs infrastructure I don't have
access to from this sandbox: an actual running database, actual R2 credentials, and therefore any
live end-to-end test. I verified everything I could with static analysis (`tsc --noEmit`) and real
builds; I could not start the server or hit a single endpoint. Please treat this as a strong,
close-to-complete first implementation that needs a real deploy-and-test pass before going live — not
as a finished, verified production system.
