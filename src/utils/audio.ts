// 다른 오디오를 전부 멈추되, 현재 ref가 있으면 그건 제외
export function stopAllAudios(except?: HTMLAudioElement | null) {
  const nodes = document.querySelectorAll<HTMLAudioElement>('audio')
  nodes.forEach(a => {
    if (except && a === except) return
    try { a.pause() } catch {}
  })
}
