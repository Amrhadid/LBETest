/** Central place for nav + marketing copy so header/footer stay in sync. */

export const siteConfig = {
  name: "LBET",
  fullName: "Locrativ Business English Test",
  domain: "lbetest.com",
  description:
    "An online Business English exam that scores you in ~60 minutes and issues a verifiable certificate employers can trust.",
};

export type NavItem = { label: string; href: string };

export const primaryNav: NavItem[] = [
  { label: "The Test", href: "#the-test" },
  { label: "Levels", href: "#levels" },
  { label: "For Individuals", href: "/for-individuals" },
  { label: "For Business", href: "/for-business" },
  { label: "For Schools", href: "/for-institutions" },
  { label: "Pricing", href: "#pricing" },
  { label: "Verify", href: "#verify" },
];

export const footerNav: { title: string; items: NavItem[] }[] = [
  {
    title: "Product",
    items: [
      { label: "The Test", href: "#the-test" },
      { label: "Levels (CEFR)", href: "#levels" },
      { label: "Sample question", href: "#sample" },
      { label: "Pricing", href: "#pricing" },
      { label: "Verify a certificate", href: "#verify" },
    ],
  },
  {
    title: "Audiences",
    items: [
      { label: "For Individuals", href: "/for-individuals" },
      { label: "For Business", href: "/for-business" },
      { label: "For Schools", href: "/for-institutions" },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "About Locrativ", href: "#" },
      { label: "Contact", href: "#" },
      { label: "Help center", href: "#faq" },
      { label: "Status", href: "#" },
    ],
  },
  {
    title: "Legal",
    items: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Accessibility", href: "#" },
      { label: "Cookies", href: "#" },
    ],
  },
];
