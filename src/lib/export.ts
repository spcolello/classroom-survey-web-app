import type { ResponseRow, SurveyDetail } from './types'

export function csvCell(value: string): string {
  const safe = /^[\s]*[=+\-@]/.test(value) ? `'${value}` : value
  return `"${safe.replaceAll('"', '""')}"`
}

export function buildCsv(survey: SurveyDetail, responses: ResponseRow[]): string {
  const header = ['response_id', 'submitted_at', ...survey.questions.map(q => q.question_text)]
  const lines = [
    ['survey_title', survey.title],
    ['survey_description', survey.description ?? ''],
    ['survey_id', survey.id],
    [],
    header,
    ...responses.map(response => {
      const byQuestion = new Map(response.answers.map(a => [a.question_id, a.choice_id]))
      return [response.id, response.submitted_at, ...survey.questions.map(q =>
        q.choices.find(c => c.id === byQuestion.get(q.id))?.choice_text ?? '')]
    }),
  ]
  return '\uFEFF' + lines.map(line => line.map(csvCell).join(',')).join('\r\n')
}

export function downloadCsv(survey: SurveyDetail, responses: ResponseRow[]): void {
  const blob = new Blob([buildCsv(survey, responses)], { type: 'text/csv;charset=utf-8' })
  const href = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = href
  anchor.download = `survey-${survey.id.slice(0, 8)}-results.csv`
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(href)
}
