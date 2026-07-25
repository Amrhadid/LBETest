# LBETest.com — marketing site

Marketing homepage for the **Locrativ Business English Test (LBE)** — an
official online Business English exam that scores your workplace English and
issues a **verifiable certificate**, with results in 48 hours.

Built with the Next.js App Router, TypeScript, Tailwind CSS and
shadcn/ui (Radix primitives). The public homepage uses a premium
**gold-and-ivory** examination identity (light-only), and the app is authored
to stay edge/Workers-compatible for deployment to **Cloudflare**.

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

Other scripts:

```bash
npm run build      # production build
npm run start      # serve the production build
npm run lint       # eslint (next/core-web-vitals)
npm run typecheck  # tsc --noEmit
```

Requires Node.js 18.18+ (Node 20/22 recommended).

---

## What's here

A single, composable marketing homepage plus a few stub routes.

### Homepage sections (`src/components/home/`)

| Component | Purpose |
| --- | --- |
| `Header.tsx` | Sticky header, gold logo, nav, gold "Book a Test" + "Sign In", mobile drawer |
| `Hero.tsx` | Editorial headline, trust facts, info band + the certificate visual and registration card |
| `Certificate.tsx` | A4 (210:297) certificate document visual — CSS/SVG stand-in (see asset TODO) |
| `RegistrationCard.tsx` | "Take the test / Test my team" segmented form → existing routes |
| `HowItWorks.tsx` | 3 connected steps |
| `ScoreSystem.tsx` | The LBE1–LBE5 score system (LBE3 = Qualified) |
| `VerifyCertificate.tsx` | Dark section; certificate-ID form → `/verify` route |
| `Audiences.tsx` | Individuals / Organizations / Businesses cards |
| `Pricing.tsx` | Two plans — Test Only ($89) and Test + Training ($189, featured) |
| `Faq.tsx` | Accessible accordion (single-open, plus/minus) |
| `FinalCta.tsx` | Gold-and-charcoal closing banner |
| `Footer.tsx` | Footer nav + legal (real links only; placeholders elsewhere) |

### Primitives & shared UI

- `src/components/ui/` — shadcn-style `Button` (gold/outline/dark variants),
  `Card`, `Input`, `Accordion` (plus/minus).
- `src/components/Section.tsx` — `Section` + `SectionHeading` layout primitives.
- `src/components/Logo.tsx` — the **Locrativ gold "L" logo** as an inline SVG
  plus the `LOCRATIV` / `Business English Test` wordmark.
- `src/lib/site.ts` — nav, **routes**, footer nav and **pricing plan IDs**
  (all outbound destinations and TODOs are centralised here).

### Routes (`src/app/`)

- `/` — the homepage.
- `/verify` — certificate lookup **stub** (clear "not connected" state; no
  backend call yet).
- `/for-individuals`, `/for-business`, `/for-institutions` — audience stubs.
- `/start`, `/login` — stubs for booking / auth.

---

## Design system

Tokens are declared as CSS variables in `src/app/globals.css`
(space-separated RGB channels so Tailwind opacity modifiers work) and exposed
through `tailwind.config.ts`. **Light-only — there is no dark mode.**

**Colors**

| Token | Hex | Use |
| --- | --- | --- |
| `background` (ivory) | `#FBF8F1` | Warm page background |
| `card` | `#FFFFFF` | Cards |
| `charcoal` | `#1D1D1F` | Primary text |
| `charcoal-dark` | `#202020` | Dark sections (verify, final CTA) |
| `gold` | `#C68A1E` | Primary CTAs, accents, logo |
| `muted-foreground` | `#62605C` | Body / secondary text |
| soft gold border | `rgba(198,138,30,.25)` | Card hairlines + dividers |

**Typography** — major headings in **Cormorant Garamond** (serif), body/UI in
**Inter**, both via `next/font` (self-hosted, no layout shift). Numeric UI uses
tabular numerals. Subtle certificate-style guilloché patterns are pure CSS
(`.pattern-guilloche`, `.pattern-security-dark`).

**Accessibility (WCAG 2.2 AA)** — semantic landmarks, a skip link, keyboard
navigation, always-visible gold focus rings, `aria` labels on icon-only
controls, accessible form validation, and `prefers-reduced-motion` support.

### Assets to supply

- **TODO(asset):** `src/components/Logo.tsx` renders an inline gold "L". Drop
  the official Locrativ logo into `/public` and swap it in.
- **TODO(asset):** `src/components/home/Certificate.tsx` is a faithful CSS/SVG
  A4 stand-in. When the real A4 portrait certificate asset is supplied, render
  it as an `<img>` inside the same 210:297 frame — do not distort it.

---

## Deploying to Cloudflare (Workers)

This app is configured for **Cloudflare Workers** via the OpenNext adapter
([`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare)):

- `open-next.config.ts` — adapter config.
- `wrangler.jsonc` — Worker config: the `nodejs_compat` compatibility flag, a
  recent `compatibility_date`, `main` → `.open-next/worker.js` (the OpenNext
  worker output), and the static-assets binding (`ASSETS` → `.open-next/assets`).
- `next.config.mjs` calls `initOpenNextCloudflareForDev()` so
  `getCloudflareContext()` works during `next dev`.

Build the Worker locally, preview it on the Workers runtime, or deploy manually:

```bash
npx opennextjs-cloudflare build   # runs `next build`, then bundles the Worker
npm run preview                   # build + local workerd preview (wrangler)
npm run deploy                    # build + deploy via wrangler
```

### Cloudflare Workers Builds (Git-connected)

In the Workers Builds project settings, use:

- **Build command:** `npx opennextjs-cloudflare build`
- **Deploy command:** `npx opennextjs-cloudflare deploy`

Cloudflare runs the build command on each push and then the deploy command to
publish the Worker.

---

## Where the backend & exam app plug in later

This repo is intentionally structured so the product can grow beyond marketing.
Outbound destinations and integration points are centralised in
`src/lib/site.ts`:

- **Booking / auth** → `/start` and `/login` stubs mark where the exam app and
  authentication attach. The hero registration form and pricing buttons hand off
  to these existing routes (carrying the plan slug / email as a hint).
- **Payments** → `pricingPlans` isolates the Test Only ($89) and Test + Training
  ($189) plans; add the real product/price IDs there (see `TODO(payments)`).
- **Certificate verification** → the homepage and `/verify` route are shaped for
  a real lookup: wire the verification API and render the polished result state
  (verified, candidate, LBE score, qualification, issue date, certificate ID)
  and an accessible error state (see `TODO(backend)`). No results are fabricated.

Until those land, everything on the homepage is static/marketing only.
