/**
 * Suoni del gioco generati con WebAudio: niente file da scaricare.
 * Su iPad l'AudioContext parte solo dopo un tocco: chiamare unlock() da un gesto.
 */

type Wave = OscillatorType;

export class ParkAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private timer: number | null = null;
  private step = 0;
  private nextNoteTime = 0;
  private tempo = 132;
  muted = false;
  musicOn = true;

  /** Da chiamare dentro un evento di tocco/click. */
  unlock(): void {
    if (!this.ctx) {
      const win = window as typeof window & { webkitAudioContext?: typeof AudioContext };
      const Ctor = win.AudioContext || win.webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.5;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.16;
      this.musicGain.connect(this.master);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  setMuted(m: boolean): void {
    this.muted = m;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(m ? 0 : 0.5, this.ctx.currentTime, 0.02);
    }
  }

  private beep(
    freq: number, dur: number, type: Wave = 'square', vol = 0.25,
    slideTo?: number, delay = 0, dest?: AudioNode,
  ): void {
    if (!this.ctx || !this.master) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(dest ?? this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  private noise(dur: number, vol = 0.2, delay = 0): void {
    if (!this.ctx || !this.master) return;
    const t0 = this.ctx.currentTime + delay;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const g = this.ctx.createGain();
    g.gain.value = vol;
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 1600;
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(t0);
  }

  jump(double = false): void {
    this.beep(double ? 520 : 380, 0.2, 'triangle', 0.3, double ? 1100 : 820);
    if (double) this.beep(880, 0.16, 'square', 0.14, 1400, 0.05);
  }
  land(): void { this.noise(0.1, 0.1); }
  duck(): void { this.beep(300, 0.12, 'sine', 0.18, 170); }
  coin(combo = 1): void {
    const base = 880 * Math.pow(1.0595, Math.min(combo - 1, 10) * 2);
    this.beep(base, 0.09, 'square', 0.2);
    this.beep(base * 1.5, 0.12, 'square', 0.16, undefined, 0.05);
  }
  smash(): void { this.beep(200, 0.14, 'sawtooth', 0.22, 900); this.noise(0.12, 0.14); }
  star(): void {
    [523, 659, 784, 1046, 1318].forEach((f, i) => this.beep(f, 0.16, 'square', 0.2, undefined, i * 0.06));
  }
  heart(): void {
    [659, 880, 1174].forEach((f, i) => this.beep(f, 0.2, 'triangle', 0.24, undefined, i * 0.08));
  }
  hit(): void {
    this.beep(260, 0.32, 'sawtooth', 0.3, 70);
    this.noise(0.24, 0.24);
  }
  levelup(): void {
    [523, 587, 659, 784, 1046].forEach((f, i) => this.beep(f, 0.2, 'triangle', 0.26, undefined, i * 0.08));
  }
  gameover(): void {
    [523, 466, 392, 294].forEach((f, i) => this.beep(f, 0.34, 'triangle', 0.28, undefined, i * 0.16));
  }
  fanfare(): void {
    [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) =>
      this.beep(f, 0.24, 'square', 0.24, undefined, i * 0.11));
  }
  countdown(n: number): void { this.beep(n === 0 ? 880 : 520, n === 0 ? 0.3 : 0.14, 'square', 0.26); }

  /* ---------------- musichetta ---------------- */

  private static MELODY = [
    72, 76, 79, 76, 74, 77, 81, 77,
    72, 76, 79, 84, 81, 79, 76, 74,
  ];
  private static BASS = [48, 48, 55, 55, 53, 53, 50, 50];

  setTempo(level: number): void { this.tempo = 126 + level * 5; }

  startMusic(): void {
    if (!this.ctx || !this.musicGain || this.timer !== null || !this.musicOn) return;
    this.step = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.08;
    this.timer = window.setInterval(() => this.schedule(), 40);
  }

  stopMusic(): void {
    if (this.timer !== null) { clearInterval(this.timer); this.timer = null; }
  }

  toggleMusic(on: boolean): void {
    this.musicOn = on;
    if (on) this.startMusic(); else this.stopMusic();
  }

  private schedule(): void {
    if (!this.ctx || !this.musicGain) return;
    const spb = 60 / this.tempo / 2; // ottavi
    while (this.nextNoteTime < this.ctx.currentTime + 0.12) {
      const s = this.step % 16;
      const midi = ParkAudio.MELODY[s];
      const delay = this.nextNoteTime - this.ctx.currentTime;
      if (delay >= 0) {
        this.beep(440 * Math.pow(2, (midi - 69) / 12), spb * 0.85, 'square', 0.16, undefined, delay, this.musicGain);
        if (s % 2 === 0) {
          const b = ParkAudio.BASS[(this.step >> 1) % 8];
          this.beep(440 * Math.pow(2, (b - 69) / 12), spb * 1.6, 'triangle', 0.3, undefined, delay, this.musicGain);
        }
      }
      this.nextNoteTime += spb;
      this.step++;
    }
  }

  dispose(): void {
    this.stopMusic();
    if (this.ctx) void this.ctx.close();
    this.ctx = null;
  }
}
