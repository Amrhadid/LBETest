"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Plus, Save, Trash2, Eye, EyeOff, Pencil, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableWrap } from "@/app/admin/ui";
import {
  saveCourseLesson,
  toggleCoursePublished,
  deleteCourseLesson,
  type CourseActionState,
} from "@/app/admin/training/actions";

export interface CourseLesson {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  duration_minutes: number | null;
  position: number;
  published: boolean;
}

const initial: CourseActionState = {};

function SaveButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="gold" size="md" disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : editing ? <Save className="size-4" /> : <Plus className="size-4" />}
      {editing ? "Save changes" : "Add lesson"}
    </Button>
  );
}

const inputCls = "";

export function CourseManager({ lessons }: { lessons: CourseLesson[] }) {
  const [state, formAction] = useActionState(saveCourseLesson, initial);
  const [edit, setEdit] = React.useState<CourseLesson | null>(null);
  const [, startTransition] = React.useTransition();
  const formRef = React.useRef<HTMLFormElement>(null);

  // After a successful save, clear the edit selection and reset the form.
  React.useEffect(() => {
    if (state.message) {
      setEdit(null);
      formRef.current?.reset();
    }
  }, [state.message]);

  const startEdit = (l: CourseLesson) => {
    setEdit(l);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-8">
      {/* Create / edit form */}
      <form
        ref={formRef}
        action={formAction}
        key={edit?.id ?? "new"}
        className="grid gap-4 rounded-2xl border border-gold/20 bg-card p-6 shadow-card sm:grid-cols-2"
      >
        <input type="hidden" name="id" value={edit?.id ?? ""} />
        <label className="sm:col-span-2 text-sm">
          <span className="mb-1.5 block font-medium text-charcoal">Title</span>
          <Input name="title" defaultValue={edit?.title ?? ""} required className={inputCls} placeholder="e.g. Session 1 — Business emails" />
        </label>
        <label className="sm:col-span-2 text-sm">
          <span className="mb-1.5 block font-medium text-charcoal">Description</span>
          <textarea
            name="description"
            defaultValue={edit?.description ?? ""}
            rows={2}
            className="w-full rounded-lg border border-gold/25 bg-background px-3 py-2.5 text-sm"
            placeholder="What this recorded session covers"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1.5 block font-medium text-charcoal">Video link</span>
          <Input name="video_url" type="url" defaultValue={edit?.video_url ?? ""} placeholder="https://…" />
        </label>
        <label className="text-sm">
          <span className="mb-1.5 block font-medium text-charcoal">Duration (minutes)</span>
          <Input name="duration_minutes" type="number" min={0} defaultValue={edit?.duration_minutes ?? ""} placeholder="e.g. 25" />
        </label>
        <label className="text-sm">
          <span className="mb-1.5 block font-medium text-charcoal">Order</span>
          <Input name="position" type="number" min={0} defaultValue={edit?.position ?? 0} />
        </label>
        <label className="flex items-end gap-2 text-sm">
          <input type="checkbox" name="published" defaultChecked={edit?.published ?? false} className="size-4 accent-gold" />
          <span className="pb-2.5 font-medium text-charcoal">Published (visible to candidates)</span>
        </label>
        <div className="flex items-center gap-3 sm:col-span-2">
          <SaveButton editing={!!edit} />
          {edit && (
            <Button type="button" variant="outline" size="md" onClick={() => setEdit(null)}>
              <X className="size-4" /> Cancel
            </Button>
          )}
          {state.error && <span className="text-sm text-rose-700">{state.error}</span>}
          {state.message && <span className="text-sm text-emerald-700">{state.message}</span>}
        </div>
      </form>

      {/* List */}
      <TableWrap>
        <thead>
          <tr className="border-b border-gold/15 text-left text-xs uppercase text-muted-foreground">
            <th className="p-3">Order</th>
            <th className="p-3">Title</th>
            <th className="p-3">Video</th>
            <th className="p-3">Duration</th>
            <th className="p-3">Status</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {lessons.map((l) => (
            <tr key={l.id} className="border-b border-gold/10 last:border-0">
              <td className="p-3 tabular-nums text-muted-foreground">{l.position}</td>
              <td className="p-3">
                <span className="font-medium text-charcoal">{l.title}</span>
                {l.description && (
                  <span className="block max-w-md text-xs text-muted-foreground">{l.description}</span>
                )}
              </td>
              <td className="p-3 text-xs">
                {l.video_url ? (
                  <a href={l.video_url} target="_blank" rel="noopener noreferrer" className="text-gold underline-offset-4 hover:underline">
                    link
                  </a>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              <td className="p-3 text-muted-foreground">{l.duration_minutes != null ? `${l.duration_minutes} min` : "—"}</td>
              <td className="p-3">
                {l.published ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">Published</span>
                ) : (
                  <span className="rounded-full bg-gold/10 px-2 py-0.5 text-xs font-medium text-charcoal">Draft</span>
                )}
              </td>
              <td className="p-3">
                <div className="flex flex-wrap gap-1.5">
                  <Button type="button" variant="outline" size="sm" onClick={() => startEdit(l)}>
                    <Pencil className="size-3.5" /> Edit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => startTransition(async () => { await toggleCoursePublished(l.id, !l.published); })}
                  >
                    {l.published ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    {l.published ? "Unpublish" : "Publish"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Delete "${l.title}"?`)) {
                        startTransition(async () => { await deleteCourseLesson(l.id); });
                      }
                    }}
                  >
                    <Trash2 className="size-3.5" /> Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
          {lessons.length === 0 && (
            <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No sessions yet. Add one above.</td></tr>
          )}
        </tbody>
      </TableWrap>
    </div>
  );
}
