/**
 * LBE data lives in the `lbe` schema of the shared Locrativ Supabase project
 * (the standalone LBETest project was merged into it). Every client must query
 * this schema, not `public` (which holds Locrativ's own tables).
 */
export const DB_SCHEMA = "lbe" as const;

/** Any Supabase client bound to the `lbe` schema (typed or untyped). */
export type LbeClient = import("@supabase/supabase-js").SupabaseClient<any, any, typeof DB_SCHEMA, any, any>;
