import Link from "next/link";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { signOut } from "@/app/login/actions";
import { requireStaff } from "@/lib/admin/guard";
import { AdminNav } from "@/app/admin/AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireStaff();

  return (
    <div className="flex min-h-dvh bg-ivory text-charcoal">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-gold/15 bg-card px-4 py-6 md:flex">
        <Link href="/" className="mb-8 flex items-center gap-2 px-2">
          <span className="grid size-8 place-items-center rounded-lg bg-charcoal text-sm font-bold text-white">
            L
          </span>
          <span className="font-serif-display text-lg">LBE Admin</span>
        </Link>
        <AdminNav role={user.role} />
        <div className="mt-auto space-y-3 pt-6">
          <p className="px-3 text-xs text-muted-foreground">
            {user.email}
            <span className="ml-1 rounded bg-gold/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-charcoal">
              {user.role}
            </span>
          </p>
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm" className="w-full justify-start">
              <LogOut className="size-4" /> Sign out
            </Button>
          </form>
        </div>
      </aside>

      {/* Mobile top bar with a compact nav */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-gold/15 bg-card px-4 py-3 md:hidden">
          <Link href="/admin" className="font-serif-display text-lg">
            LBE Admin
          </Link>
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm">
              <LogOut className="size-4" />
            </Button>
          </form>
        </header>
        <div className="border-b border-gold/15 bg-card px-2 py-2 md:hidden">
          <div className="overflow-x-auto">
            <AdminNav role={user.role} />
          </div>
        </div>
        <main className="min-w-0 flex-1 px-5 py-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
