"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { saveItem, generateItemAudio } from "@/app/admin/actions";
import {
  emptyDraft, draftFromItem, validateDraft, draftToInput, type ItemDraft,
} from "@/app/admin/library/item-draft";
import { ItemFields } from "@/app/admin/library/ItemFields";

interface ItemData {
  id: string;
  lbe_level: number | null;
  question_type: number | null;
  source_type: string | null;
  prompt: string | null;
  media_url?: string | null;
  options: unknown;
  answer_key: unknown;
  rubric: unknown;
  active: boolean;
}

const label = "mb-1 block text-sm text-muted-foreground";
const field = "h-11 w-full rounded-lg border border-gold/30 bg-card px-3 text-sm";

export function ItemForm({
  examId,
  item,
  audioSignedUrl,
}: {
  examId: string;
  item?: ItemData;
  audioSignedUrl?: string | null;
}) {
  const router = useRouter();
  const [level, setLevel] = React.useState(String(item?.lbe_level ?? 1));
  const [draft, setDraft] = React.useState<ItemDraft>(() =>
    item ? draftFromItem(item) : emptyDraft(),
  );
  const onChange = (patch: Partial<ItemDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  // Audio generation (audio-source items only) — needs a saved item id.
  const [audioPreview, setAudioPreview] = React.useState<string | null>(audioSignedUrl ?? null);
  const [audioPending, startAudio] = React.useTransition();
  const [audioMsg, setAudioMsg] = React.useState<string | null>(null);
  const generateAudio = () =>
    startAudio(async () => {
      setAudioMsg(null);
      if (!item?.id) return;
      const res = await generateItemAudio(item.id, draft.prompt);
      if (res.error) setAudioMsg(res.error);
      else {
        if (res.url) setAudioPreview(res.url);
        setAudioMsg("Audio generated and saved.");
      }
    });

  const submit = () =>
    start(async () => {
      setError(null);
      const err = validateDraft(draft);
      if (err) { setError(err); return; }
      const payload = draftToInput(draft, examId, Number(level));
      if (item?.id) payload.id = item.id;
      const res = await saveItem(payload);
      if (res.error) setError(res.error);
      else router.push(`/admin/library?exam=${examId}`);
    });

  return (
    <div className="max-w-2xl space-y-6">
      <label className="block sm:max-w-xs">
        <span className={label}>Section (LBE level)</span>
        <select value={level} onChange={(e) => setLevel(e.target.value)} className={field}>
          {[1, 2, 3, 4, 5].map((l) => <option key={l} value={l}>Section {l}</option>)}
        </select>
      </label>

      <ItemFields draft={draft} onChange={onChange} />

      {draft.source_type === "audio" && (
        <div className="rounded-xl border border-gold/15 bg-card p-4">
          <p className="mb-1 text-sm font-semibold text-charcoal">Listening audio</p>
          <p className="mb-3 text-xs text-muted-foreground">
            Type the listening script in the <strong>Prompt</strong> field above,
            then generate the audio once. Candidates stream the saved file — Google
            TTS is <strong>not</strong> called again per attempt. Regenerating
            overwrites the stored file.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" size="md" onClick={generateAudio} disabled={audioPending || !item?.id}>
              {audioPending ? <Loader2 className="size-4 animate-spin" /> : <Volume2 className="size-4" />}
              {audioPreview ? "Regenerate audio" : "Generate audio"}
            </Button>
            {!item?.id && (
              <span className="text-xs text-muted-foreground">Save the item first, then generate its audio.</span>
            )}
            {audioMsg && <span className="text-xs text-muted-foreground">{audioMsg}</span>}
          </div>
          {audioPreview && <audio controls src={audioPreview} className="mt-3 h-9 w-full max-w-md" />}
        </div>
      )}

      {error && <p className="text-sm text-rose-700">{error}</p>}

      <div className="flex gap-3">
        <Button type="button" onClick={submit} disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />} Save item
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push(`/admin/library?exam=${examId}`)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
