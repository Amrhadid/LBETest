-- =============================================================================
-- LBET exam engine — schema fix + response-audio storage
-- =============================================================================
-- Idempotent: safe to run multiple times in the Supabase SQL editor.
--
--   1. Widen items.question_type from 1..5 to 1..6 and document the mapping.
--   2. Create a private "responses-audio" storage bucket for spoken responses
--      (types 3 & 6) with RLS: an owner can manage only their own files; staff
--      (grader/teacher/admin/super_admin) can read all.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. question_type: 1..5 -> 1..6
-- -----------------------------------------------------------------------------
-- Question-type mapping:
--   1 = choose the correct answer (MCQ)          [auto-graded]
--   2 = choose the wrong answer (MCQ)            [auto-graded]
--   3 = respond to a situation (spoken)          [AI-graded later]
--   4 = given a definition, name the term         [auto-graded]
--   5 = given a term, write the definition        [AI-graded later]
--   6 = speaking question about the source (spoken)[AI-graded later]
alter table public.items
  drop constraint if exists items_question_type_check;

alter table public.items
  add constraint items_question_type_check
  check (question_type between 1 and 6);

comment on column public.items.question_type is
  '1=choose correct answer (MCQ); 2=choose wrong answer; 3=respond to a situation (spoken); 4=given a definition, name the term; 5=given a term, write the definition; 6=speaking question about the source (spoken).';

-- -----------------------------------------------------------------------------
-- 1b. source_type: align with the engine SourceType vocabulary.
-- 0001 allowed ('article',...); the engine uses 'mini_article' and adds 'memo'.
-- Keep 'article' too so any pre-existing rows remain valid (superset).
-- -----------------------------------------------------------------------------
alter table public.items
  drop constraint if exists items_source_type_check;

alter table public.items
  add constraint items_source_type_check
  check (source_type in (
    'email','dialogue','mini_article','memo','script','situation','audio','article'
  ));

comment on column public.items.source_type is
  'Source stimulus kind: email, dialogue, mini_article, memo, script, situation, audio (article kept for backward compatibility).';

-- -----------------------------------------------------------------------------
-- 2. responses-audio storage bucket (private)
-- -----------------------------------------------------------------------------
-- Files are keyed by "<user_id>/<...>" so the first path segment identifies the
-- owner. That lets RLS compare auth.uid() to the folder name.
insert into storage.buckets (id, name, public)
values ('responses-audio', 'responses-audio', false)
on conflict (id) do nothing;

-- Owner: full control over files under their own "<uid>/..." prefix.
drop policy if exists responses_audio_owner_all on storage.objects;
create policy responses_audio_owner_all on storage.objects
  for all
  to authenticated
  using (
    bucket_id = 'responses-audio'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'responses-audio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Staff: read-only access to every response recording for grading.
drop policy if exists responses_audio_staff_read on storage.objects;
create policy responses_audio_staff_read on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'responses-audio'
    and public.is_grader()
  );

-- =============================================================================
-- End of migration.
-- =============================================================================
