import Phaser from 'phaser';
import { GAME_W, GAME_H } from './Constants.js';
import { SaveSystem } from '../systems/SaveSystem.js';

const FONT = 'Georgia, "Times New Roman", serif';
export const textStyle = (size = 28, color = '#d8dcff') => ({ fontFamily: FONT, fontSize: `${size}px`, color, stroke: '#000000', strokeThickness: 4 });

/**
 * Vertical keyboard + mouse menu. items: [{ label | label(): string, onSelect, disabled }]
 * Returns { setEnabled(bool), refresh(), destroy() }.
 */
export function buildMenu(scene, items, x, y, gap = 60, size = 32) {
  let index = items.findIndex((i) => !i.disabled);
  let enabled = true;
  const labelOf = (it) => (typeof it.label === 'function' ? it.label() : it.label);
  const buttons = items.map((it, i) => {
    const t = scene.add.text(x, y + i * gap, labelOf(it), textStyle(size)).setOrigin(0.5).setDepth(210);
    if (!it.disabled) {
      t.setInteractive({ useHandCursor: true });
      t.on('pointerover', () => { if (enabled) { index = i; paint(); } });
      t.on('pointerdown', () => { if (enabled) choose(i); });
    }
    return t;
  });
  const paint = () => buttons.forEach((b, i) => {
    b.setText(labelOf(items[i]));
    b.setColor(items[i].disabled ? '#5b5f78' : i === index ? '#ffd166' : '#cfd4ff').setScale(i === index ? 1.08 : 1);
  });
  const choose = (i) => { scene.registry.get('audio')?.play('ui'); items[i].onSelect(); };
  const step = (d) => {
    if (!enabled) return;
    let n = index;
    do { n = (n + d + items.length) % items.length; } while (items[n].disabled);
    index = n; paint(); scene.registry.get('audio')?.play('ui');
  };
  const kb = scene.input.keyboard;
  const onUp = () => step(-1), onDown = () => step(1), onEnter = () => { if (enabled && index >= 0) choose(index); };
  kb.on('keydown-UP', onUp); kb.on('keydown-W', onUp); kb.on('keydown-DOWN', onDown); kb.on('keydown-S', onDown);
  kb.on('keydown-ENTER', onEnter);
  const destroy = () => { kb.off('keydown-UP', onUp); kb.off('keydown-W', onUp); kb.off('keydown-DOWN', onDown); kb.off('keydown-S', onDown); kb.off('keydown-ENTER', onEnter); buttons.forEach((b) => b.destroy()); };
  scene.events.once('shutdown', destroy);
  paint();
  return { setEnabled: (v) => { enabled = v; buttons.forEach((b) => b.setVisible(v)); }, refresh: paint, destroy };
}

/** Full-screen overlay panel that closes on click / ESC / Enter. Returns the container. */
function overlay(scene, title, lines, onClose) {
  const c = scene.add.container(0, 0).setDepth(300);
  c.add(scene.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x05030a, 0.92).setInteractive());
  c.add(scene.add.rectangle(GAME_W / 2, GAME_H / 2, 760, 560, 0x15102a, 1).setStrokeStyle(3, 0x6a5acd));
  c.add(scene.add.text(GAME_W / 2, 140, title, textStyle(40, '#ffd166')).setOrigin(0.5));
  c.add(scene.add.text(GAME_W / 2, 400, lines.join('\n'), { ...textStyle(24), align: 'left', lineSpacing: 10 }).setOrigin(0.5));
  c.add(scene.add.text(GAME_W / 2, 625, 'Click, ESC or ENTER to close', textStyle(20, '#8a8fb5')).setOrigin(0.5));
  const close = () => { scene.input.keyboard.off('keydown-ESC', close); scene.input.keyboard.off('keydown-ENTER', close); c.destroy(); onClose?.(); };
  scene.time.delayedCall(80, () => {
    scene.input.keyboard.on('keydown-ESC', close); scene.input.keyboard.on('keydown-ENTER', close);
    c.list[0].on('pointerdown', close);
  });
  return c;
}

export function showControls(scene, onClose) {
  return overlay(scene, 'CONTROLS', [
    'A / Left Arrow ........ Move left', 'D / Right Arrow ...... Move right', 'W / Up / Space ........ Jump (press twice = double jump)',
    'J ..................... Basic attack', 'K ..................... Heavy attack (hold to charge)', 'L ..................... Dash (damages enemies)',
    'E ..................... Interact (gates / portals)', 'ESC ................... Pause menu', '',
    'Touch a shrine to save. Collect runes to unlock abilities.',
  ], onClose);
}

export function showSettings(scene, onClose) {
  const s = SaveSystem.loadSettings();
  const c = scene.add.container(0, 0).setDepth(300);
  c.add(scene.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x05030a, 0.92).setInteractive());
  c.add(scene.add.rectangle(GAME_W / 2, GAME_H / 2, 760, 460, 0x15102a, 1).setStrokeStyle(3, 0x6a5acd));
  c.add(scene.add.text(GAME_W / 2, 190, 'SETTINGS', textStyle(40, '#ffd166')).setOrigin(0.5));
  const cycle = (v) => (v >= 1 ? 0 : Math.round((v + 0.25) * 100) / 100);
  const rows = [
    () => `Music volume: ${Math.round(s.music * 100)}%`, () => `Effects volume: ${Math.round(s.sfx * 100)}%`, () => `Screen shake: ${s.shake ? 'ON' : 'OFF'}`, () => 'Back',
  ];
  const texts = rows.map((r, i) => {
    const t = scene.add.text(GAME_W / 2, 280 + i * 70, r(), textStyle(30)).setOrigin(0.5).setInteractive({ useHandCursor: true });
    t.on('pointerover', () => t.setColor('#ffd166')); t.on('pointerout', () => t.setColor('#d8dcff'));
    t.on('pointerdown', () => {
      if (i === 0) s.music = cycle(s.music); else if (i === 1) s.sfx = cycle(s.sfx); else if (i === 2) s.shake = !s.shake; else return close();
      SaveSystem.saveSettings(s); texts.forEach((tx, j) => tx.setText(rows[j]())); scene.registry.get('audio')?.play('ui');
      scene.registry.get('audio')?.music?.setVolume?.(s.music);
    });
    c.add(t); return t;
  });
  const close = () => { scene.input.keyboard.off('keydown-ESC', close); c.destroy(); onClose?.(); };
  scene.time.delayedCall(80, () => scene.input.keyboard.on('keydown-ESC', close));
  return c;
}
