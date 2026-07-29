/**
 * Database types for the LBET Supabase backend.
 *
 * These are hand-maintained to mirror `supabase/migrations`. When the schema
 * changes, regenerate with `supabase gen types typescript` (or update here)
 * so the typed clients stay in sync with the database.
 */

/** Two staff roles — admin, teacher — plus candidate (default for test-takers). */
export type Role = "candidate" | "teacher" | "admin";

export type OrgType = "company" | "institution";
export type ItemSourceType =
  | "article"
  | "dialogue"
  | "email"
  | "mini_article"
  | "memo"
  | "script"
  | "situation"
  | "audio";
export type CertificateStatus = "valid" | "expired" | "revoked";
export type AccessCodeStatus = "unused" | "used" | "revoked";

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
          exposure_count: number;
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
          exposure_count?: number;
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
          access_code_id: string | null;
          is_preview: boolean;
          trust_score: number | null;
          trust_breakdown: Json | null;
          country: string | null;
          network: string | null;
          asn: string | null;
          is_datacenter: boolean;
          fingerprint: string | null;
          room_scan_path: string | null;
          violation_count: number;
          id_verified: boolean;
          id_image_path: string | null;
          selfie_path: string | null;
          has_webcam_rec: boolean;
          has_mic_rec: boolean;
          has_screen_rec: boolean;
          no_face_count: number;
          multi_face_count: number;
          multi_speaker: boolean;
          review_status: string | null;
          review_note: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
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
          access_code_id?: string | null;
          is_preview?: boolean;
          trust_score?: number | null;
          trust_breakdown?: Json | null;
          country?: string | null;
          network?: string | null;
          asn?: string | null;
          is_datacenter?: boolean;
          fingerprint?: string | null;
          room_scan_path?: string | null;
          violation_count?: number;
          id_verified?: boolean;
          id_image_path?: string | null;
          selfie_path?: string | null;
          has_webcam_rec?: boolean;
          has_mic_rec?: boolean;
          has_screen_rec?: boolean;
          no_face_count?: number;
          multi_face_count?: number;
          multi_speaker?: boolean;
          review_status?: string | null;
          review_note?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["attempts"]["Insert"]>;
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: string;
          actor_id: string | null;
          actor_email: string | null;
          action: string;
          target_type: string | null;
          target_id: string | null;
          detail: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          actor_email?: string | null;
          action: string;
          target_type?: string | null;
          target_id?: string | null;
          detail?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_log"]["Insert"]>;
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
          transcript: string | null;
          ai_confidence: number | null;
          ai_feedback: Json | null;
          ai_score: number | null;
          ai_is_correct: boolean | null;
          grade_status: string | null;
          approved_by: string | null;
          approved_at: string | null;
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
          transcript?: string | null;
          ai_confidence?: number | null;
          ai_feedback?: Json | null;
          ai_score?: number | null;
          ai_is_correct?: boolean | null;
          grade_status?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
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
          percentile_rank: number | null;
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
          percentile_rank?: number | null;
          issued_at?: string | null;
          expires_at?: string | null;
          status?: CertificateStatus;
          issue_hash?: string | null;
          pdf_url?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["certificates"]["Insert"]>;
        Relationships: [];
      };
      access_codes: {
        Row: {
          id: string;
          code: string;
          exam_id: string | null;
          status: AccessCodeStatus;
          assigned_org_id: string | null;
          redeemed_by: string | null;
          redeemed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          exam_id?: string | null;
          status?: AccessCodeStatus;
          assigned_org_id?: string | null;
          redeemed_by?: string | null;
          redeemed_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["access_codes"]["Insert"]>;
        Relationships: [];
      };
      section_scores: {
        Row: {
          attempt_id: string;
          lbe_level: number;
          auto_correct_count: number;
          auto_total: number;
          updated_at: string;
        };
        Insert: {
          attempt_id: string;
          lbe_level: number;
          auto_correct_count?: number;
          auto_total?: number;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["section_scores"]["Insert"]>;
        Relationships: [];
      };
      review_queue: {
        Row: {
          id: string;
          attempt_id: string;
          response_id: string | null;
          item_id: string | null;
          lbe_level: number | null;
          reason: string;
          detail: Json | null;
          status: string;
          created_at: string;
          resolved_by: string | null;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          attempt_id: string;
          response_id?: string | null;
          item_id?: string | null;
          lbe_level?: number | null;
          reason: string;
          detail?: Json | null;
          status?: string;
          created_at?: string;
          resolved_by?: string | null;
          resolved_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["review_queue"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      redeem_access_code: {
        Args: { p_code: string };
        Returns: string;
      };
      score_section: {
        Args: { p_attempt_id: string; p_lbe_level: number };
        Returns: undefined;
      };
      score_attempt: {
        Args: { p_attempt_id: string };
        Returns: undefined;
      };
      approve_response_grade: {
        Args: { p_response_id: string; p_decision: string };
        Returns: undefined;
      };
      grade_response_manual: {
        Args: { p_response_id: string; p_score: number; p_is_correct: boolean };
        Returns: undefined;
      };
      bump_item_exposure: {
        Args: { p_exam_id: string };
        Returns: undefined;
      };
      submit_attempt: {
        Args: { p_attempt_id: string };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
