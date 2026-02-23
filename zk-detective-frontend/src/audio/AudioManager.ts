// Audio Manager — Howler.js singleton for music crossfade and SFX playback.
// Handles browser autoplay restrictions via unlock-on-interaction pattern.

import { Howl, Howler } from 'howler'
import { MUSIC_TRACKS, SFX } from './audio-manifest'
import type { MusicTrack, SfxName } from './audio-manifest'

class AudioManagerImpl {
  private musicHowls: Partial<Record<MusicTrack, Howl>> = {}
  private sfxHowls: Partial<Record<SfxName, Howl>> = {}
  private currentMusic: MusicTrack | null = null
  private _muted = false
  private _unlocked = false
  private _volume = 0.6

  get muted() { return this._muted }
  get unlocked() { return this._unlocked }

  // Call on first user interaction to unlock AudioContext
  unlock() {
    if (this._unlocked) return
    this._unlocked = true
    // Create and resume AudioContext if suspended
    Howler.autoUnlock = true
    // Preload commonly used SFX
    this.preloadSfx('uiClick')
    this.preloadSfx('dialogueBlip')
  }

  private getMusic(track: MusicTrack): Howl {
    if (!this.musicHowls[track]) {
      this.musicHowls[track] = new Howl({
        src: [MUSIC_TRACKS[track]],
        loop: true,
        volume: 0,
        html5: true, // streaming for music tracks
        preload: false,
      })
    }
    return this.musicHowls[track]!
  }

  private preloadSfx(name: SfxName): void {
    if (!this.sfxHowls[name]) {
      this.sfxHowls[name] = new Howl({
        src: [SFX[name]],
        volume: this._volume,
        preload: true,
      })
    }
  }

  private getSfx(name: SfxName): Howl {
    if (!this.sfxHowls[name]) {
      this.sfxHowls[name] = new Howl({
        src: [SFX[name]],
        volume: this._volume,
        preload: true,
      })
    }
    return this.sfxHowls[name]!
  }

  // Play music with crossfade from current track
  playMusic(track: MusicTrack) {
    if (!this._unlocked || this._muted) return
    if (this.currentMusic === track) return

    // Fade out current
    if (this.currentMusic) {
      const current = this.musicHowls[this.currentMusic]
      if (current && current.playing()) {
        current.fade(current.volume(), 0, 800)
        setTimeout(() => current.stop(), 850)
      }
    }

    // Fade in new
    const howl = this.getMusic(track)
    howl.load()
    howl.volume(0)
    howl.play()
    howl.fade(0, this._volume * 0.4, 1000)
    this.currentMusic = track
  }

  stopMusic() {
    if (this.currentMusic) {
      const current = this.musicHowls[this.currentMusic]
      if (current) {
        current.fade(current.volume(), 0, 500)
        setTimeout(() => current.stop(), 550)
      }
      this.currentMusic = null
    }
  }

  playSfx(name: SfxName) {
    if (!this._unlocked || this._muted) return
    try {
      this.getSfx(name).play()
    } catch {
      // Audio file may not exist yet — silently ignore
    }
  }

  toggleMute(): boolean {
    this._muted = !this._muted
    Howler.mute(this._muted)

    // Persist preference
    try {
      localStorage.setItem('zk-detective-muted', String(this._muted))
    } catch { /* noop */ }

    return this._muted
  }

  // Load saved mute preference
  loadPreference() {
    try {
      const saved = localStorage.getItem('zk-detective-muted')
      if (saved === 'true') {
        this._muted = true
        Howler.mute(true)
      }
    } catch { /* noop */ }
  }
}

export const audioManager = new AudioManagerImpl()

// Load saved preference on module init
audioManager.loadPreference()
