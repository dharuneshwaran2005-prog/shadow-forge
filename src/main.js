import Phaser from 'phaser';
import { GAME_CONFIG } from './config.js';
import { initTouchControls } from './utils/TouchControls.js';

// Single entry point: create the Phaser game once the DOM is ready.
window.addEventListener('load', () => {
  try {
    new Phaser.Game(GAME_CONFIG);
    initTouchControls();
  } catch (err) {
    console.error('Failed to start Shadow Forge:', err);
    document.body.insertAdjacentHTML('beforeend', '<pre style="color:#f66;padding:1em">Failed to start the game. See the browser console.</pre>');
  }
});
