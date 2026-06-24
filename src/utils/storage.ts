import type { SurveyResponse } from '../types'

const KEY = 'zhana_survey_v1'

export function saveResponse(response: SurveyResponse): void {
  const all = getResponses()
  all.push(response)
  try {
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    // Storage quota exceeded — silently ignore
  }
}

export function getResponses(): SurveyResponse[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as SurveyResponse[]) : []
  } catch {
    return []
  }
}

export function clearResponses(): void {
  localStorage.removeItem(KEY)
}
