import { describe, expect, it } from 'vitest'
import { buildCsv, csvCell } from './export'
import type { SurveyDetail } from './types'

describe('CSV export', () => {
  it('escapes quotes and line breaks and neutralizes spreadsheet formulas', () => {
    expect(csvCell('one "two"\nthree')).toBe('"one ""two""\nthree"')
    expect(csvCell('=HYPERLINK("bad")')).toBe('"\'=HYPERLINK(""bad"")"')
  })
  it('includes metadata and one row per submission', () => {
    const survey = {
      id: 'survey-id', title: 'Concept check', description: 'Today', status: 'closed',
      created_at: '', updated_at: '', public_slug: null,
      questions: [{
        id: 'question-id', survey_id: 'survey-id', question_text: 'True?', question_type: 'true_false', position: 1,
        choices: [{ id: 'choice-id', question_id: 'question-id', choice_text: 'True', position: 1 }],
      }],
    } satisfies SurveyDetail
    const csv = buildCsv(survey, [{
      id: 'response-id', survey_id: 'survey-id', submitted_at: '2026-11-05T12:00:00Z',
      answers: [{ question_id: 'question-id', choice_id: 'choice-id' }],
    }])
    expect(csv).toContain('"survey_title","Concept check"')
    expect(csv).toContain('"response-id","2026-11-05T12:00:00Z","True"')
  })
})
