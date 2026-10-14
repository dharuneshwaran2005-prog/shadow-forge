import Phaser from 'phaser';
import { GAME_W, GAME_H, THEMES, AUDIO_ENABLED, AUDIO_FILES } from '../utils/Constants.js';
import { AudioSystem } from '../systems/AudioSystem.js';

/**
 * Boot: loads optional audio, then procedurally generates every texture so the game
 * needs no external art. To use real art, load images here with the same keys.
 */
export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload() {
    const bar = this.add.rectangle(GAME_W / 2 - 200, GAME_H / 2, 0, 12, 0xffd166).setOrigin(0, 0.5);
    this.load.on('progress', (v) => { bar.width = 400 * v; });
    this.load.on('loaderror', (f) => console.warn('Missing asset, using placeholder:', f.key));
    if (AUDIO_ENABLED) Object.entries(AUDIO_FILES).forEach(([k, p]) => this.load.audio(k, p));
  }

  create() {
    try { this.makeTextures(); } catch (e) { console.error('Texture generation failed', e); }
    this.registry.set('audio', new AudioSystem(this.game));
    this.scene.start('MenuScene');
  }

  tex(key, w, h, draw) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    draw(g);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  canvasTex(key, w, h, paint) {
    const t = this.textures.createCanvas(key, w, h);
    paint(t.getContext());
    t.refresh();
  }

  makeTextures() {
    const T = this.tex.bind(this);
    // --- Player ---
    T('kael', 32, 48, (g) => {
      g.fillStyle(0x5b2a86).fillRect(1, 14, 11, 30).fillTriangle(1, 44, 12, 44, 6, 48);
      g.fillStyle(0x34405a).fillRect(11, 36, 5, 12).fillRect(18, 36, 5, 12);
      g.fillStyle(0x8aa0c8).fillRect(10, 16, 14, 21);
      g.fillStyle(0x2a2f45).fillCircle(17, 10, 10);
      g.fillStyle(0x7df9ff).fillRect(18, 7, 7, 3);
      g.fillStyle(0xe0e6ff).fillRect(23, 24, 9, 3);
      g.fillStyle(0xffd166).fillRect(22, 22, 2, 7);
    });
    T('slash', 64, 64, (g) => { g.lineStyle(7, 0xffffff, 1); g.beginPath(); g.arc(8, 32, 28, -0.9, 0.9); g.strokePath(); g.lineStyle(3, 0x9be7ff, 1); g.beginPath(); g.arc(8, 32, 22, -0.8, 0.8); g.strokePath(); });
    // --- Enemies ---
    T('stone_walker', 44, 52, (g) => {
      g.fillStyle(0x4b4f5a).fillRect(6, 40, 12, 12).fillRect(26, 40, 12, 12);
      g.fillStyle(0x6b6f7a).fillRect(4, 12, 36, 30).fillRect(12, 0, 20, 16);
      g.fillStyle(0x858a98).fillRect(0, 14, 8, 20).fillRect(36, 14, 8, 20);
      g.fillStyle(0xff9a3c).fillRect(15, 6, 5, 4).fillRect(24, 6, 5, 4);
    });
    T('flying_wisp', 32, 32, (g) => {
      g.fillStyle(0x3ab8ff, 0.3).fillCircle(16, 16, 16); g.fillStyle(0x6ae3ff, 0.7).fillCircle(16, 16, 11); g.fillStyle(0xffffff).fillCircle(16, 16, 5);
    });
    T('mech_spider', 48, 28, (g) => {
      g.lineStyle(3, 0x7a7f8c);
      for (let i = 0; i < 4; i++) { g.lineBetween(14 + i * 6, 14, 2 + i * 10, 27); g.lineBetween(14 + i * 6, 14, 6 + i * 10, 4); }
      g.fillStyle(0x8a5a2b).fillEllipse(24, 14, 30, 18); g.fillStyle(0xff3333).fillCircle(32, 11, 3).fillCircle(26, 11, 3);
    });
    T('shadow_knight', 36, 56, (g) => {
      g.fillStyle(0x120f22).fillRect(4, 18, 28, 38); g.fillStyle(0x2a2347).fillRect(8, 2, 20, 20).fillRect(8, 22, 20, 22);
      g.fillStyle(0xb36bff).fillRect(18, 9, 8, 3); g.fillStyle(0xcfd4ff).fillRect(26, 24, 10, 3);
    });
    T('fire_beast', 60, 44, (g) => {
      g.fillStyle(0x7a2210).fillRect(8, 32, 10, 12).fillRect(40, 32, 10, 12);
      g.fillStyle(0xc2400f).fillEllipse(30, 22, 54, 34); g.fillStyle(0xff8a1f).fillEllipse(40, 18, 24, 20);
      g.fillStyle(0xffd23f).fillTriangle(34, 4, 40, 12, 46, 4).fillTriangle(48, 8, 52, 16, 56, 6); g.fillStyle(0xffffff).fillRect(46, 16, 5, 4);
    });
    // --- Bosses ---
    T('warden', 80, 110, (g) => {
      g.fillStyle(0x3a3f4d).fillRect(14, 80, 22, 30).fillRect(44, 80, 22, 30);
      g.fillStyle(0x596070).fillRect(10, 30, 60, 56); g.fillStyle(0x6f7688).fillRect(0, 26, 22, 24).fillRect(58, 26, 22, 24);
      g.fillStyle(0x434958).fillRect(22, 0, 36, 32);
      g.fillStyle(0xff2b2b).fillRect(28, 12, 8, 6).fillRect(44, 12, 8, 6); g.fillStyle(0xff5533).fillCircle(40, 56, 9);
      g.fillStyle(0xcfd4ff).fillRect(62, 40, 18, 6);
    });
    T('brute', 64, 90, (g) => {
      g.fillStyle(0x5a3a1c).fillRect(10, 66, 18, 24).fillRect(36, 66, 18, 24);
      g.fillStyle(0x8a5a2b).fillRect(6, 24, 52, 46); g.fillStyle(0xa8743a).fillRect(0, 22, 18, 22).fillRect(46, 22, 18, 22);
      g.fillStyle(0x6e4720).fillRect(18, 0, 28, 28); g.fillStyle(0xffb347).fillRect(24, 10, 6, 5).fillRect(36, 10, 6, 5);
      g.lineStyle(3, 0x333333).strokeCircle(32, 48, 10);
    });
    // --- Props / pickups ---
    T('spikesTex', 32, 16, (g) => { g.fillStyle(0x9aa3b8); for (let i = 0; i < 2; i++) g.fillTriangle(i * 16, 16, i * 16 + 8, 0, i * 16 + 16, 16); g.fillStyle(0xff3355, 0.8).fillRect(0, 14, 32, 2); });
    T('orb', 16, 16, (g) => { g.fillStyle(0xffffff, 0.35).fillCircle(8, 8, 8); g.fillStyle(0xffffff).fillCircle(8, 8, 5); });
    T('wave', 24, 30, (g) => { g.fillStyle(0xffffff, 0.9).fillTriangle(0, 30, 12, 0, 24, 30); });
    T('stalactite', 24, 56, (g) => { g.fillStyle(0x5aa0c8).fillTriangle(0, 0, 24, 0, 12, 56); g.fillStyle(0xaee6ff).fillTriangle(5, 0, 12, 0, 9, 34); });
    T('saw', 48, 48, (g) => {
      g.fillStyle(0xaab0bd);
      for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4; g.fillTriangle(24 + Math.cos(a - 0.25) * 18, 24 + Math.sin(a - 0.25) * 18, 24 + Math.cos(a + 0.25) * 18, 24 + Math.sin(a + 0.25) * 18, 24 + Math.cos(a) * 24, 24 + Math.sin(a) * 24); }
      g.fillCircle(24, 24, 19); g.fillStyle(0x4a4f5c).fillCircle(24, 24, 7);
    });
    T('coin', 16, 16, (g) => { g.fillStyle(0xb8860b).fillCircle(8, 8, 8); g.fillStyle(0xffd23f).fillCircle(8, 8, 6); g.fillStyle(0xfff0a0).fillRect(6, 4, 2, 8); });
    T('crystal', 16, 24, (g) => { g.fillStyle(0x2ad4ff).fillTriangle(8, 0, 16, 10, 8, 24).fillTriangle(8, 0, 0, 10, 8, 24); g.fillStyle(0xbdf4ff).fillTriangle(8, 0, 8, 24, 3, 10); });
    T('heart', 20, 18, (g) => { g.fillStyle(0xff3355).fillCircle(6, 6, 6).fillCircle(14, 6, 6).fillTriangle(0, 8, 20, 8, 10, 18); });
    T('upgrade', 24, 28, (g) => { g.fillStyle(0xb36bff).fillTriangle(12, 0, 24, 14, 12, 28).fillTriangle(12, 0, 0, 14, 12, 28); g.fillStyle(0xf0d9ff).fillTriangle(12, 4, 12, 24, 5, 14); });
    T('rune', 28, 28, (g) => { g.lineStyle(3, 0xffd166).strokeCircle(14, 14, 12); g.fillStyle(0xffd166).fillRect(12, 6, 4, 16).fillRect(6, 12, 16, 4); });
    T('checkpoint', 24, 64, (g) => { g.fillStyle(0x4a4f63).fillRect(8, 20, 8, 44).fillRect(2, 56, 20, 8); g.fillStyle(0x2a2d3a).fillTriangle(12, 0, 22, 22, 2, 22); });
    T('checkpoint_on', 24, 64, (g) => { g.fillStyle(0x4a4f63).fillRect(8, 20, 8, 44).fillRect(2, 56, 20, 8); g.fillStyle(0x66f0ff).fillTriangle(12, 0, 22, 22, 2, 22); g.fillStyle(0xffffff).fillTriangle(12, 8, 17, 20, 7, 20); });
    T('portal', 56, 100, (g) => { g.fillStyle(0x6a5acd, 0.35).fillEllipse(28, 50, 56, 100); g.lineStyle(4, 0xb7a8ff).strokeEllipse(28, 50, 50, 94); g.fillStyle(0xffffff, 0.5).fillEllipse(28, 50, 24, 60); });

    // --- Soft gradients (canvas) ---
    this.canvasTex('glow', 64, 64, (c) => { const gr = c.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, 64, 64); });
    this.canvasTex('fog', 256, 128, (c) => { const gr = c.createRadialGradient(128, 64, 0, 128, 64, 128); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.save(); c.scale(1, 0.5); c.fillStyle = gr; c.fillRect(0, 0, 256, 256); c.restore(); });
    this.canvasTex('vignette', GAME_W, GAME_H, (c) => { const gr = c.createRadialGradient(GAME_W / 2, GAME_H / 2, 260, GAME_W / 2, GAME_H / 2, 760); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.75)'); c.fillStyle = gr; c.fillRect(0, 0, GAME_W, GAME_H); });

    // --- Per-area tiles and parallax layers ---
    for (const [n, t] of Object.entries(THEMES)) {
      T(`ground${n}`, 64, 120, (g) => {
        g.fillStyle(t.tile).fillRect(0, 0, 64, 120); g.fillStyle(t.top).fillRect(0, 0, 64, 8);
        g.fillStyle(0x000000, 0.22).fillRect(0, 40, 64, 2).fillRect(0, 80, 64, 2).fillRect(32, 8, 2, 32).fillRect(16, 42, 2, 38).fillRect(48, 82, 2, 38);
      });
      T(`plat${n}`, 64, 24, (g) => {
        g.fillStyle(t.tile).fillRect(0, 0, 64, 24); g.fillStyle(t.top).fillRect(0, 0, 64, 6); g.fillStyle(0x000000, 0.25).fillRect(0, 14, 64, 2).fillRect(30, 6, 2, 8);
      });
      T(`bgfar${n}`, GAME_W, GAME_H, (g) => {
        g.fillGradientStyle(t.sky[0], t.sky[0], t.sky[1], t.sky[1], 1).fillRect(0, 0, GAME_W, GAME_H);
        g.fillStyle(t.accent, 0.12).fillCircle(960, 190, 90); g.fillStyle(t.accent, 0.2).fillCircle(960, 190, 46);
        g.fillStyle(t.far, 1).beginPath().moveTo(0, GAME_H);
        for (let x = 0; x <= GAME_W; x += 16) { const k = (x / GAME_W) * Math.PI * 2; g.lineTo(x, 430 + 45 * Math.sin(k * 3) + 26 * Math.sin(k * 7 + 1)); }
        g.lineTo(GAME_W, GAME_H).closePath().fillPath();
      });
      T(`bgmid${n}`, GAME_W, GAME_H, (g) => {
        g.fillStyle(t.mid, 1);
        for (let i = 0; i < 4; i++) {
          const x = i * 320 + 50, h = 220 + (i % 2) * 90;
          g.fillRect(x, GAME_H - h - 120, 70, h + 120).fillRect(x - 12, GAME_H - h - 132, 94, 18);
          g.fillStyle(t.accent, 0.5); for (let w = 0; w < 4; w++) g.fillRect(x + 22, GAME_H - h - 90 + w * 46, 8, 14);
          g.fillStyle(t.mid, 1);
          g.lineStyle(6, t.mid, 1).strokeCircle(x + 190, 470 - (i % 2) * 40, 46).strokeCircle(x + 190, 470 - (i % 2) * 40, 22);
        }
        g.fillRect(0, GAME_H - 160, GAME_W, 160);
      });
    }
  }
}
