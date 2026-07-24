# American Optical Patiala — Website

A full React + TypeScript + Vite + Tailwind e-commerce showcase site for American Optical Patiala,
built from the phased specification. WhatsApp is the checkout/booking channel throughout — there is
no payment gateway, matching the original brief.

## Backend integration status (read this first)

This site can run two ways:

1. **Standalone (default)** — reads seeded content from `src/data/*.json`. No backend needed.
2. **Connected to the live API** (see `/backend`) — set `VITE_API_URL` to your deployed backend.

**Pages already converted to live API calls:** Shop, Product detail, Eye Test booking (also opens
WhatsApp), Contact (submits to `/enquiries` in addition to the WhatsApp/call buttons).

**Pages still on local JSON** (same visual result, just not yet wired to the backend — swapping them
follows the exact pattern used in `ShopPage.tsx`/`ProductPage.tsx`: replace the `services/products.ts`
call with the matching function from `services/api.ts` + `@tanstack/react-query`, wrapped in a loading
state): Home, Brands, Lens guide, Offers, Blog, Gallery, FAQ, and the AI Assistant widget's FAQ
matching. This was a scope call to fit the highest-traffic commerce path (Shop → Product → Book) into
this session — see the root-level summary for why.

## Run it

```bash
npm install
npm run dev       # local dev server
npm run build     # production build -> dist/
npm run preview   # preview the production build
```

Copy `.env.example` to `.env` and set `VITE_API_URL` to point at your backend if you want the
converted pages to hit live data instead of local JSON.

## What's implemented

- **Catalog & Shop**: 20 seeded products across 8 brands, multi-variant color swatches, filters
  (category/gender/brand/shape), sort, wishlist, compare (up to 3), related & "frequently bought with".
- **Product Page**: gallery with lazy AVIF/WebP/JPEG `<picture>` fallbacks, blur-up placeholders,
  360°-spin slider (2 products have full spin frame sets seeded), full spec sheet, booking form.
- **Booking flow**: React Hook Form + Zod validated booking form (frame + lens type + Rx powers +
  prescription upload + fulfilment choice) that opens a pre-filled WhatsApp message — no backend needed.
- **Eye Test booking**: same WhatsApp pattern, date/time picker.
- **Virtual Try-On**: live camera face-mesh try-on using MediaPipe FaceMesh (loaded from CDN at
  runtime — see note below), with on-device face-shape classification (oval/round/square/heart/
  diamond/rectangle/triangle) and rule-based frame recommendations. Nothing is uploaded; it all runs
  in-browser.
- **AI Assistant widget**: a local, rule-based chat widget answering common questions from the FAQ/
  settings data, with a WhatsApp hand-off for anything it can't answer.
- **Brands, Lenses, Offers, Blog (markdown-rendered posts), Gallery (lightbox), FAQ (search +
  accordion), About, Contact (map embed), Wishlist, Compare** — all wired to the shared data layer
  in `src/services/products.ts`.
- **PWA**: installable manifest, offline fallback page, Workbox caching (images cache-first, API
  network-first).
- **SEO**: per-page `<title>`/meta via `SEOHead`, JSON-LD LocalBusiness schema, `sitemap.xml`,
  `robots.txt`.
- **Accessibility**: semantic landmarks, focus-visible states, `aria-label`s throughout, a
  high-contrast toggle and large-text toggle, `prefers-reduced-motion` respected.
- **Dark mode**, the signature rotating gold "shimmer" card border on hover, and a11y-safe motion.

## Known simplifications (read before treating this as production-ready)

- **Images are placeholder URLs** (`https://pub-XXXX.r2.dev/...`) — swap `src/data/*.json` for your
  real Cloudflare R2 (or other CDN) URLs, or point `scripts/gen-data.py` at your real product list
  and re-run it.
- **MediaPipe FaceMesh loads from `cdn.jsdelivr.net` at runtime** rather than being bundled, because
  the `@mediapipe/face_mesh` / `@mediapipe/camera_utils` npm packages ship as legacy UMD scripts with
  no ES module exports — Vite/Rollup can't statically bundle them. This is the standard integration
  pattern for this (now legacy) MediaPipe JS Solutions API. If you have offline/CSP requirements,
  self-host those two script files and change the URLs in `FaceMeshOverlay.tsx`.
- **Face-shape mm measurements are an approximation** (a fixed px→mm ratio), since there's no
  reference object in frame for true calibration — good enough for shape classification and frame
  recommendations, not for exact PD/optical measurements.
- **The frame overlay in Virtual Try-On is a simplified vector outline**, not a textured 3D frame
  mesh warped to the face — swapping in real product renders warped to landmarks is a larger, separate
  effort (Three.js + a proper 3D asset pipeline).
- **The AI Assistant is rule-based**, matching against the FAQ dataset — it is not an LLM. Wiring it
  to a real LLM backend means replacing the `answer()` function in `AIAssistantWidget.tsx` with a call
  to your own server (never call a paid LLM API directly from client-side code with an exposed key).
- **Lighthouse 100/100/100/100 is not verified in this build** — there's no way to run a live
  Lighthouse audit in this environment. The build follows practices that typically score well
  (route-level code-splitting, lazy images, AVIF/WebP, PWA, semantic HTML), but run Lighthouse
  yourself against the deployed site and address whatever it flags.
- **Prescription upload is stubbed**: it captures the file name/type for the WhatsApp message, but
  doesn't actually upload to R2 — wire `PrescriptionUpload.tsx` up to a real presigned-URL endpoint.
- **No backend/CMS**: all content lives in `src/data/*.json`, generated by `scripts/gen-data.py`.
  Editing content today means editing JSON directly or re-running/adjusting that script.

## Project structure

```
src/
  components/   navbar, footer, cards, buttons, forms, filters, virtualTryOn, aiAssistant, uploads, common
  pages/        one folder per route
  context/      Theme, Wishlist, Compare (all localStorage-backed)
  hooks/        useWishlist, useCompare, useDarkMode, useSearch, useRecentlyViewed
  services/     products.ts — the single data-access layer (swap for a real API later)
  data/         seeded JSON content
  utils/        whatsapp.ts, faceShape.ts, formatPrice.ts, seo.ts
  types/        shared TypeScript interfaces
```
