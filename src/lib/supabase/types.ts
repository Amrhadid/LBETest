/**
 * Database types for the LBET Supabase backend.
 *
 * These are hand-maintained to mirror `supabase/migrations`. When the schema
 * changes, regenerate with `supabase gen types typescript` (or update here)
 * so the typed clients stay in sync with the database.
 */

export type Role =
  | "candidate"
  | "company_admin"
  | "company_member"
  | "institution_admin"
  | "teacher"
  | "grader"
  | "admin"
  | "super_admin";

export type OrgType = "company" | "institution";
export type ItemSourceType =
  | "article"
  | "dialogue"
  | "email"
  | "script"
  | "situation"
  | "audio";
export type CertificateStatus = "valid" | "expired" | "revoked";

type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          role: Role;
          locale: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          role?: Role;
          locale?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      organizations: {
        Row: {
          id: string;
          type: OrgType | null;
          name: string | null;
          plan: string | null;
          seats_total: number;
          seats_used: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          type?: OrgType | null;
          name?: string | null;
          plan?: string | null;
          seats_total?: number;
          seats_used?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["organizations"]["Insert"]>;
        Relationships: [];
      };
      memberships: {
        Row: {
          id: string;
          user_id: string;
          org_id: string;
          role: string | null;
          status: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          org_id: string;
          role?: string | null;
          status?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["memberships"]["Insert"]>;
        Relationships: [];
      };
      exams: {
        Row: {
          id: string;
          code: string | null;
          title: string | null;
          version: number | null;
          status: string;
          config: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          code?: string | null;
          title?: string | null;
          version?: number | null;
          status?: string;
          config?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["exams"]["Insert"]>;
        Relationships: [];
      };
      items: {
        Row: {
          id: string;
          exam_id: string | null;
          source_type: ItemSourceType | null;
          question_type: number | null;
          lbe_level: number | null;
          prompt: string | null;
          media_url: string | null;
          options: Json | null;
          answer_key: Json | null;
          rubric: Json | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          exam_id?: string | null;
          source_type?: ItemSourceType | null;
          question_type?: number | null;
          lbe_level?: number | null;
          prompt?: string | null;
          media_url?: string | null;
          options?: Json | null;
          answer_key?: Json | null;
          rubric?: Json | null;
          active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["items"]["Insert"]>;
        Relationships: [];
      };
      forms: {
        Row: {
          id: string;
          exam_id: string | null;
          label: string | null;
          item_ids: string[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          exam_id?: string | null;
          label?: string | null;
          item_ids?: string[] | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["forms"]["Insert"]>;
        Relationships: [];
      };
      attempts: {
        Row: {
          id: string;
          user_id: string;
          exam_id: string | null;
          form_id: string | null;
          org_id: string | null;
          status: string;
          started_at: string | null;
          submitted_at: string | null;
          provisional_score: number | null;
          final_score: number | null;
          lbe_level: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          exam_id?: string | null;
          form_id?: string | null;
          org_id?: string | null;
          status?: string;
          started_at?: string | null;
          submitted_at?: string | null;
          provisional_score?: number | null;
          final_score?: number | null;
          lbe_level?: number | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["attempts"]["Insert"]>;
        Relationships: [];
      };
      responses: {
        Row: {
          id: string;
          attempt_id: string;
          item_id: string | null;
          answer: Json | null;
          is_correct: boolean | null;
          score: number | null;
          graded_by: string | null;
          graded_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          attempt_id: string;
          item_id?: string | null;
          answer?: Json | null;
          is_correct?: boolean | null;
          score?: number | null;
          graded_by?: string | null;
          graded_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["responses"]["Insert"]>;
        Relationships: [];
      };
      attempt_events: {
        Row: {
          id: string;
          attempt_id: string;
          type: string | null;
          payload: Json | null;
          at: string;
        };
        Insert: {
          id?: string;
          attempt_id: string;
          type?: string | null;
          payload?: Json | null;
          at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["attempt_events"]["Insert"]>;
        Relationships: [];
      };
      certificates: {
        Row: {
          id: string;
          cert_code: string;
          attempt_id: string | null;
          user_id: string;
          lbe_level: number | null;
          score: number | null;
          issued_at: string | null;
          expires_at: string | null;
          status: CertificateStatus;
          issue_hash: string | null;
          pdf_url: string | null;
        };
        Insert: {
          id?: string;
          cert_code: string;
          attempt_id?: string | null;
          user_id: string;
          lbe_level?: number | null;
          score?: number | null;
          issued_at?: string | null;
          expires_at?: string | null;
          status?: CertificateStatus;
          issue_hash?: string | null;
          pdf_url?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["certificates"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
