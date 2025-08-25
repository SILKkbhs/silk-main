export type PredictInput = { color: string; shape?: string; sound?: string }
export type PredictResult = { label: string; score: number; tips?: string[] }

const BASE = (import.meta.env.VITE_AI_BASE || import.meta.env.NEXT_PUBLIC_AI_BASE) as string || ''

export async function predictEmotion(input: PredictInput): Promise<PredictResult> {
  if (!BASE) throw new Error('AI BASE URL is not set')
  const res = await fetch(`${BASE}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(`AI API error: ${res.status}`)
  return res.json()
}
