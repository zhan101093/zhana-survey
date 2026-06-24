export type QuestionType = 'radio' | 'text';

export interface Option {
  id: string;
  label: string;
}

export interface Question {
  id: number;
  text: string;
  type: QuestionType;
  options?: Option[];
}

export interface Answer {
  questionId: number;
  value: string;
}

export interface SurveyResponse {
  id: string;
  timestamp: number;
  answers: Answer[];
}
