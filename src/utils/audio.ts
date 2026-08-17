export type SuccessSoundType = 'chime' | 'turnstile' | 'marimba' | 'scifi' | 'pos';
export type FailSoundType = 'buzz' | 'siren' | 'thud' | 'drop' | 'click';

export interface SoundPresetOption<T extends string> {
  id: T;
  name: string;
  description: string;
  tag: string;
}

export const SUCCESS_SOUND_OPTIONS: SoundPresetOption<SuccessSoundType>[] = [
  { id: 'chime', name: 'Crisp Dual Chime', description: 'Harmonious rising tone (D5 to A5)', tag: 'Default' },
  { id: 'turnstile', name: 'Turnstile Ding', description: 'High-pitched subway gate ping (C6 to G6)', tag: 'Rapid' },
  { id: 'marimba', name: 'Marimba Arpeggio', description: 'Warm 3-step ascending chime (C5-E5-G5)', tag: 'Gentle' },
  { id: 'scifi', name: 'Futuristic Glow', description: 'Modern sleek holographic sweep', tag: 'Modern' },
  { id: 'pos', name: 'Classic POS Beep', description: 'Punchy 1kHz confirmation tone', tag: 'Standard' },
];

export const FAIL_SOUND_OPTIONS: SoundPresetOption<FailSoundType>[] = [
  { id: 'buzz', name: 'Double Low Buzz', description: 'Dual descending warning buzzer', tag: 'Default' },
  { id: 'siren', name: 'Security Siren', description: 'Sharp alternating high-low alert', tag: 'High Alert' },
  { id: 'drop', name: 'Synth Downward Sweep', description: 'Noticeable pitch drop warning', tag: 'Expressive' },
  { id: 'thud', name: 'Muffled Low Thud', description: 'Low frequency non-intrusive bump', tag: 'Subtle' },
  { id: 'click', name: 'Discrete Tick', description: 'Minimalist quiet reject click', tag: 'Quiet' },
];

/**
 * Audio feedback utility using Web Audio API
 */
class SoundEffects {
  private ctx: AudioContext | null = null;
  private volume: number = 0.8; // 0.0 to 1.0

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  getVolume(): number {
    return this.volume;
  }

  playSuccess(style: SuccessSoundType = 'chime', customVolume?: number) {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const vol = typeof customVolume === 'number' ? Math.max(0, Math.min(1, customVolume)) : this.volume;
      if (vol <= 0.001) return;

      const now = this.ctx.currentTime;

      if (style === 'turnstile') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1046.50, now); // C6
        osc.frequency.exponentialRampToValueAtTime(1567.98, now + 0.08); // G6
        gain.gain.setValueAtTime(0.25 * vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (style === 'marimba') {
        // 3 notes arpeggio: C5 (523), E5 (659), G5 (784)
        [523.25, 659.25, 783.99].forEach((freq, i) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + i * 0.06);
          gain.gain.setValueAtTime(0.2 * vol, now + i * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.15);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + i * 0.06);
          osc.stop(now + i * 0.06 + 0.15);
        });
      } else if (style === 'scifi') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(1760, now + 0.15);
        gain.gain.setValueAtTime(0.2 * vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.28);
      } else if (style === 'pos') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1000, now);
        gain.gain.setValueAtTime(0.12 * vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
      } else {
        // Default 'chime'
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880.00, now + 0.12); // A5
        gain.gain.setValueAtTime(0.2 * vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch {
      // Audio playback might be restricted if no user interaction yet
    }
  }

  playWarning(style: FailSoundType = 'buzz', customVolume?: number) {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const vol = typeof customVolume === 'number' ? Math.max(0, Math.min(1, customVolume)) : this.volume;
      if (vol <= 0.001) return;

      const now = this.ctx.currentTime;

      if (style === 'siren') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.setValueAtTime(400, now + 0.08);
        osc.frequency.setValueAtTime(600, now + 0.16);
        osc.frequency.setValueAtTime(350, now + 0.24);
        gain.gain.setValueAtTime(0.15 * vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (style === 'drop') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.25);
        gain.gain.setValueAtTime(0.18 * vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.28);
      } else if (style === 'thud') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
        gain.gain.setValueAtTime(0.3 * vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (style === 'click') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(250, now);
        gain.gain.setValueAtTime(0.15 * vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
      } else {
        // Default 'buzz'
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(330, now + 0.1);
        gain.gain.setValueAtTime(0.22 * vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      }
    } catch {
      // Ignore
    }
  }

  playNotificationPing(customVolume?: number) {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const vol = typeof customVolume === 'number' ? Math.max(0, Math.min(1, customVolume)) : this.volume;
      if (vol <= 0.001) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, this.ctx.currentTime); // B5
      osc.frequency.exponentialRampToValueAtTime(1318.51, this.ctx.currentTime + 0.08); // E6

      gain.gain.setValueAtTime(0.15 * vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.28);
    } catch {
      // Ignore
    }
  }
}

export const soundFx = new SoundEffects();

/**
 * Format number into Nigerian Naira currency
 */
export function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('NGN', '₦');
}

/**
 * Download arbitrary data as CSV
 */
export function downloadCSV(filename: string, rows: Record<string, unknown>[]) {
  if (!rows || !rows.length) return;
  const separator = ',';
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    '\n' +
    rows
      .map(row => {
        return keys
          .map(k => {
            const rawVal = row[k] === null || row[k] === undefined ? '' : row[k];
            let cellStr: string = typeof rawVal === 'object' ? JSON.stringify(rawVal) : String(rawVal);
            cellStr = cellStr.replace(/"/g, '""');
            if (cellStr.search(/("|,|\n)/g) >= 0) {
              cellStr = `"${cellStr}"`;
            }
            return cellStr;
          })
          .join(separator);
      })
      .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
