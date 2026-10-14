import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../utils/Constants.js';
import { buildMenu, textStyle, showControls, showSettings } from '../utils/UI.js';

/** Overlay shown while a level scene is paused. */
export class PauseScene extends Phaser.Scene {
  constructor() { super('PauseScene'); }

  init(data) { this.from = data.from; }

  create() {
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x000000, 0.65).setDepth(200);
    this.add.text(GAME_W / 2, 190, 'PAUSED', textStyle(64, '#ffd166')).setOrigin(0.5).setDepth(210);
    this.menu = buildMenu(this, [
      { label: 'Resume', onSelect: () => this.resume() },
      { label: 'Controls', onSelect: () => this.open(showControls) },
      { label: 'Settings', onSelect: () => this.open(showSettings) },
      { label: 'Quit to Menu', onSelect: () => this.quit() },
    ], GAME_W / 2, 320, 62, 34);
    this.escHandler = () => { if (this.menu && !this.overlayOpen) this.resume(); };
    this.time.delayedCall(150, () => this.input.keyboard.on('keydown-ESC', this.escHandler));
    this.events.once('shutdown', () => this.input.keyboard.off('keydown-ESC', this.escHandler));
  }

  open(fn) { this.overlayOpen = true; this.menu.setEnabled(false); fn(this, () => { this.overlayOpen = false; this.menu.setEnabled(true); }); }
  resume() { this.scene.resume(this.from); this.scene.stop(); }
  quit() { this.scene.stop(this.from); this.scene.start('MenuScene'); }
}
