"use client";

import { QuestionType, type ExamItem, type ResponseAnswer } from "@/lib/exam/types";
import { SingleSelectQuestion } from "@/components/exam/questions/SingleSelectQuestion";
import { TermInputQuestion } from "@/components/exam/questions/TermInputQuestion";
import { DefinitionQuestion } from "@/components/exam/questions/DefinitionQuestion";
import { AudioRecordQuestion } from "@/components/exam/questions/AudioRecordQuestion";

/**
 * Dispatches an item to the correct question-type component. This is the single
 * entry point exam surfaces use to render an interactive question.
 */
export function QuestionRenderer({
  item,
  value,
  onChange,
  disabled,
  revealResult,
  uploader,
  disableClipboard,
}: {
  item: ExamItem;
  value: ResponseAnswer;
  onChange: (answer: ResponseAnswer) => void;
  disabled?: boolean;
  revealResult?: boolean;
  uploader?: (blob: Blob) => Promise<string>;
  /** Exam lockdown: block copy/paste in free-text (type 5). */
  disableClipboard?: boolean;
}) {
  switch (item.question_type) {
    case QuestionType.ChooseCorrect:
    case QuestionType.ChooseWrong:
      return (
        <SingleSelectQuestion
          item={item}
          value={value}
          onChange={onChange}
          disabled={disabled}
          revealResult={revealResult}
        />
      );
    case QuestionType.NameTheTerm:
      return (
        <TermInputQuestion
          item={item}
          value={value}
          onChange={onChange}
          disabled={disabled}
          revealResult={revealResult}
        />
      );
    case QuestionType.WriteTheDefinition:
      return (
        <DefinitionQuestion
          item={item}
          value={value}
          onChange={onChange}
          disabled={disabled}
          disableClipboard={disableClipboard}
        />
      );
    case QuestionType.RespondToSituation:
    case QuestionType.SpeakAboutSource:
      return (
        <AudioRecordQuestion
          item={item}
          value={value}
          onChange={onChange}
          disabled={disabled}
          uploader={uploader}
        />
      );
    default:
      return (
        <p className="text-sm italic text-muted-foreground">
          Unsupported question type.
        </p>
      );
  }
}
