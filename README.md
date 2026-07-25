# LBETest.com — marketing site

Marketing homepage for the **Locrativ Business English Test (LBET)** — an
online Business English exam that scores you in ~60 minutes and issues a
**verifiable certificate**.

Built with the Next.js App Router, TypeScript, Tailwind CSS and
shadcn/ui (Radix primitives), with full light/dark theming and an
accessibility-first (WCAG 2.2 AA) component set. The app is authored to stay
edge/Workers-compatible for deployment to **Cloudflare**.

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

### Sections (`src/components/home/`)

| Component | Purpose |
| --- | --- |
| `Header.tsx` | Sticky header, primary nav, teal "Take the test" CTA, mobile drawer |
| `Hero.tsx` + `ExamMock.tsx` | Headline, CTAs, exam-screen mock with a floating `B2 · Professional` badge, trust strip |
| `LogoRow.tsx` + `PlaceholderLogo.tsx` | Social-proof logo row (neutral placeholders) |
| `Features.tsx` | "What LBET measures" — Listening, Reading, Grammar, Writing, Speaking + CEFR card |
| `HowItWorks.tsx` | 3-step flow |
| `SampleQuestion.tsx` | Interactive multiple-choice demo with correct/incorrect feedback (client-side) |
| `VerifyCertificate.tsx` | Certificate ID input → `/verify` (stub route, no backend yet) |
| `AudienceCards.tsx` | Individuals / Business / Schools cards |
| `PricingTeaser.tsx` | Pricing preview |
| `Faq.tsx` | shadcn Accordion |
| `FinalCta.tsx` | Closing CTA band |
| `Footer.tsx` | Footer nav, legal links, language-switcher placeholder |

### Primitives & shared UI

- `src/components/ui/` — shadcn-style `Button`, `Card`, `Input`, `Accordion`.
- `src/components/Section.tsx` — `Section` + `SectionHeading` layout primitives.
- `src/components/Logo.tsx` — the **LBET logo as an inline SVG**: a rounded-square
  seal whose checkmark doubles as an ascending bar (verified + progress).
- `src/components/theme-provider.tsx` / `theme-toggle.tsx` — class-strategy
  light/dark via `next-themes`.

### Routes (`src/app/`)

- `/` — the homepage.
- `/verify` — certificate lookup **stub** (renders a placeholder result; no
  backend call yet).
- `/for-individuals`, `/for-business`, `/for-institutions` — audience stubs.
- `/start`, `/login` — stubs for the exam app / auth.

---

## Design system

Brand + semantic tokens are declared as CSS variables in
`src/app/globals.css` (space-separated RGB channels so Tailwind opacity
modifiers work) and exposed through `tailwind.config.ts`.

**Brand colors**

| Token | Hex | Use |
| --- | --- | --- |
| `primary` | `#0B2A4A` | Deep navy — headings, dark surfaces |
| `primary-mid` | `#1E5AA8` | Mid blue — links, accents |
| `teal` | `#12B3A6` | **Reserved** for primary CTAs and "verified" states |
| `gold` | `#F4B740` | Highlights |
| `success` | `#1FA971` | Positive status |
| `warning` | `#E8A13A` | Caution status |
| `error` | `#D5453B` | Error status |

Neutrals use Tailwind's `slate` ramp. Status colors are chosen to stay
distinguishable for common color-vision deficiencies (paired with icons/text,
never color alone).

**Typography** — headings in **Sora**, body in **Inter**, both loaded via
`next/font` (self-hosted, no layout shift). Numeric UI uses tabular numerals.

**Theming** — full light + dark mode with a class strategy and a header toggle.

**Accessibility (WCAG 2.2 AA)** — semantic landmarks, a skip link, keyboard
navigation, always-visible focus rings, `aria` labels on icon-only controls,
and `prefers-reduced-motion` support.

---

## Deploying to Cloudflare

The page avoids Node-only APIs so it can run on Cloudflare Workers/Pages. The
recommended adapter is [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare):

```bash
npm i -D @opennextjs/cloudflare wrangler
# then build & preview with the adapter, e.g.
# npx opennextjs-cloudflare build && npx wrangler dev
```

Add a `wrangler` config and the `opennextjs-cloudflare` build step when the
deployment target is wired up. (Kept out of the base install so `npm run dev`
stays lightweight.)

---

## Where the backend & exam app plug in later

This repo is intentionally structured so the product can grow beyond marketing:

- **Exam app** → add `src/app/(app)/…` route group (e.g. the real `/start`
  flow) and a candidate dashboard under `src/app/(dashboard)/…`. The current
  `/start` and `/login` stubs mark where these attach.
- **Backend: Supabase** → auth, exam sessions, scoring and certificate records.
  - `VerifyCertificate` and `/verify` are already shaped for it: the certificate
    ID currently routes to a stub result; swap the placeholder for a Supabase
    query (e.g. a `certificates` table + row-level security) to return real
    verification data.
  - Add a `src/lib/supabase/` client and server helpers; keep secrets in
    environment variables (never in the page bundle).

Until then, everything on the homepage is static/marketing only.
