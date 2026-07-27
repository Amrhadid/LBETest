import type { Metadata } from "next";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";
import { emailMap } from "@/lib/admin/users";
import { AdminHeader, TableWrap } from "@/app/admin/ui";
import { RoleSelect } from "@/app/admin/users/RoleSelect";
import type { Role } from "@/lib/supabase/types";

export const metadata: Metadata = { title: "Admin — Users" };

export default async function AdminUsersPage() {
  await requireAdmin();
  const svc = createServiceRoleClient();
  const [{ data: profiles }, emails] = await Promise.all([
    svc.from("profiles").select("id, full_name, role, created_at").order("created_at", { ascending: true }),
    emailMap(),
  ]);

  return (
    <div>
      <AdminHeader
        eyebrow="Admin"
        title="Users"
        description="All accounts. Assign the teacher role (teachers can access Grading only)."
      />

      <TableWrap>
        <thead>
          <tr className="border-b border-gold/15 text-left text-xs uppercase text-muted-foreground">
            <th className="p-3">Name</th>
            <th className="p-3">Email</th>
            <th className="p-3">Role</th>
          </tr>
        </thead>
        <tbody>
          {(profiles ?? []).map((p) => (
            <tr key={p.id} className="border-b border-gold/10 last:border-0">
              <td className="p-3 font-medium">{p.full_name ?? "—"}</td>
              <td className="p-3 text-muted-foreground">{emails.get(p.id) ?? "—"}</td>
              <td className="p-3"><RoleSelect userId={p.id} role={(p.role ?? "candidate") as Role} /></td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    </div>
  );
}
