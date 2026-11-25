// Synthesizes phone sounds (ringtone, pick-up click, end-call chime) using the Web Audio API
// No external mp3 assets needed - works 100% reliably in any environment!

class SoundEffectsService {
  private audioCtx: AudioContext | null = null;
  private ringOsc1: OscillatorNode | null = null;
  private ringOsc2: OscillatorNode | null = null;
  private ringGain: GainNode | null = null;
  private isRinging: boolean = false;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // DTMF keypad beep for realistic dialing
  playKeypadTone(digit: string) {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    // Standard DTMF frequency pairs
    const dtmfFreqs: Record<string, [number, number]> = {
      '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
      '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
      '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
      '*': [941, 1209], '0': [941, 1336], '#': [941, 1477],
      '+': [941, 1336]
    };

    const freqs = dtmfFreqs[digit] || [800, 1200];
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.frequency.setValueAtTime(freqs[0], ctx.currentTime);
    osc2.frequency.setValueAtTime(freqs[1], ctx.currentTime);

    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.12);
  }

  // Realistic US Phone Ringback Tone: 440Hz + 480Hz pulses (2s on, 4s off)
  startRinging() {
    if (this.isRinging) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    this.isRinging = true;

    const playRingCycle = () => {
      if (!this.isRinging) return;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(440, ctx.currentTime);
      osc2.frequency.setValueAtTime(480, ctx.currentTime);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.08, ctx.currentTime + 1.8);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.0);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 2.0);
      osc2.stop(ctx.currentTime + 2.0);

      // Repeat every 4.5 seconds if still ringing
      setTimeout(() => {
        if (this.isRinging) {
          playRingCycle();
        }
      }, 4500);
    };

    playRingCycle();
  }

  stopRinging() {
    this.isRinging = false;
  }

  // Call Connected Beep: pleasant upward chime
  playConnectChime() {
    this.stopRinging();
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);

      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.09, ctx.currentTime + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + i * 0.08);
      osc.stop(ctx.currentTime + i * 0.08 + 0.25);
    });
  }

  // Call End Chime: soft downward tone
  playEndCallChime() {
    this.stopRinging();
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const notes = [659.25, 523.25, 392.0]; // E5, C5, G4
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);

      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.07, ctx.currentTime + i * 0.1 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + i * 0.1);
      osc.stop(ctx.currentTime + i * 0.1 + 0.3);
    });
  }

  // Booking / Action Success Fanfare: uplifting chime
  playSuccessSound() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const notes = [587.33, 739.99, 880.0, 1174.66]; // D5, F#5, A5, D6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.07);

      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.07);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + i * 0.07 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.07 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + i * 0.07);
      osc.stop(ctx.currentTime + i * 0.07 + 0.35);
    });
  }
}

export const sounds = new SoundEffectsService();

