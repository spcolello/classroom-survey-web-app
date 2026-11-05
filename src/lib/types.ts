export type Status = 'draft' | 'active' | 'closed' | 'archived'
export type QuestionType = 'multiple_choice' | 'true_false'

export interface Choice {
  id: string
  question_id: string
  choice_text: string
  position: number
}
export interface Question {
  id: string
  survey_id: string
  question_text: string
  question_type: QuestionType
  position: number
  choices: Choice[]
}
export interface Survey {
  id: string
  title: string
  description: string | null
  status: Status
  public_slug: string | null
  created_at: string
  updated_at: string
}
export interface SurveyDetail extends Survey {
  questions: Question[]
}
export interface DraftQuestion {
  localId: string
  question_text: string
  question_type: QuestionType
  choices: { localId: string; choice_text: string }[]
}
export interface ResponseRow {
  id: string
  survey_id: string
  submitted_at: string
  answers: { question_id: string; choice_id: string }[]
}
