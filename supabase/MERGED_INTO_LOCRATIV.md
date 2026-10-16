# LBETest database merged into Locrativ

The standalone LBETest Supabase project (`hjqaflgcwguddfxypbrq`) was merged into
the Locrativ project (`hiqhbxxlbonlyemxuvad`) on 2026-10-16.

- All LBE tables, functions, RLS policies and triggers now live in the **`lbe`**
  schema of the Locrativ database (Locrativ's own tables stay in `public`).
  The site's Supabase clients are pinned to it via `DB_SCHEMA` in
  `src/lib/supabase/schema.ts`.
- LBE users were mapped by email onto their existing Locrativ accounts, so one
  login works on both sites. Every Locrativ signup also gets an `lbe.profiles`
  row (trigger `on_auth_user_created_lbe`).
- Storage buckets keep their names (`certificates`, `responses-audio`,
  `certificate-photos`, `room-scans`, `id-verification`, `attempt-recordings`).
- The files in `migrations/` describe the old standalone project and are kept
  for history only; the merged schema is recorded in Locrativ's migration
  history (`lbe_merge_*`).
