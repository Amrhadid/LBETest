-- =============================================================================
-- LBET — PLACEHOLDER seed data (THROWAWAY)
-- =============================================================================
-- Generates 5 sections × 10 items = 50 placeholder items for engine/dev preview
-- (/dev/item-preview). This is NOT real exam content — replace it once the real
-- question bank exists.
--
-- Requires migration 0002_exam_engine.sql first (question_type must allow 6).
-- Idempotent: it clears its own placeholder exam's items and re-inserts them.
--
-- Per-section composition (10 items):
--   6 × type 1 (MCQ correct) · 1 × type 2 (MCQ wrong) · 1 × type 4 (name term)
--   1 × type 5 (write definition) · 1 × voice: type 3 on odd sections (1,3,5),
--   type 6 on even sections (2,4).
-- lbe_level always matches the section number.
-- =============================================================================

do $$
declare
  v_exam    uuid   := '11111111-1111-1111-1111-111111111111';
  v_sources text[] := array['email','dialogue','mini_article','memo','script','situation','audio'];
  v_qtypes  int[];
  v_mcq_options jsonb := '[
    {"id":"a","text":"Placeholder option A"},
    {"id":"b","text":"Placeholder option B"},
    {"id":"c","text":"Placeholder option C"},
    {"id":"d","text":"Placeholder option D"}
  ]'::jsonb;
  sec       int;
  i         int;
  qt        int;
  src       text;
  v_prompt  text;
  v_options jsonb;
  v_answer  jsonb;
begin
  -- Placeholder exam (fixed id so re-seeding is idempotent).
  insert into public.exams (id, code, title, version, status, config)
  values (v_exam, 'PLACEHOLDER', 'Placeholder Exam (throwaway seed)', 1, 'draft',
          '{"placeholder": true}'::jsonb)
  on conflict (id) do nothing;

  -- Clear any previous placeholder items before re-inserting.
  delete from public.items where exam_id = v_exam;

  for sec in 1..5 loop
    -- 6× type1, 1× type2, 1× type4, 1× type5, 1× voice (3 odd / 6 even).
    v_qtypes := array[1,1,1,1,1,1,2,4,5, case when sec % 2 = 1 then 3 else 6 end];

    for i in 1..10 loop
      qt := v_qtypes[i];

      -- Source type: sensible for voice items, cycled across the pool otherwise.
      if qt = 3 then
        src := 'situation';
      elsif qt = 6 then
        src := 'audio';
      else
        src := v_sources[((sec + i) % array_length(v_sources, 1)) + 1];
      end if;

      -- Prompt / options / answer_key by question type.
      if qt = 1 then
        v_prompt  := 'Placeholder MCQ (choose the correct answer) for Section ' || sec || ', item ' || i || '.';
        v_options := v_mcq_options;
        v_answer  := '{"correct":"b"}'::jsonb;
      elsif qt = 2 then
        v_prompt  := 'Placeholder MCQ (choose the WRONG answer) for Section ' || sec || ', item ' || i || '.';
        v_options := v_mcq_options;
        v_answer  := '{"correct":"c"}'::jsonb;
      elsif qt = 4 then
        v_prompt  := 'Placeholder definition for Section ' || sec || ', item ' || i || ' — name the term.';
        v_options := null;
        v_answer  := jsonb_build_object('accept', jsonb_build_array('term' || sec || i, 'placeholder term'));
      elsif qt = 5 then
        v_prompt  := 'Placeholder term for Section ' || sec || ', item ' || i || ' — write its definition.';
        v_options := null;
        v_answer  := null;  -- AI-graded later
      elsif qt = 3 then
        v_prompt  := 'Placeholder situation for Section ' || sec || ', item ' || i || ' — respond aloud.';
        v_options := null;
        v_answer  := null;  -- AI-graded later
      else -- qt = 6
        v_prompt  := 'Placeholder speaking question for Section ' || sec || ', item ' || i || ' — answer aloud about the source.';
        v_options := null;
        v_answer  := null;  -- AI-graded later
      end if;

      insert into public.items
        (exam_id, source_type, question_type, lbe_level, prompt, media_url, options, answer_key, rubric, active)
      values
        (v_exam, src, qt, sec, v_prompt, null, v_options, v_answer, null, true);
    end loop;
  end loop;
end $$;

-- Sanity check (optional): should return 50 rows across 5 levels.
-- select lbe_level, count(*) from public.items
--   where exam_id = '11111111-1111-1111-1111-111111111111'
--   group by lbe_level order by lbe_level;
