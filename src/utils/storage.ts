import type { SurveyResponse } from '../types'

export async function saveResponse(response: SurveyResponse): Promise<void> {
  const res = await fetch('/api/responses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(response),
  })
  if (!res.ok) throw new Error('Failed to save response')
}

export async function getResponses(): Promise<SurveyResponse[]> {
  const res = await fetch('/api/responses')
  if (!res.ok) throw new Error('Failed to fetch responses')
  return res.json() as Promise<SurveyResponse[]>
}

export async function clearResponses(): Promise<void> {
  const res = await fetch('/api/responses', { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to clear responses')
}
