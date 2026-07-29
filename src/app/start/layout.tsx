import { DesktopOnlyGate } from "@/app/start/DesktopOnlyGate";

/**
 * Route-level gate for the exam. The LBET may only be taken on a desktop or
 * laptop, so every `/start` state (entitlement gate, in-progress exam, and the
 * submitted screen) is wrapped in the desktop-only gate.
 */
export default function StartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DesktopOnlyGate>{children}</DesktopOnlyGate>;
}
