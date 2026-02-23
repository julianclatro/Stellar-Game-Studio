#!/usr/bin/env bun
// Generates placeholder SVG files for all 31 game assets.
// Run: bun scripts/generate-placeholders.ts
// These placeholders let the frontend work before real PNGs are generated.

import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const ASSETS_DIR = join(import.meta.dir, '..', 'public', 'assets')

// Noir palette
const BG = '#0a0a0f'
const SURFACE = '#14141f'
const INK = '#e8e6e3'
const GOLD = '#d4a843'
const CRIMSON = '#c8463b'
const TEAL = '#2a9d8f'

interface AssetDef {
  path: string
  width: number
  height: number
  label: string
  sublabel?: string
  accent: string
  icon: string // Simple SVG icon shape
}

function svgPlaceholder(a: AssetDef): string {
  const cx = a.width / 2
  const cy = a.height / 2
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${a.width}" height="${a.height}" viewBox="0 0 ${a.width} ${a.height}">
  <rect width="100%" height="100%" fill="${BG}" rx="8"/>
  <rect x="4" y="4" width="${a.width - 8}" height="${a.height - 8}" fill="none" stroke="${SURFACE}" stroke-width="2" rx="6" stroke-dasharray="8 4"/>
  ${a.icon}
  <text x="${cx}" y="${cy + 40}" text-anchor="middle" fill="${a.accent}" font-family="Georgia, serif" font-size="16" font-weight="bold">${escapeXml(a.label)}</text>
  ${a.sublabel ? `<text x="${cx}" y="${cy + 60}" text-anchor="middle" fill="${INK}" font-family="Georgia, serif" font-size="11" opacity="0.5">${escapeXml(a.sublabel)}</text>` : ''}
</svg>`
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// Icon helpers — simple geometric shapes
function magnifyingGlass(cx: number, cy: number, accent: string): string {
  return `<circle cx="${cx - 5}" cy="${cy - 5}" r="20" fill="none" stroke="${accent}" stroke-width="3"/>
  <line x1="${cx + 9}" y1="${cy + 9}" x2="${cx + 25}" y2="${cy + 25}" stroke="${accent}" stroke-width="3" stroke-linecap="round"/>`
}

function house(cx: number, cy: number, accent: string): string {
  return `<path d="M${cx - 30} ${cy} L${cx} ${cy - 25} L${cx + 30} ${cy} L${cx + 25} ${cy + 20} L${cx - 25} ${cy + 20} Z" fill="none" stroke="${accent}" stroke-width="2.5"/>
  <rect x="${cx - 8}" y="${cy + 2}" width="16" height="18" fill="none" stroke="${accent}" stroke-width="2"/>`
}

function person(cx: number, cy: number, accent: string): string {
  return `<circle cx="${cx}" cy="${cy - 15}" r="14" fill="none" stroke="${accent}" stroke-width="2.5"/>
  <path d="M${cx - 20} ${cy + 25} Q${cx - 20} ${cy + 5} ${cx} ${cy + 5} Q${cx + 20} ${cy + 5} ${cx + 20} ${cy + 25}" fill="none" stroke="${accent}" stroke-width="2.5"/>`
}

function clueIcon(cx: number, cy: number, accent: string, key: boolean): string {
  const glow = key ? `<circle cx="${cx}" cy="${cy}" r="35" fill="${GOLD}" opacity="0.1"/>` : ''
  return `${glow}<circle cx="${cx}" cy="${cy}" r="25" fill="none" stroke="${accent}" stroke-width="2.5"/>
  <text x="${cx}" y="${cy + 5}" text-anchor="middle" fill="${accent}" font-family="Georgia, serif" font-size="22">?</text>`
}

function weapon(cx: number, cy: number): string {
  return `<line x1="${cx - 20}" y1="${cy + 20}" x2="${cx + 20}" y2="${cy - 20}" stroke="${CRIMSON}" stroke-width="3" stroke-linecap="round"/>
  <circle cx="${cx - 20}" cy="${cy + 20}" r="8" fill="none" stroke="${CRIMSON}" stroke-width="2"/>`
}

// ── Asset definitions ──

const assets: AssetDef[] = [
  // A. Title
  {
    path: 'title/manor-exterior.svg',
    width: 800, height: 500,
    label: 'Meridian Manor',
    sublabel: 'title/manor-exterior.png',
    accent: GOLD,
    icon: house(400, 210, GOLD),
  },
  // B. Rooms
  ...['Bedroom', 'Kitchen', 'Study', 'Lounge', 'Garden'].map((name) => ({
    path: `rooms/${name.toLowerCase()}.svg`,
    width: 800, height: 450,
    label: `The ${name}`,
    sublabel: `rooms/${name.toLowerCase()}.png`,
    accent: TEAL,
    icon: magnifyingGlass(400, 180, TEAL),
  })),
  // C. Suspects
  ...[
    ['victor', 'Victor Ashford'],
    ['elena', 'Elena Castillo'],
    ['marcus', 'Dr. Marcus Webb'],
    ['isabelle', 'Isabelle Fontaine'],
    ['thomas', 'Thomas Grey'],
    ['priya', 'Priya Sharma'],
    ['james', 'James Whitmore'],
    ['celeste', 'Celeste Duval'],
    ['ren', 'Ren Nakamura'],
  ].map(([id, name]) => ({
    path: `suspects/${id}.svg`,
    width: 400, height: 500,
    label: name,
    sublabel: `suspects/${id}.png`,
    accent: INK,
    icon: person(200, 210, INK),
  })),
  // D. Clues
  ...[
    ['perfume-bottle', 'Broken Perfume Bottle', true],
    ['fingerprints', 'Smudged Fingerprints', false],
    ['torn-letter', 'Torn Business Letter', false],
    ['wine-glass', 'Wine Glass', false],
    ['missing-knife', 'Missing Knife', false],
    ['insurance-docs', 'Insurance Documents', true],
    ['crumpled-note', 'Crumpled Note', true],
    ['phone-records', 'Phone Records', true],
    ['medicine-bottle', 'Medicine Bottle', false],
    ['muddy-footprints', 'Muddy Footprints', false],
    ['camera-photos', 'Camera Photos', true],
  ].map(([file, name, key]) => ({
    path: `clues/${file}.svg`,
    width: 200, height: 200,
    label: name as string,
    accent: key ? GOLD : INK,
    icon: clueIcon(100, 70, key ? GOLD : INK, key as boolean),
  })),
  // E. Weapons
  ...[
    ['poison-vial', 'Poison Vial'],
    ['kitchen-knife', 'Kitchen Knife'],
    ['candlestick', 'Candlestick'],
    ['letter-opener', 'Letter Opener'],
    ['garden-shears', 'Garden Shears'],
  ].map(([file, name]) => ({
    path: `weapons/${file}.svg`,
    width: 200, height: 200,
    label: name,
    accent: CRIMSON,
    icon: weapon(100, 70),
  })),
]

// ── Generate ──

let count = 0
for (const asset of assets) {
  const fullPath = join(ASSETS_DIR, asset.path)
  const dir = fullPath.substring(0, fullPath.lastIndexOf('/'))
  mkdirSync(dir, { recursive: true })
  writeFileSync(fullPath, svgPlaceholder(asset))
  count++
}

console.log(`Generated ${count} placeholder SVGs in public/assets/`)
