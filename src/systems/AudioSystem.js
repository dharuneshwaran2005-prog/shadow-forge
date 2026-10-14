import { AUDIO_ENABLED } from '../utils/Constants.js';
import { SaveSystem } from './SaveSystem.js';

// Placeholder synth recipes: [startFreq, duration(s), wave, endFreq, volume]
const SYNTH = {
  jump: [420, 0.12, 'square', 760, 0.12], attack: [220, 0.1, 'sawtooth', 90, 0.12], heavy: [140, 0.28, 'sawtooth', 50, 0.2],
  dash: [300, 0.16, 'triangle', 900, 0.14], hit: [180, 0.09, 'square', 60, 0.16], enemyDeath: [320, 0.32, 'sawtooth', 40, 0.18],
  boss: [80, 0.7, 'sawtooth', 35, 0.3], hurt: [260, 0.2, 'sawtooth', 70, 0.2], pickup: [800, 0.1, 'sine', 1300, 0.12],
  ui: [600, 0.05, 'square', 600, 0.08], checkpoint: [500, 0.4, 'sine', 1000, 0.15],
};

/** Plays real audio files when available, otherwise a synthesised placeholder. */
export class AudioSystem {
  constructor(game) {
    this.game = game;
    this.music = null;
    this.musicKey = null;
  }

  get settings() { return SaveSystem.loadSettings(); }
  hasFile(key) { return AUDIO_ENABLED && this.game.cache.audio.exists(key); }

  play(key) {
    try {
      const vol = this.settings.sfx;
      if (vol <= 0) return;
      if (this.hasFile(key)) { this.game.sound.play(key, { volume: vol }); return; }
      this.synth(key, vol);
    } catch (e) { /* audio must never break gameplay */ }
  }

  synth(key, vol) {
    const ctx = this.game.sound.context;
    const r = SYNTH[key];
    if (!ctx || !r || ctx.state !== 'running') return;
    const [f0, dur, type, f1, v] = r;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t = ctx.currentTime;
    osc.type = type;
    osc.frequency.setValueAtTime(f0, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    gain.gain.setValueAtTime(v * vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur);
  }

  /** Music placeholder: plays assets/audio/<key>.ogg when enabled, otherwise silent. */
  playMusic(key) {
    try {
      if (this.musicKey === key) return;
      this.stopMusic();
      this.musicKey = key;
      if (!this.hasFile(key)) return;
      this.music = this.game.sound.add(key, { loop: true, volume: this.settings.music });
      this.music.play();
    } catch (e) { /* ignore */ }
  }
  stopMusic() { if (this.music) { this.music.stop(); this.music.destroy(); this.music = null; } this.musicKey = null; }
}
