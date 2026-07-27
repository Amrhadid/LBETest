/** Central config: copy, routes, nav and pricing so sections stay in sync. */

export const siteConfig = {
  name: "Locrativ",
  fullName: "Locrativ Business English Test",
  domain: "lbetest.com",
  description:
    "The Locrativ Business English Test (LBE) is an official online exam that scores your workplace English and issues a verifiable certificate. Results in 48 hours.",
};

/**
 * Existing, operational routes are wired directly. Where a dedicated
 * destination does not exist yet, we point at the closest real route or an
 * on-page anchor and leave a TODO — never a broken/misleading URL.
 */
export const routes = {
  book: "/start", // existing booking / take-the-test flow
  signIn: "/login", // existing login flow
  goToMyTest: "/login", // "already booked" -> sign in to resume
  verify: "/verify", // existing certificate-verification route
  individuals: "/start", // individuals -> booking flow
  organizations: "/for-institutions", // existing organization/institution route
  businesses: "/for-business", // existing business/team route
  // TODO(route): no dedicated LBE Training route exists yet. Point at the
  // pricing section (Test + Training) as a temporary, non-broken anchor.
  training: "#pricing",
} as const;

export type NavItem = { label: string; href: string };

export const primaryNav: NavItem[] = [
  { label: "Know the Test", href: "/know-the-test" },
  { label: "LBE Training", href: routes.training },
  { label: "Verify your Certificate", href: "#verify" },
];

/**
 * Pricing plans with live Paymob checkout links. EGP is the FIXED source of
 * truth (Paymob charges in EGP); the USD equivalent is derived from the cached
 * daily exchange rate (see src/lib/pricing). `egpAmount` is the canonical
 * number; `priceEgp` is its display string.
 */
export const pricingPlans = {
  testOnly: {
    slug: "test-only",
    egpAmount: 4400,
    priceEgp: "EGP 4,400",
    href: "https://paymob.link/RDOaq",
  },
  testTraining: {
    slug: "test-training",
    egpAmount: 10000,
    priceEgp: "EGP 10,000",
    href: "https://paymob.link/avbCS",
  },
} as const;

/** Manual-payment / support contact. */
export const contact = {
  whatsapp: "+20 109 796 5058",
  whatsappHref: "https://wa.me/201097965058",
} as const;

/**
 * Footer columns. `null` href = intentional non-navigation placeholder for a
 * page that doesn't exist yet (rendered as muted text, not a broken link).
 */
export const footerNav: {
  title: string;
  items: { label: string; href: string | null; todo?: boolean }[];
}[] = [
  {
    title: "Test",
    items: [
      { label: "Know the Test", href: "/know-the-test" },
      { label: "Score System", href: "#score-system" },
      // TODO(route): dedicated LBE Training page pending.
      { label: "LBE Training", href: routes.training, todo: true },
    ],
  },
  {
    title: "For You",
    items: [
      { label: "Individuals", href: routes.individuals },
      { label: "Organizations", href: routes.organizations },
      { label: "Businesses", href: routes.businesses },
    ],
  },
  {
    title: "Support",
    items: [
      { label: "Verify Certificate", href: "#verify" },
      { label: "FAQ", href: "#faq" },
      // TODO(route): no contact page yet — placeholder, not a link.
      { label: "Contact", href: null },
    ],
  },
  {
    title: "Legal",
    items: [
      // TODO(route): privacy & terms pages pending — placeholders, not links.
      { label: "Privacy", href: null },
      { label: "Terms", href: null },
    ],
  },
];
