#!/usr/bin/env bun
// Generate placeholder audio files for ZK Detective.
// Creates tiny valid WAV files with synthesized tones.
// Run: bun run scripts/generate-audio-placeholders.ts

import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const AUDIO_DIR = join(import.meta.dir, '../public/assets/audio')
mkdirSync(AUDIO_DIR, { recursive: true })

function generateWav(
  durationSec: number,
  frequency: number,
  sampleRate = 22050,
  volume = 0.3,
  fadeOut = true,
): Buffer {
  const numSamples = Math.floor(sampleRate * durationSec)
  const dataSize = numSamples * 2 // 16-bit mono
  const headerSize = 44
  const buf = Buffer.alloc(headerSize + dataSize)

  // WAV header
  buf.write('RIFF', 0)
  buf.writeUInt32LE(36 + dataSize, 4)
  buf.write('WAVE', 8)
  buf.write('fmt ', 12)
  buf.writeUInt32LE(16, 16) // chunk size
  buf.writeUInt16LE(1, 20)  // PCM
  buf.writeUInt16LE(1, 22)  // mono
  buf.writeUInt32LE(sampleRate, 24)
  buf.writeUInt32LE(sampleRate * 2, 28) // byte rate
  buf.writeUInt16LE(2, 32)  // block align
  buf.writeUInt16LE(16, 34) // bits per sample
  buf.write('data', 36)
  buf.writeUInt32LE(dataSize, 40)

  // Generate samples
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate
    const envelope = fadeOut ? Math.max(0, 1 - t / durationSec) : 1
    const sample = Math.sin(2 * Math.PI * frequency * t) * volume * envelope
    const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)))
    buf.writeInt16LE(intSample, headerSize + i * 2)
  }

  return buf
}

function generateNoise(durationSec: number, sampleRate = 22050, volume = 0.15): Buffer {
  const numSamples = Math.floor(sampleRate * durationSec)
  const dataSize = numSamples * 2
  const headerSize = 44
  const buf = Buffer.alloc(headerSize + dataSize)

  buf.write('RIFF', 0)
  buf.writeUInt32LE(36 + dataSize, 4)
  buf.write('WAVE', 8)
  buf.write('fmt ', 12)
  buf.writeUInt32LE(16, 16)
  buf.writeUInt16LE(1, 20)
  buf.writeUInt16LE(1, 22)
  buf.writeUInt32LE(sampleRate, 24)
  buf.writeUInt32LE(sampleRate * 2, 28)
  buf.writeUInt16LE(2, 32)
  buf.writeUInt16LE(16, 34)
  buf.write('data', 36)
  buf.writeUInt32LE(dataSize, 40)

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate
    const envelope = Math.max(0, 1 - t / durationSec)
    const sample = (Math.random() * 2 - 1) * volume * envelope
    const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)))
    buf.writeInt16LE(intSample, headerSize + i * 2)
  }

  return buf
}

function generateChord(
  durationSec: number,
  frequencies: number[],
  sampleRate = 22050,
  volume = 0.2,
): Buffer {
  const numSamples = Math.floor(sampleRate * durationSec)
  const dataSize = numSamples * 2
  const headerSize = 44
  const buf = Buffer.alloc(headerSize + dataSize)

  buf.write('RIFF', 0)
  buf.writeUInt32LE(36 + dataSize, 4)
  buf.write('WAVE', 8)
  buf.write('fmt ', 12)
  buf.writeUInt32LE(16, 16)
  buf.writeUInt16LE(1, 20)
  buf.writeUInt16LE(1, 22)
  buf.writeUInt32LE(sampleRate, 24)
  buf.writeUInt32LE(sampleRate * 2, 28)
  buf.writeUInt16LE(2, 32)
  buf.writeUInt16LE(16, 34)
  buf.write('data', 36)
  buf.writeUInt32LE(dataSize, 40)

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate
    const envelope = Math.max(0, 1 - t / durationSec)
    let sample = 0
    for (const freq of frequencies) {
      sample += Math.sin(2 * Math.PI * freq * t) / frequencies.length
    }
    sample *= volume * envelope
    const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)))
    buf.writeInt16LE(intSample, headerSize + i * 2)
  }

  return buf
}

// SFX — short, distinctive sounds
const sfx: Record<string, Buffer> = {
  'sfx-footstep': generateNoise(0.15, 22050, 0.2),
  'sfx-door': generateWav(0.4, 120, 22050, 0.3),
  'sfx-clue-pickup': generateChord(0.5, [523, 659, 784], 22050, 0.25),  // C major arpeggio-ish
  'sfx-dialogue-blip': generateWav(0.05, 800, 22050, 0.15),  // very short blip
  'sfx-accusation-slam': generateNoise(0.6, 22050, 0.4),
  'sfx-wrong-buzz': generateWav(0.8, 150, 22050, 0.3),  // low buzzer
  'sfx-correct-sting': generateChord(1.0, [523, 659, 784, 1047], 22050, 0.3),  // victory chord
  'sfx-ui-click': generateWav(0.08, 1200, 22050, 0.12),  // short click
}

// Music — longer ambient loops (kept short for placeholders, 3 seconds each)
const music: Record<string, Buffer> = {
  'music-title': generateChord(3, [220, 277, 330], 22050, 0.15),     // Am chord
  'music-investigation': generateChord(3, [196, 247, 294], 22050, 0.12),  // G minor
  'music-tension': generateChord(3, [165, 196, 247], 22050, 0.10),   // E minor low
  'music-victory': generateChord(3, [262, 330, 392, 524], 22050, 0.2),  // C major bright
  'music-defeat': generateChord(3, [147, 175, 220], 22050, 0.12),    // D minor low
}

// Write all files as .mp3 extension (Howler handles WAV data with .mp3 extension fine,
// but we'll use .wav internally and update the manifest to use .wav)
// Actually, let's just write .wav and update the manifest.
for (const [name, data] of Object.entries(sfx)) {
  const path = join(AUDIO_DIR, `${name}.wav`)
  writeFileSync(path, data)
  console.log(`  Created ${name}.wav (${data.length} bytes)`)
}

for (const [name, data] of Object.entries(music)) {
  const path = join(AUDIO_DIR, `${name}.wav`)
  writeFileSync(path, data)
  console.log(`  Created ${name}.wav (${data.length} bytes)`)
}

console.log(`\nGenerated ${Object.keys(sfx).length} SFX + ${Object.keys(music).length} music tracks`)
console.log(`Location: ${AUDIO_DIR}`)
