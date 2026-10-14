import Phaser from 'phaser';
import { GAME_W, GAME_H, GRAVITY } from './utils/Constants.js';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { Level1Scene } from './scenes/Level1Scene.js';
import { Level2Scene } from './scenes/Level2Scene.js';
import { Level3Scene } from './scenes/Level3Scene.js';
import { Level4Scene } from './scenes/Level4Scene.js';
import { PauseScene } from './scenes/PauseScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';

// GameScene is the abstract base class of the level scenes, so it is not registered.
export const GAME_CONFIG = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#07050d',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { gravity: { y: GRAVITY }, debug: false } },
  scene: [BootScene, MenuScene, Level1Scene, Level2Scene, Level3Scene, Level4Scene, PauseScene, GameOverScene],
};
