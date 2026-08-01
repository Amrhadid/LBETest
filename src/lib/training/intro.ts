/**
 * Shared shapes + option lists for Material · Lesson 1 "Introduce Yourself".
 * Pure (no server imports) so both the client form and the server generator use
 * the same definitions.
 */

export const CURRENT_STATUSES = [
  { value: "employed", label: "Employed" },
  { value: "job_seeking", label: "Job-seeking" },
  { value: "student", label: "Student" },
] as const;

export const TONES = [
  { value: "formal", label: "Formal" },
  { value: "friendly", label: "Friendly-professional" },
] as const;

/** Suggested chips for the "add your own too" multi-selects. */
export const EXPERIENCE_SUGGESTIONS = [
  "Customer service",
  "Sales",
  "Project management",
  "Data analysis",
  "Operations",
  "Marketing",
];

export const SOFT_SKILL_SUGGESTIONS = [
  "Communication",
  "Teamwork",
  "Leadership",
  "Problem-solving",
  "Time management",
  "Adaptability",
  "Attention to detail",
  "Critical thinking",
];

export const QUALIFICATION_SUGGESTIONS = [
  "Bachelor's degree",
  "Master's degree",
  "MBA",
  "Professional certification",
  "Language certification",
];

export const WEAKNESS_SUGGESTIONS = [
  "Public speaking",
  "Delegation",
  "Perfectionism",
  "Work-life balance",
  "Patience",
  "Still building technical skills",
];

/** The candidate's Introduce-Yourself answers (the form + stored submission). */
export interface IntroData {
  name: string;
  date_of_birth: string; // yyyy-mm-dd; used only to inform phrasing, never stated
  city: string;
  education: string;
  current_status: string;
  previous_job: string;
  field: string;
  experience_areas: string[];
  soft_skills: string[];
  qualifications: string[];
  career_goal: string;
  key_achievement: string;
  languages: string;
  weaknesses: string[];
  tone: string;
}

export const EMPTY_INTRO: IntroData = {
  name: "",
  date_of_birth: "",
  city: "",
  education: "",
  current_status: "",
  previous_job: "",
  field: "",
  experience_areas: [],
  soft_skills: [],
  qualifications: [],
  career_goal: "",
  key_achievement: "",
  languages: "",
  weaknesses: [],
  tone: "friendly",
};
