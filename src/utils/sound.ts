// src/utils/sound.ts
export type SoundKey = 'chime' | 'rain' | 'piano' | 'drum'

export const SOUND_MAP: Record<SoundKey, string> = {
  chime: '/sounds/chime.mp3',
  rain:  '/sounds/rain.mp3',
  piano: '/sounds/piano.mp3',
  drum:  '/sounds/drum.mp3',
}

export function getSoundUrl(key?: string | null): string | null {
  if (!key) return null
  const k = key.toLowerCase().trim() as SoundKey
  return (SOUND_MAP as any)[k] ?? null
}
