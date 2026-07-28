-- =============================================================================
-- LBET — make exam-audio private (served via short-lived signed URLs)
-- =============================================================================
-- Idempotent. Follows 0015.
--
-- Listening-passage audio is no longer served by a permanent public URL. The
-- bucket becomes private; items store the object PATH, and the exam runner /
-- admin preview mint a short-lived (1 hour) signed URL via the service role.
-- =============================================================================

update storage.buckets set public = false where id = 'exam-audio';

-- Drop the public read policy — access is service-role only now (signed URLs).
drop policy if exists exam_audio_public_read on storage.objects;

-- (No client read/write policy: the service role signs URLs and writes files.)

-- =============================================================================
-- End of migration.
-- =============================================================================
