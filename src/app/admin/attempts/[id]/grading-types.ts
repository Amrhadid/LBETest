/** One AI-graded response staged for approval on an attempt's detail page. */
export interface PendingGrade {
  responseId: string;
  attemptId: string;
  questionType: number;
  questionTypeLabel: string;
  lbeLevel: number | null;
  prompt: string | null;
  isVoice: boolean;
  candidateText: string; // typed answer OR speech transcript
  audioUrl: string | null;
  aiScore: number | null;
  maxScore: number;
  aiIsCorrect: boolean | null;
  aiConfidence: number | null;
  feedback: string;
  criteria: { id: string; met: boolean; note?: string }[];
  failed: boolean;
  errorMessage: string | null;
}
