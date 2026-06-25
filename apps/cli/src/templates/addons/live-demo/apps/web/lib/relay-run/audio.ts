const MUTE_KEY = 'relay-run-muted'

export type GameSound = 'start' | 'flap' | 'score' | 'hit' | 'milestone'

function readMuted(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

function writeMuted(muted: boolean): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(MUTE_KEY, muted ? '1' : '0')
  } catch {
    // ignore
  }
}

function getAudioContextClass(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null
  return (
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ??
    null
  )
}

export type RelayRunAudio = {
  play: (sound: GameSound) => void
  prime: () => void
  isMuted: () => boolean
  setMuted: (muted: boolean) => void
  toggleMuted: () => boolean
  startMusic: () => void
  stopMusic: () => void
}

export function createRelayRunAudio(): RelayRunAudio {
  let ctx: AudioContext | null = null
  let muted = readMuted()
  let musicTimer: number | null = null
  let step = 0
  const tempo = 160 // Original relay-run loop (C-major pentatonic)

  const melodyNotes = [
    523.25, 659.25, 783.99, 659.25, 523.25, 659.25, 783.99, 880.0, 783.99, 659.25, 523.25, 587.33,
    659.25, 523.25, 587.33, 659.25, 698.46, 783.99, 880.0, 783.99, 698.46, 659.25, 587.33, 523.25,
    587.33, 659.25, 783.99, 659.25, 523.25, 0, 523.25, 659.25,
  ]

  const bassNotes = [
    130.81, 130.81, 196.0, 196.0, 130.81, 130.81, 196.0, 196.0, 146.83, 146.83, 220.0, 220.0,
    130.81, 130.81, 196.0, 196.0, 164.81, 164.81, 246.94, 246.94, 130.81, 130.81, 196.0, 196.0,
    146.83, 146.83, 220.0, 220.0, 130.81, 130.81, 196.0, 196.0,
  ]

  function getContext(): AudioContext | null {
    const AudioCtx = getAudioContextClass()
    if (!AudioCtx) return null
    if (!ctx) ctx = new AudioCtx()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  }

  function tone(
    freq: number,
    duration: number,
    type: OscillatorType,
    gainPeak = 0.08,
    when = 0,
  ): void {
    const audioCtx = getContext()
    if (!audioCtx || muted) return

    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    const start = audioCtx.currentTime + when
    const end = start + duration

    osc.type = type
    osc.frequency.setValueAtTime(freq, start)
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(gainPeak, start + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, end)
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.start(start)
    osc.stop(end + 0.02)
  }

  function playMusicStep() {
    const audioCtx = getContext()
    if (!audioCtx || muted || audioCtx.state === 'suspended') return

    // Melody step trigger
    const melFreq = melodyNotes[step]!
    if (melFreq > 0) {
      tone(melFreq, 0.12, 'square', 0.006) // soft square lead note
    }

    // Bassline step trigger (every alternate beat)
    if (step % 2 === 0) {
      const bassFreq = bassNotes[step]!
      tone(bassFreq, 0.24, 'triangle', 0.012) // warm triangle bass note
    }

    step = (step + 1) % 32
  }

  function play(sound: GameSound): void {
    if (muted) return
    switch (sound) {
      case 'flap':
        tone(520, 0.08, 'square', 0.045)
        tone(760, 0.06, 'square', 0.028, 0.02)
        break
      case 'score':
        tone(880, 0.07, 'sine', 0.055)
        tone(1175, 0.1, 'sine', 0.045, 0.065)
        break
      case 'hit':
        tone(185, 0.18, 'sawtooth', 0.065)
        tone(95, 0.22, 'square', 0.038, 0.03)
        break
      case 'start':
        tone(440, 0.1, 'triangle', 0.045)
        tone(660, 0.12, 'triangle', 0.035, 0.085)
        break
      case 'milestone':
        tone(523.25, 0.1, 'sine', 0.05)
        tone(659.25, 0.1, 'sine', 0.05, 0.08)
        tone(783.99, 0.12, 'sine', 0.05, 0.16)
        tone(1046.5, 0.25, 'sine', 0.06, 0.24)
        break
    }
  }

  return {
    play,
    prime: () => {
      getContext()
    },
    isMuted: () => muted,
    setMuted: (next: boolean) => {
      muted = next
      writeMuted(next)
    },
    toggleMuted: () => {
      muted = !muted
      writeMuted(muted)
      return muted
    },
    startMusic: () => {
      if (musicTimer !== null) return
      step = 0
      musicTimer = window.setInterval(playMusicStep, tempo)
    },
    stopMusic: () => {
      if (musicTimer !== null) {
        window.clearInterval(musicTimer)
        musicTimer = null
      }
    },
  }
}

export function readAudioMuted(): boolean {
  return readMuted()
}
