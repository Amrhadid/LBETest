"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FileText, ListChecks, Library,
  GraduationCap, Users, ScrollText, Award, KeyRound, History, FlaskConical, MonitorPlay, ImageIcon, UserCheck,
} from "lucide-react";

import { cn } from "@/lib/utils";

type Item = { label: string; href: string; icon: React.ElementType; adminOnly: boolean };

const ITEMS: Item[] = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard, adminOnly: true },
  { label: "Exams", href: "/admin/exams", icon: FileText, adminOnly: true },
  { label: "Sections", href: "/admin/sections", icon: ListChecks, adminOnly: true },
  { label: "Exam Library", href: "/admin/library", icon: Library, adminOnly: true },
  { label: "LBE Training", href: "/admin/training", icon: MonitorPlay, adminOnly: true },
  { label: "Students", href: "/admin/students", icon: GraduationCap, adminOnly: true },
  { label: "Users", href: "/admin/users", icon: Users, adminOnly: true },
  // Grading now happens in context on each attempt's detail page; teachers get
  // the Attempts list (with the "needs grading" view) as their home.
  { label: "Attempts / Results", href: "/admin/attempts", icon: ScrollText, adminOnly: false },
  { label: "AI Grading Test", href: "/admin/ai-grading-test", icon: FlaskConical, adminOnly: true },
  { label: "Certificates", href: "/admin/certificates", icon: Award, adminOnly: true },
  { label: "Certificate Photos", href: "/admin/certificate-photos", icon: ImageIcon, adminOnly: true },
  { label: "Candidate Names", href: "/admin/candidate-names", icon: UserCheck, adminOnly: true },
  { label: "Access Codes", href: "/admin/access-codes", icon: KeyRound, adminOnly: true },
  { label: "Audit Log", href: "/admin/audit-log", icon: History, adminOnly: true },
];

export function AdminNav({ role }: { role: string }) {
  const pathname = usePathname();
  const items = ITEMS.filter((i) => role === "admin" || !i.adminOnly);

  return (
    <nav className="flex flex-col gap-1">
      {items.map((it) => {
        const active =
          it.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(it.href);
        const Icon = it.icon;
        return (
          <Link
            key={it.href}
            href={it.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-gold/15 text-charcoal"
                : "text-muted-foreground hover:bg-gold/8 hover:text-charcoal",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
