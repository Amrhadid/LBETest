"use client";

import * as React from "react";
import { Mail, Newspaper, FileText, MessagesSquare, Clapperboard, Volume2, Headphones } from "lucide-react";

import { cn } from "@/lib/utils";
import { SourceType, type ExamItem } from "@/lib/exam/types";

/**
 * Renders an item's SOURCE stimulus — the material a candidate reads or listens
 * to before answering. This is playback/reading only; it is NOT the type 3/6
 * recording UI (see AudioRecordQuestion for that).
 *
 * - email / mini_article / memo / situation / script → formatted text
 * - dialogue → labeled speaker exchange
 * - audio → HTML5 <audio> player with a visible "replays left" counter
 */
export function SourceStimulus({
  item,
  maxReplays = 2,
  className,
}: {
  item: ExamItem;
  /** Replays allowed for audio sources (the first play is free). */
  maxReplays?: number;
  className?: string;
}) {
  const sourceType = item.source_type;

  return (
    <figure
      // Copy-block (#7): the source/passage text can't be selected, copied, or
      // right-clicked out. Deters pasting the stimulus into an outside tool.
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
      className={cn(
        "select-none rounded-2xl border border-gold/20 bg-card p-5 shadow-card sm:p-6",
        className,
      )}
    >
      <figcaption className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gold">
        <SourceIcon type={sourceType} />
        {sourceLabel(sourceType)}
      </figcaption>

      {sourceType === SourceType.Audio ? (
        <AudioSource src={item.media_url} maxReplays={maxReplays} />
      ) : sourceType === SourceType.Dialogue ? (
        <DialogueSource text={item.prompt} />
      ) : (
        <TextSource text={item.prompt} />
      )}
    </figure>
  );
}

function sourceLabel(type: ExamItem["source_type"]): string {
  switch (type) {
    case SourceType.Email:
      return "Email";
    case SourceType.MiniArticle:
      return "Article";
    case SourceType.Memo:
      return "Memo";
    case SourceType.Situation:
      return "Situation";
    case SourceType.Script:
      return "Script";
    case SourceType.Dialogue:
      return "Dialogue";
    case SourceType.Audio:
      return "Audio";
    default:
      return "Source";
  }
}

function SourceIcon({ type }: { type: ExamItem["source_type"] }) {
  const cls = "size-4";
  switch (type) {
    case SourceType.Email:
    case SourceType.Memo:
      return <Mail className={cls} />;
    case SourceType.MiniArticle:
      return <Newspaper className={cls} />;
    case SourceType.Dialogue:
      return <MessagesSquare className={cls} />;
    case SourceType.Script:
      return <Clapperboard className={cls} />;
    case SourceType.Audio:
      return <Headphones className={cls} />;
    default:
      return <FileText className={cls} />;
  }
}

/** Formatted plain text (email / article / memo / situation / script). */
function TextSource({ text }: { text: string | null }) {
  if (!text) return <EmptyBody />;
  return (
    <div className="space-y-3 text-[0.975rem] leading-relaxed text-charcoal">
      {text.split(/\n{2,}/).map((para, i) => (
        <p key={i} className="whitespace-pre-line">
          {para}
        </p>
      ))}
    </div>
  );
}

/**
 * Dialogue rendering. Lines shaped "Speaker: text" become a labeled exchange;
 * lines without a colon are shown as continuation text.
 */
function DialogueSource({ text }: { text: string | null }) {
  if (!text) return <EmptyBody />;
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  return (
    <dl className="space-y-2.5">
      {lines.map((line, i) => {
        const m = line.match(/^([^:]{1,32}):\s*(.*)$/);
        if (!m) {
          return (
            <dd key={i} className="ml-0 text-[0.975rem] leading-relaxed text-charcoal">
              {line}
            </dd>
          );
        }
        return (
          <div key={i} className="flex gap-3">
            <dt className="min-w-24 shrink-0 text-sm font-semibold text-gold">
              {m[1]}
            </dt>
            <dd className="text-[0.975rem] leading-relaxed text-charcoal">
              {m[2]}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

/**
 * Audio source PLAYER. The candidate listens; a counter shows replays left.
 * The first play is free; each subsequent play consumes one replay, and the
 * control is disabled once replays are exhausted mid-listen.
 */
function AudioSource({
  src,
  maxReplays,
}: {
  src: string | null;
  maxReplays: number;
}) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [hasPlayedOnce, setHasPlayedOnce] = React.useState(false);
  const [replaysUsed, setReplaysUsed] = React.useState(0);

  const replaysLeft = maxReplays - replaysUsed;
  const exhausted = hasPlayedOnce && replaysLeft <= 0;

  // When a replay would start but none remain, block it.
  const handlePlay = () => {
    if (!hasPlayedOnce) {
      setHasPlayedOnce(true);
      return;
    }
    if (replaysLeft <= 0) {
      audioRef.current?.pause();
      return;
    }
    setReplaysUsed((n) => n + 1);
  };

  if (!src) {
    return (
      <div className="rounded-xl border border-dashed border-gold/30 bg-gold/5 p-4 text-sm text-muted-foreground">
        <Volume2 className="mb-1 inline size-4 text-gold" /> Audio source not
        available in this preview (no media_url).
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <audio
        ref={audioRef}
        controls
        preload="none"
        src={src}
        onPlay={handlePlay}
        className="w-full"
      />
      <div className="flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <Headphones className="size-3.5 text-gold" />
          Listen carefully — replays are limited.
        </span>
        <span
          className={cn(
            "rounded-full border px-2.5 py-1 font-semibold",
            exhausted
              ? "border-red-300/60 bg-red-50 text-red-700"
              : "border-gold/40 bg-gold/8 text-charcoal",
          )}
        >
          {exhausted
            ? "No replays left"
            : `${Math.max(replaysLeft, 0)} replay${replaysLeft === 1 ? "" : "s"} left`}
        </span>
      </div>
    </div>
  );
}

function EmptyBody() {
  return (
    <p className="text-sm italic text-muted-foreground">
      No source content provided.
    </p>
  );
}
