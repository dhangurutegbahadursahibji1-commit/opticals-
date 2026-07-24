# American Optical Patiala — Admin Dashboard

Separate React + TypeScript + Vite + Tailwind app for managing the store — deploy independently from
the customer site (e.g. as `admin.yourdomain.com`), per the spec's requirement that this stay a fully
separate application customers can never reach.

## Setup

```bash
npm install
cp .env.example .env    # set VITE_API_URL to your backend
npm run dev
```

Log in with the Super Admin created by the backend's `npx prisma db seed` (see `/backend/README.md`).

## What's implemented

- **Auth**: login, JWT access + refresh token handling with automatic silent refresh on 401, logout,
  role-gated routing (`RequireAuth`).
- **Dashboard**: live stats (products, low stock, today's bookings/enquiries, latest activity,
  popular products) — see `/backend`'s `DashboardService` for the aggregation.
- **Products**: list with search, create (core fields), publish/unpublish, duplicate, archive,
  soft-delete, all wired to the backend's full lifecycle endpoints.
- **Brands, Categories, Offers, Gallery, Blogs**: full CRUD via a shared, reusable `SimpleCrudPage`
  component (list + create/edit modal + delete) — consistent UI, one component doing the work for five
  resource types.
- **Testimonials**: moderation queue (approve/reject pending reviews).
- **Bookings**: list, filter by status, inline status update, CSV export.
- **Enquiries**: list, filter by status, inline status update.
- **Users** (Admin+ only): list, role reassignment, create new staff accounts.
- **Audit Logs** (Admin+ only): read-only feed of every recorded action.
- **Settings** (Admin+ only): edit store info (address, phone, hours, WhatsApp number).

## Known gaps

- **Product edit/variant/image management is create-only in this session's build.** The create form
  covers the core scalar fields (SKU, name, price, stock, description); editing an existing product's
  full detail (variants, images, specs, SEO fields) needs a dedicated product detail screen — the
  backend already supports all of it (`PATCH /admin/products/:id` accepts every field), it's a
  frontend screen that wasn't built in this pass. `SimpleCrudPage`'s pattern generalizes to it
  directly if you want to extend `ProductsPage.tsx`.
- **No drag-and-drop image upload UI** — the backend's `/admin/upload` and `/admin/upload/presign`
  endpoints work, but no page currently calls them; Gallery's form asks you to paste a URL you upload
  separately (e.g. via the Swagger UI at `/api/docs`) as a stopgap.
- **No recycle bin screen** — the backend's `/admin/products/recycle-bin` endpoint exists and works,
  there's just no page rendering it yet.
- **Bulk actions aren't wired in the UI** — the backend supports bulk publish/archive/delete/restore;
  the Products table doesn't have row-selection checkboxes yet to call them.

None of these are broken — they're endpoints with working backend logic that don't have a frontend
screen yet. Each follows the same pattern as an existing page, so they're additive work rather than
architecture changes.
