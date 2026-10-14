import { GameScene, row } from './GameScene.js';

/** Level 1 - Forgotten Village: tutorial (move, jump, attack, collect). */
export class Level1Scene extends GameScene {
  constructor() { super('Level1Scene'); }

  getLevelData() {
    return {
      id: 1, name: 'Level 1 - Forgotten Village', theme: 1, width: 4800,
      spawn: { x: 120, y: 540 },
      ground: [[0, 1400], [1500, 2400], [2550, 3400], [3500, 4800]],
      platforms: [[520, 530, 160], [780, 450, 160], [1750, 530, 200], [2150, 520, 140], [2800, 530, 160], [3000, 450, 140]],
      hints: [
        [220, 'A / D  -  move\nSPACE / W  -  jump'], [900, 'Grab the golden rune!\nIt unlocks DOUBLE JUMP'],
        [1150, 'J  -  sword attack\nK  -  heavy attack (hold to charge)'], [1560, 'Gaps can be crossed with a jump'],
        [2000, 'Touch shrines to save your progress'], [4500, 'Press E at the portal'],
      ],
      pickups: [
        ...row('coin', 300, 560, 5), ...row('coin', 540, 500, 4, 36), ['rune', 860, 420, 'doubleJump'], ...row('coin', 800, 420, 3),
        ['health', 1300, 570], ...row('coin', 1770, 500, 5, 36), ['upgrade', 2220, 490, 'hp'], ...row('coin', 2600, 560, 4),
        ...row('coin', 2820, 500, 3), ...row('coin', 3020, 420, 3), ['crystal', 3100, 570], ['crystal', 3200, 570], ...row('coin', 3600, 560, 5),
        ['health', 4000, 570], ['crystal', 4300, 570],
      ],
      checkpoints: [[1350], [3050]],
      enemies: [
        ['stone_walker', 1000, 540, 200], ['stone_walker', 1800, 540, 150], ['flying_wisp', 2600, 420, 200],
        ['mech_spider', 3900, 570, 250], ['shadow_knight', 4200, 540, 200],
      ],
      exit: { x: 4650 },
    };
  }
}
