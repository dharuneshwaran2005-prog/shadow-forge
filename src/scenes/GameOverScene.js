import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../utils/Constants.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { buildMenu, textStyle } from '../utils/UI.js';

/** Shows either the Game Over screen (mode 'gameover') or the Victory screen (mode 'victory'). */
export class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  init(data) { this.mode = data.mode || 'gameover'; this.level = data.level || 1; }

  create() {
    const win = this.mode === 'victory';
    const audio = this.registry.get('audio');
    audio.stopMusic();
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, win ? 0x0c0a1c : 0x14040a);
    const glow = this.add.image(GAME_W / 2, 200, 'glow').setTint(win ? 0xffd166 : 0xff3355).setBlendMode(Phaser.BlendModes.ADD).setScale(12).setAlpha(0.3);
    this.tweens.add({ targets: glow, alpha: 0.5, duration: 1500, yoyo: true, repeat: -1 });
    const save = SaveSystem.load();
    if (win) {
      this.add.text(GAME_W / 2, 150, 'VICTORY', { ...textStyle(96, '#ffd166'), strokeThickness: 8 }).setOrigin(0.5);
      this.add.text(GAME_W / 2, 250, 'The Iron Warden has fallen. The kingdom\'s forges burn bright once more.', textStyle(26, '#d8dcff')).setOrigin(0.5);
      this.add.text(GAME_W / 2, 320, `Coins: ${save.coins}     Crystals: ${save.crystals}`, textStyle(28, '#b7a8ff')).setOrigin(0.5);
      this.add.text(GAME_W / 2, 365, 'Thank you for playing Shadow Forge: Rise of the Guardian', textStyle(22, '#8a8fb5')).setOrigin(0.5);
      buildMenu(this, [{ label: 'Main Menu', onSelect: () => this.scene.start('MenuScene') }], GAME_W / 2, 500, 64, 36);
    } else {
      this.add.text(GAME_W / 2, 170, 'YOU HAVE FALLEN', { ...textStyle(80, '#ff4d6d'), strokeThickness: 8 }).setOrigin(0.5);
      this.add.text(GAME_W / 2, 255, 'The forge is not finished with you, Kael.', textStyle(26, '#d8dcff')).setOrigin(0.5);
      buildMenu(this, [
        { label: 'Respawn at Checkpoint', onSelect: () => this.scene.start(`Level${this.level}Scene`) },
        { label: 'Main Menu', onSelect: () => this.scene.start('MenuScene') },
      ], GAME_W / 2, 390, 70, 34);
    }
  }
}
