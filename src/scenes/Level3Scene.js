import { GameScene, row } from './GameScene.js';

/** Level 3 - Mechanical Fortress: traps, moving machines, strong enemies, mini-boss (Gear Brute). */
export class Level3Scene extends GameScene {
  constructor() { super('Level3Scene'); }

  getLevelData() {
    return {
      id: 3, name: 'Level 3 - Mechanical Fortress', theme: 3, width: 6400,
      spawn: { x: 120, y: 540 },
      ground: [[0, 800], [950, 1700], [1850, 2700], [2850, 3600], [3750, 4500], [4700, 6400]],
      platforms: [[300, 530, 140], [1100, 530, 140], [1250, 450, 140], [2000, 530, 160], [3000, 530, 140], [3200, 450, 140]],
      movers: [{ x: 3620, y: 540, w: 110, dx: 0, dy: -120, speed: 70 }],
      spikes: [[1350, 584, 128], [2300, 584, 128], [3300, 584, 96], [4100, 584, 128]],
      saws: [{ x: 2100, y1: 440, y2: 570, dur: 1300 }, { x: 3000, y1: 440, y2: 570, dur: 1500 }, { x: 4300, y1: 440, y2: 570, dur: 1200 }, { x: 1550, y1: 450, y2: 570, dur: 1400 }],
      hints: [[400, 'Saws and spikes ahead - time your jumps'], [4900, 'A guardian blocks the gate...']],
      pickups: [
        ...row('coin', 320, 500, 3), ['health', 700, 570], ...row('coin', 1120, 500, 3), ...row('coin', 1270, 420, 3), ['crystal', 1320, 420],
        ...row('coin', 2020, 500, 4), ['upgrade', 3260, 410, 'stamina'], ...row('coin', 3020, 500, 3), ['health', 3500, 570],
        ...row('coin', 3800, 560, 4), ['crystal', 4400, 570], ['health', 4800, 570],
      ],
      checkpoints: [[700], [2900], [4800]],
      enemies: [
        ['shadow_knight', 500, 540, 250], ['stone_walker', 1500, 540, 250], ['fire_beast', 2200, 540, 200], ['mech_spider', 2650, 570, 180],
        ['flying_wisp', 3000, 350, 250], ['shadow_knight', 3400, 540, 200], ['fire_beast', 4000, 540, 200], ['mech_spider', 4300, 570, 180],
      ],
      boss: { variant: 'brute', x: 5700, y: 500, triggerX: 5000, arenaLeft: 4780, arenaRight: 6060, reward: 'dmg' },
      exit: { x: 6250, needsMiniBoss: true },
    };
  }
}
