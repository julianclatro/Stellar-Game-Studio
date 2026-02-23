// Typewriter hook — progressive text reveal with variable speed and per-character callback.
// Used by AdventureDialogueBox for classic adventure game text display.

import { useState, useEffect, useRef, useCallback } from 'react'

interface UseTypewriterOptions {
  text: string
  speed?: number        // base ms per character (default: 30)
  onChar?: () => void   // called per character (for SFX blip)
  onComplete?: () => void
}

interface UseTypewriterResult {
  displayText: string
  isTyping: boolean
  isComplete: boolean
  skip: () => void
}

// Characters that get variable delays
const PUNCTUATION = new Set(['.', '!', '?', ',', ';', ':', '-'])

function getCharDelay(char: string, baseSpeed: number): number {
  if (char === ' ') return Math.floor(baseSpeed * 0.3)     // spaces are fast
  if (PUNCTUATION.has(char)) return Math.floor(baseSpeed * 2.7) // punctuation pauses
  return baseSpeed
}

export function useTypewriter({
  text,
  speed = 30,
  onChar,
  onComplete,
}: UseTypewriterOptions): UseTypewriterResult {
  const [displayText, setDisplayText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const indexRef = useRef(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const onCharRef = useRef(onChar)
  const onCompleteRef = useRef(onComplete)

  // Keep callback refs fresh without triggering effect
  onCharRef.current = onChar
  onCompleteRef.current = onComplete

  // Reset when text changes
  useEffect(() => {
    indexRef.current = 0
    setDisplayText('')
    setIsTyping(true)
    setIsComplete(false)

    if (!text) {
      setIsTyping(false)
      setIsComplete(true)
      return
    }

    function typeNext() {
      indexRef.current++
      const current = text.slice(0, indexRef.current)
      setDisplayText(current)

      // Only fire blip for non-space characters
      const char = text[indexRef.current - 1]
      if (char !== ' ') {
        onCharRef.current?.()
      }

      if (indexRef.current >= text.length) {
        setIsTyping(false)
        setIsComplete(true)
        onCompleteRef.current?.()
        return
      }

      // Schedule next character with variable delay
      const nextChar = text[indexRef.current]
      const delay = getCharDelay(nextChar, speed)
      timeoutRef.current = setTimeout(typeNext, delay)
    }

    // Start the first character
    const firstDelay = getCharDelay(text[0], speed)
    timeoutRef.current = setTimeout(typeNext, firstDelay)

    return () => clearTimeout(timeoutRef.current)
  }, [text, speed])

  const skip = useCallback(() => {
    clearTimeout(timeoutRef.current)
    setDisplayText(text)
    setIsTyping(false)
    setIsComplete(true)
    onCompleteRef.current?.()
  }, [text])

  return { displayText, isTyping, isComplete, skip }
}
