-- =============================================================================
-- LBET — AI grading scaffolding (step 9, part 1)
-- =============================================================================
-- Idempotent. Requires 0001–0004.
--
-- Ships the infrastructure for AI grading of open-ended items:
--   1. responses grading columns: transcript, ai_confidence, ai_feedback.
--   2. review_queue table — low-confidence / near-threshold cases for step 10.
--   3. Documents the items.rubric JSON shape used by the text grader.
--
-- Grading of types 4 (name the term) & 5 (write the definition) runs in the app
-- (claude-sonnet-5). Voice types 3 & 6 are deferred (need transcription first).
-- Nothing here is candidate-facing.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. responses: AI-grading columns
-- -----------------------------------------------------------------------------
alter table public.responses
  add column if not exists transcript    text,            -- STT text for voice items (types 3/6), later
  add column if not exists ai_confidence numeric,         -- grader self-reported confidence 0..1
  add column if not exists ai_feedback   jsonb;           -- { feedback, criteria:[{id,met,note}], model, ... }

comment on column public.responses.transcript is
  'Speech-to-text transcript for spoken responses (types 3/6). Populated by a later transcription step so human reviewers can read without replaying audio.';
comment on column public.responses.ai_confidence is
  'AI grader self-reported confidence, 0..1. Low values are flagged into review_queue.';
comment on column public.responses.ai_feedback is
  'AI grader output detail (feedback text, per-criterion notes, model id). Not shown to candidates.';

-- -----------------------------------------------------------------------------
-- items.rubric JSON shape (grading criteria for open-ended items)
-- -----------------------------------------------------------------------------
--   {
--     "version": 1,
--     "max_score": 1,                 -- points available
--     "pass_threshold": 0.6,          -- is_correct := score >= pass_threshold * max_score
--     "criteria": [                   -- what the grader checks
--       { "id": "c1", "description": "…", "weight": 1 }
--     ],
--     "model_answer": "…",            -- optional reference answer
--     "guidance": "…"                 -- optional grader instructions
--   }
comment on column public.items.rubric is
  'Grading rubric for open-ended items (types 3/4/5/6): {version, max_score, pass_threshold, criteria:[{id,description,weight}], model_answer?, guidance?}.';

-- -----------------------------------------------------------------------------
-- 2. review_queue: flagged responses for human spot-check (step 10)
-- -----------------------------------------------------------------------------
create table if not exists public.review_queue (
  id           uuid primary key default gen_random_uuid(),
  attempt_id   uuid not null references public.attempts (id) on delete cascade,
  response_id  uuid references public.responses (id) on delete cascade,
  item_id      uuid references public.items (id) on delete set null,
  lbe_level    int,                       -- section, for near-threshold flags
  reason       text not null,             -- 'low_confidence' | 'near_threshold' | 'grading_error'
  detail       jsonb,                     -- reason-specific context
  status       text not null default 'open'
               check (status in ('open','resolved','dismissed')),
  created_at   timestamptz not null default now(),
  resolved_by  uuid references public.profiles (id) on delete set null,
  resolved_at  timestamptz
);

-- One open flag per (response, reason); re-grading upserts instead of piling up.
create unique index if not exists uq_review_queue_response_reason
  on public.review_queue (response_id, reason)
  where response_id is not null;

create index if not exists idx_review_queue_attempt on public.review_queue (attempt_id);
create index if not exists idx_review_queue_status  on public.review_queue (status);

alter table public.review_queue enable row level security;

-- Staff only. Candidates cannot read the queue (no interim feedback / internal).
drop policy if exists review_queue_staff_read on public.review_queue;
create policy review_queue_staff_read on public.review_queue
  for select using (public.is_grader() or public.is_admin());

drop policy if exists review_queue_admin_all on public.review_queue;
create policy review_queue_admin_all on public.review_queue
  for all using (public.is_admin()) with check (public.is_admin());

-- =============================================================================
-- End of migration.
-- =============================================================================
