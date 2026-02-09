// F16: Detective character definitions
// Purely cosmetic choice — same abilities, same clues, same access.

export type DetectiveId = 'kit' | 'noor'

export interface Detective {
  id: DetectiveId
  name: string
  tagline: string
  style: string
  description: string
  /** Primary color (hex) for minimap marker and UI accents */
  color: string
  /** Emoji used as SVG placeholder until art assets are added */
  emoji: string
}

export const DETECTIVES: Record<DetectiveId, Detective> = {
  kit: {
    id: 'kit',
    name: 'Kit Solano',
    tagline: "The truth doesn't hide. People do.",
    style: 'Laid-back, streetwise, instinctive',
    description: 'The detective who solves cases by talking to people and reading body language.',
    color: '#d4a843',
    emoji: '\u2615',    // coffee cup
  },
  noor: {
    id: 'noor',
    name: 'Noor Vasari',
    tagline: 'Every lie leaves a fingerprint.',
    style: 'Precise, methodical, analytical',
    description: 'The detective who solves cases by examining evidence and finding contradictions.',
    color: '#2a9d8f',
    emoji: '\uD83D\uDD0D',   // magnifying glass (left-tilted)
  },
}

export const DETECTIVE_LIST: Detective[] = [DETECTIVES.kit, DETECTIVES.noor]
