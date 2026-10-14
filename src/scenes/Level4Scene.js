import { GameScene, row } from './GameScene.js';

/** Level 4 - Iron Citadel: difficult platforming, strong enemies and THE IRON WARDEN. */
export class Level4Scene extends GameScene {
  constructor() { super('Level4Scene'); }

  getLevelData() {
    return {
      id: 4, name: 'Level 4 - Iron Citadel', theme: 4, width: 7200,
      spawn: { x: 120, y: 540 },
      ground: [[0, 700], [950, 1500], [2300, 2900], [3200, 3600], [3900, 4400], [4900, 7200]],
      platforms: [[780, 530, 100], [1600, 530, 100], [1800, 460, 100], [2000, 530, 100], [4500, 530, 100], [4700, 460, 100]],
      movers: [{ x: 2920, y: 560, w: 100, dx: 180, dy: 0, speed: 90 }, { x: 3620, y: 560, w: 100, dx: 180, dy: 0, speed: 100 }],
      spikes: [[1100, 584, 128], [2500, 584, 128], [4000, 584, 128]],
      saws: [{ x: 2700, y1: 440, y2: 570, dur: 1100 }, { x: 3400, y1: 440, y2: 570, dur: 1000 }, { x: 1250, y1: 450, y2: 570, dur: 1200 }],
      hints: [[300, 'The Citadel is unforgiving.\nUse double jump and dash.'], [5400, 'THE IRON WARDEN awaits...']],
      pickups: [
        ...row('coin', 320, 560, 4), ['health', 600, 570], ['crystal', 800, 500], ...row('coin', 1620, 500, 2), ['upgrade', 1840, 430, 'dash'],
        ...row('coin', 2350, 560, 4), ['health', 3300, 570], ['crystal', 3400, 570], ['upgrade', 4730, 430, 'hp'], ['health', 5000, 570], ['health', 5100, 570],
      ],
      checkpoints: [[1000], [3300], [5050]],
      enemies: [
        ['shadow_knight', 450, 540, 200], ['fire_beast', 1250, 540, 200], ['flying_wisp', 1700, 350, 250], ['flying_wisp', 2100, 380, 250],
        ['shadow_knight', 2600, 540, 250], ['mech_spider', 3400, 570, 150], ['fire_beast', 4100, 540, 200], ['flying_wisp', 4600, 340, 250],
      ],
      boss: { variant: 'warden', x: 6000, y: 500, triggerX: 5350, arenaLeft: 5000, arenaRight: 6280, reward: 'dmg' },
    };
  }
}
