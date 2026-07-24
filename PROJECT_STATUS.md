# Optical Platform — Status Report

**How to read this:** I have no live database or network access in my working
environment, so nothing here was click-tested end to end against a running
server. Every fix below was verified by tracing the actual code paths (frontend
call → backend route → service → schema) and, for the two frontend apps, a
real, clean TypeScript compile after every change. The backend's own compiler
couldn't be run (Prisma's engine binaries need a network download my sandbox
doesn't have), so backend changes are verified by careful reading and a
syntax-validity pass, not a type-check. **Test on a real environment before
trusting this blindly**, but this is meaningfully more correct than what you
had.

Setup note: run `npm install` in each of `backend/`, `admin-dashboard/`, and
`customer-website/` — `node_modules` is excluded from the zip. Three schema
changes need migrating before the backend will boot cleanly against your real
database: `Prescription.uploadedFileUrl` (prior session), plus two from this
session — a new `faqs` table and the removal of `ai_knowledge`. All three
migrations are already hand-written and committed under `prisma/migrations/`,
so run `npx prisma migrate deploy` (not `migrate dev` — that would try to
diff and generate its own migrations against work that's already scripted).

---

## 0. This session's changes (July 23, 2026) — read this first

Everything in sections 1–4 below describes the *prior* session. Since then:

**Settings / Payment (the old report's remaining-work item was wrong)** — The
prior report said dynamic UPI ID / store settings were "not addressed." They
weren't — the Settings page, its live API, and the customer-side context were
already fully built and working. What was actually missing, found by tracing
it end to end: **any ADMIN (not just the Owner) could read or write payment
fields — bank account, IFSC, UPI ID — via a direct API call**, because the
backend only checked role at the route level, not per-field. The admin UI
already hid this from non-owners, but nothing enforced it server-side. Fixed:
payment settings now live in their own `Setting` row (`paymentSettings`,
separate from `store`), and the backend rejects any non-SUPER_ADMIN attempt
to write it — regardless of which UI or API call is used to try. Also found
and fixed: `featureFlags.enableAIAssistant` was fetched everywhere but read
by nothing — the toggle didn't exist in the admin UI and the widget ignored
it. (Moot now — see below.) One confirmed-dead file removed: `MainLayout.tsx`
(an orphaned, fully-duplicated layout, zero imports anywhere).

**FAQ page — built from scratch, confirmed genuinely new scope** — The prior
report was accurate that this had no backend model at all. Built: a `Faq`
Prisma model + migration, a full backend module (public read endpoint,
admin CRUD, audit-logged, every DTO field properly `class-validator`
decorated), an admin management page with grouped-by-category list and a
create/edit modal, and the customer-facing FAQ page switched from a static
mock JSON file to a live `useQuery` fetch (matching the pattern already
established by `OffersPage`, not the older Settings-style pattern). Seeded
with the same 12 questions the static mock had, generalized to remove one
hardcoded city reference. The now-dead static getter (`getFAQs`), its unused
type (`FAQItem`), and the mock JSON file were all removed.

**AI Knowledge / Assistant — removed entirely, not fixed.** During the audit
(before any removal decision) this turned out to be in considerably worse
shape than either version of the "remaining work" list suggested — worth
recording accurately in case anyone revisits the decision to remove it:
- Its DTO (`AskDto`) had zero `class-validator` decorators anywhere, on an
  app that globally enforces `whitelist + forbidNonWhitelisted` — every
  field would have been stripped and the request rejected.
- The customer-facing endpoint (`/ai/assistant`) had no `@Public()` marker
  on an app where `JwtAuthGuard` is registered *globally* — meaning it
  would have rejected every anonymous storefront visitor with a 401 before
  ever reaching the DTO problem above.
- Its controller manually wrapped its own response (`{ data: { reply } }`)
  on top of a global interceptor that *also* wraps every response — almost
  certainly double-nested JSON even if the first two problems were fixed.
- Conversation history sent by the widget was accepted but silently
  discarded server-side — no memory between messages.
- The admin Knowledge CRUD endpoints required login (global guard covers
  that) but had no role-tier restriction, so any authenticated VIEWER could
  create/update/delete entries meant to be MANAGER+ territory.
- Underneath all of that: the AI Knowledge records admins could create had
  **zero effect** on the assistant's actual replies — it was fully
  disconnected from the one working part, confirming the original report's
  core claim that the assistant-branching work was untouched.

Per explicit instruction, none of this was repaired. Removed instead, fully:
the backend `ai` module, the `AIKnowledge` Prisma model (+ migration
dropping its table, + the `Tenant.aiKnowledge` back-relation), the admin
Knowledge page + its nav entry + its API client calls, the customer-facing
chat widget + its usage in both layouts, and `enableAIAssistant` everywhere
it appeared (type, mock defaults, seed data, the admin Settings toggle added
earlier this same session then removed along with it). Verified with a
repo-wide grep for AI/Gemini-related names after removal — clean.

**SMS/Email order notifications — explicitly deferred, not built.** Confirmed
still accurate: no mail/SMS package installed, the existing `Notification`
model is in-app/staff-only. Scoped out in conversation (order/booking
confirmation + status-change emails and/or SMS, needs a real provider API
key you'll supply — Resend/SendGrid/SMTP for email, Twilio/MSG91 for SMS —
that I can't test end-to-end without). Deliberately not started this
session; genuinely open if picked up later.

**Build verification caveat carries forward unchanged**: this sandbox has no
working `node_modules` for either frontend app and no network access to
install them, so — unlike the prior session, which did have a real
`tsc --noEmit` available — none of this session's changes were verified by
an actual compile. Every change was checked by manual trace of types, prop
names, and import paths instead. Test for real before trusting this blindly.

---

## 1. Your original "✅ Done" list — accuracy check

| Item | Reality |
|---|---|
| Unified Prisma schema, centralized client | ✅ True |
| SKU fully removed | ✅ True on the backend. Found and removed 3 leftover dead `sku` fields in the customer website's TypeScript types (never wired to anything, but misleading) |
| Live API for Brands/Products/Enquiries (admin) | ✅ True |
| Gender/Material/Frame Shape/Measurements/Warranty in New Product form | ⚠️ Material/Frame Shape/Measurements/Warranty were there. **Gender was not**, despite the claim — fixed |
| Status defaults to Published, form has Draft/Published/Archived | ⚠️ True for create. Found the **edit** modal's status dropdown was never actually sent to the server — editing a product could never change its status. Fixed |
| Static mock files replaced with live API everywhere | ❌ **Overstated.** Only product listing/detail pages were actually connected. Home, Brands, Gallery, Offers, Blog (list + post), and navbar search were still reading a static mock JSON file. **All migrated to the live API this session** |
| Wishlist fix | ⚠️ Partially true — it did fetch live data, but only ever the first 100 products, silently breaking past that or for anyone with >100 products. Fixed with a proper fetch-by-id |
| Lens Configurator (4-step, pricing, snapshot to checkout) | ❌ **This was fully non-functional, not "integrated."** Root cause: the pricing endpoint had a doubled URL prefix so it 404'd on every call, and the catalogue endpoint required a login your customers don't have. Also found the price display was hardcoded to always show ₹0 even when a calculation succeeded. **All three fixed** |
| Buy Now button on Cart | ⚠️ Existed, but did the *exact same thing* as "Book Consultation (₹50)" — no way to tell them apart server-side, and checkout always displayed the flat ₹50 fee even for a full-price direct order. Fixed: they now diverge, and the amount charged/displayed matches which one was clicked |
| CreateConsultationDto accepts checkout fields, 400 error resolved | ⚠️ True narrowly, but the endpoint **rejected every real customer with a 401** (missing public-access flag), **crashed if a prescription photo was attached** (wrong field type), and **silently discarded ~15 of the fields it claimed to accept** (address, payment method, UTR, product details — validated, then thrown away). All fixed. Also found prescription photo upload in the configurator was a complete no-op (the file was never actually sent anywhere) — fixed |
| TypeScript/service fixes for reliable Order/Consultation creation | ⚠️ Compiled, but "reliable" didn't hold up given the above. Substantially rewritten this session |

---

## 2. Your original "⏳ Remaining" list — current status

**1. Split AI Knowledge from Recommendation Engine** — ❌ Not started. The schema has a scaffold model (`AIKnowledge`) already in place; the actual assistant-branching work is untouched.

**2. Dedicated Prescription model** — ⚠️ The model already existed in your schema (whoever built it got ahead of this note). What I actually found: the entire API around it was a **hollow stub** — an empty controller, an empty service, despite spec test files already existing for it. **Built the real thing this session**: list/search-by-phone/review-and-verify, properly access-controlled. Note: true "customer logs in and manages their own saved prescriptions" isn't achievable as originally framed — there's no customer account system anywhere in this app. I built the realistic equivalent (staff can pull up a repeat customer's history by phone).

**3. Media Asset Management** — ⚠️ Real R2 upload already existed for admin product photos/videos and for customer prescription/payment-proof uploads. What was missing and is now fixed:
- Brands, Categories, Blogs, and Offers admin forms had **no image upload field at all** — added, all going to R2
- Gallery had a **complete backend with zero admin page** — built the missing page (photo + video upload)
- Prescription/payment-proof uploads were being dumped into the same storage folder as your public marketing gallery — split into dedicated private folders
- The whole API previously **could not boot at all** without Cloudflare credentials configured — now optional, degrades gracefully

**4. E2E testing & polish / dynamic UPI settings** — ❌ Not done. No live click-through test was possible in my environment (no network/DB access — see the note at the top). Dynamic UPI id in Settings untouched. SMS/Email notifications don't exist.

---

## 3. Bugs found and fixed that weren't on your radar at all

- **Admin Returns page always showed "not found"** — a route-registration-order bug in `orders.controller.ts` (a literal route was registered after a wildcard param route that swallowed it first)
- **Per-user permission overrides silently did nothing** — the guard existed but was never wired into the app; now live, and applied to two real actions (product delete, user role changes) as working examples
- **Lens/add-on compatibility rules** existed as schema tables but were never actually enforced during pricing
- **The ₹50 consultation fee was hardcoded in two different places** and couldn't be changed from Settings — now reads from one place, and is admin-editable
- **A typo'd product status could crash as a 500** instead of returning a clean validation error — fixed
- **Editing a product silently discarded newly uploaded photos** (they really did reach R2, but were never attached to the product) and there was no way to attach a video at all — both fixed
- **Cart never re-checked prices/stock** against the live catalogue — now warns you if something changed and blocks checkout on out-of-stock items
- The Live Photo camera button gave a misleading "allow permissions" error when the actual problem is the site not being served over HTTPS — now says so directly
- The `isFeatured` / `isNew` / `isBestseller` toggles were validated by the API but silently ignored by every query — fixed, and exposed properly in the admin product form for the first time

---

## 4. Known remaining work (genuinely open)

- AI Knowledge / specialized-assistant split — not started
- Dynamic UPI ID and other store-config settings in the admin Settings page — not addressed
- SMS/Email order notifications — don't exist
- FAQ page still shows static content — there's no backend model for it at all, so this is new scope, not a reconnection fix
- Two minor utility files (`CallButton`, `seo.ts`) read settings through an older pattern that still works correctly via a live-override mechanism — left alone rather than risk breaking something functioning
- No live end-to-end test has been run against a real database — please test the checkout, consultation, and admin flows for real before going live
