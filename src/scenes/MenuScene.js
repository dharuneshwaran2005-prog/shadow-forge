import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../utils/Constants.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { buildMenu, textStyle, showControls, showSettings } from '../utils/UI.js';

export class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    this.audio = this.registry.get('audio');
    this.audio.stopMusic();
    this.audio.playMusic('music_menu');
    this.far = this.add.tileSprite(0, 0, GAME_W, GAME_H, 'bgfar2').setOrigin(0);
    this.mid = this.add.tileSprite(0, 0, GAME_W, GAME_H, 'bgmid2').setOrigin(0);
    this.add.image(GAME_W / 2, GAME_H / 2, 'vignette');
    for (let i = 0; i < 6; i++) {
      const f = this.add.image(Math.random() * GAME_W, 400 + Math.random() * 250, 'fog').setAlpha(0.15).setTint(0x7799bb).setScale(2 + Math.random() * 2);
      this.tweens.add({ targets: f, x: f.x + 220, duration: 12000 + i * 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    const glow = this.add.image(GAME_W / 2, 150, 'glow').setTint(0xffb347).setBlendMode(Phaser.BlendModes.ADD).setScale(9).setAlpha(0.25);
    this.tweens.add({ targets: glow, alpha: 0.45, duration: 1800, yoyo: true, repeat: -1 });
    this.add.text(GAME_W / 2, 130, 'SHADOW FORGE', { ...textStyle(88, '#ffd166'), strokeThickness: 8 }).setOrigin(0.5);
    this.add.text(GAME_W / 2, 205, 'Rise of the Guardian', textStyle(34, '#b7a8ff')).setOrigin(0.5);

    const items = [
      { label: 'Start Game', onSelect: () => this.startNew() },
      { label: 'Continue', disabled: !SaveSystem.hasSave(), onSelect: () => this.continueGame() },
      { label: 'Settings', onSelect: () => this.open(showSettings) },
      { label: 'Controls', onSelect: () => this.open(showControls) },
    ];
    this.menu = buildMenu(this, items, GAME_W / 2, 330, 64, 36);
    this.add.text(GAME_W / 2, GAME_H - 30, 'Arrow keys / W,S + Enter, or click', textStyle(18, '#7a7fa5')).setOrigin(0.5);
  }

  open(fn) { this.menu.setEnabled(false); fn(this, () => this.menu.setEnabled(true)); }
  startNew() { SaveSystem.reset(); this.scene.start('Level1Scene'); }
  continueGame() { const s = SaveSystem.load(); this.scene.start(`Level${Phaser.Math.Clamp(s.level, 1, 4)}Scene`); }
  update() { this.far.tilePositionX += 0.15; this.mid.tilePositionX += 0.4; }
}
