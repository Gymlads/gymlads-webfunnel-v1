// In welke browser zit de bezoeker? De in-app browsers van Instagram en
// Facebook herken je aan "Instagram", "FBAN" of "FBAV" in de user-agent.
// Zo zien we in de meting of de afhakers vooral daar zitten.

export type BrowserSoort = 'instagram' | 'facebook' | 'overig'

export function browserSoort(): BrowserSoort {
  try {
    const ua = navigator.userAgent || ''
    if (/Instagram/i.test(ua)) return 'instagram'
    if (/FBAN|FBAV|FB_IAB|FBIOS/i.test(ua)) return 'facebook'
  } catch {
    // geen navigator: gewoon 'overig'
  }
  return 'overig'
}
