import { GameScene, row } from './GameScene.js';

/** Level 2 - Crystal Caverns: moving platforms, falling stalactites, flying enemies, hidden collectibles. */
export class Level2Scene extends GameScene {
  constructor() { super('Level2Scene'); }

  getLevelData() {
    return {
      id: 2, name: 'Level 2 - Crystal Caverns', theme: 2, width: 5600,
      spawn: { x: 120, y: 540 },
      ground: [[0, 900], [1250, 2200], [2400, 3300], [3500, 4300], [4450, 5600]],
      platforms: [[1500, 520, 120], [1700, 440, 120], [1900, 360, 120], [2900, 330, 200], [3600, 520, 120], [3950, 520, 140]],
      movers: [{ x: 950, y: 540, w: 130, dx: 150, dy: 0, speed: 80 }, { x: 2650, y: 540, w: 120, dx: 0, dy: -240, speed: 60 }],
      spikes: [[2800, 584, 96]],
      stalactites: { xs: [1300, 1450, 1800, 2500, 2650, 3700, 4000, 4600, 4900], interval: 2200 },
      hints: [[300, 'Watch the ceiling - crystals fall!'], [1000, 'Ride the moving platform']],
      pickups: [
        ...row('coin', 300, 560, 5), ['health', 700, 570], ...row('coin', 960, 500, 3), ...row('coin', 1520, 480, 3, 36),
        ['crystal', 1960, 330], ['upgrade', 1960, 290, 'dmg'], // hidden at the top of the climb
        ...row('coin', 2450, 560, 4), ['crystal', 2960, 300], ['crystal', 3000, 300], ['crystal', 3040, 300],
        ...row('coin', 3520, 560, 4), ['rune', 4020, 490, 'dash'], ['health', 4350, 520], ...row('coin', 4700, 560, 5), ['crystal', 5100, 570],
      ],
      checkpoints: [[1300], [3600]],
      enemies: [
        ['mech_spider', 1600, 570, 250], ['flying_wisp', 1500, 350, 220], ['flying_wisp', 2000, 300, 200], ['stone_walker', 2600, 540, 200],
        ['mech_spider', 3900, 570, 250], ['flying_wisp', 3800, 400, 200], ['shadow_knight', 4800, 540, 220], ['flying_wisp', 4900, 350, 250], ['stone_walker', 5100, 540, 150],
      ],
      exit: { x: 5450 },
    };
  }
}
