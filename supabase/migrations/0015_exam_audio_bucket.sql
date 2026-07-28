-- =============================================================================
-- LBET — exam-audio storage bucket for generated listening passages
-- =============================================================================
-- Idempotent.
--
-- Holds the MP3 audio synthesized (once per item) from an audio-source item's
-- script via Google TTS. Candidates stream the stored file directly; TTS is
-- never called on a candidate attempt. Public bucket so the <audio> element can
-- stream it by a stable URL; writes happen only via the service-role admin
-- action. Files are keyed by item id ("<item_id>.mp3"), so regenerating an
-- item's audio overwrites its object.
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('exam-audio', 'exam-audio', true)
on conflict (id) do nothing;

-- Public read (listening passages are streamed by candidates).
drop policy if exists exam_audio_public_read on storage.objects;
create policy exam_audio_public_read on storage.objects
  for select
  using (bucket_id = 'exam-audio');

-- No insert/update/delete policy for end users: audio is written only by the
-- service-role admin "Generate audio" action, which bypasses RLS.

-- =============================================================================
-- End of migration.
-- =============================================================================
