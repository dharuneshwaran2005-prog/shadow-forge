// Shared constants and tuning values. Change numbers here to rebalance the game.
export const GAME_W = 1280;
export const GAME_H = 720;
export const GRAVITY = 1400;
export const GROUND_Y = 600; // top of the ground in every level

export const PLAYER_STATE = Object.freeze({
  IDLE: 'IDLE', RUN: 'RUN', JUMP: 'JUMP', FALL: 'FALL', ATTACK: 'ATTACK',
  HEAVY_ATTACK: 'HEAVY_ATTACK', DASH: 'DASH', HURT: 'HURT', DEAD: 'DEAD',
});

export const AI_STATE = Object.freeze({
  IDLE: 'IDLE', PATROL: 'PATROL', CHASE: 'CHASE', ATTACK: 'ATTACK', HURT: 'HURT', DEAD: 'DEAD',
});

export const PLAYER = {
  MAX_SPEED: 260, ACCEL: 1800, FRICTION: 2200, AIR_FRICTION: 500,
  JUMP_V: -540, DOUBLE_JUMP_V: -470, COYOTE: 110, JUMP_BUFFER: 120,
  BASE_HP: 100, BASE_STAMINA: 100, STAMINA_REGEN: 28, STAMINA_DELAY: 450,
  INVULN: 900, HURT_TIME: 250,
  ATTACK: { cost: 8, cooldown: 300, duration: 240, from: 50, to: 160, reach: 62, h: 56, dmg: 20, kb: 220, kbY: 120, shake: 0.003 },
  HEAVY:  { cost: 25, duration: 420, from: 100, to: 260, reach: 100, h: 80, dmg: 40, bonus: 40, kb: 420, kbY: 260, shake: 0.008, chargeMax: 700 },
  DASH:   { cost: 30, time: 170, speed: 640, cooldown: 550, dmg: 18, reach: 46, h: 50, kb: 300, kbY: 100, shake: 0.004 },
};

export const ENEMY_TYPES = {
  stone_walker:  { w: 44, h: 52, hp: 60,  dmg: 12, speed: 70,  chase: 100, detect: 300, attackRange: 90,  windup: 450, active: 300, recover: 400, cooldown: 1500, coins: 2, flying: false },
  flying_wisp:   { w: 32, h: 32, hp: 30,  dmg: 8,  speed: 60,  chase: 110, detect: 380, attackRange: 260, windup: 500, active: 600, recover: 500, cooldown: 2000, coins: 1, flying: true },
  mech_spider:   { w: 48, h: 28, hp: 45,  dmg: 10, speed: 110, chase: 170, detect: 340, attackRange: 200, windup: 350, active: 500, recover: 400, cooldown: 1600, coins: 2, flying: false },
  shadow_knight: { w: 36, h: 56, hp: 100, dmg: 18, speed: 90,  chase: 140, detect: 380, attackRange: 160, windup: 400, active: 260, recover: 500, cooldown: 1400, coins: 4, flying: false },
  fire_beast:    { w: 60, h: 44, hp: 130, dmg: 15, speed: 80,  chase: 120, detect: 460, attackRange: 420, windup: 600, active: 200, recover: 700, cooldown: 2200, coins: 5, flying: false },
};

export const BOSS_TYPES = {
  warden: {
    texture: 'warden', name: 'THE IRON WARDEN', w: 80, h: 110, hp: 700, speed: 90, cooldown: 1100, contact: 12, phases: 3,
    dmg: { sword: 25, slam: 20, proj: 14, special: 30 },
    patterns: { 1: ['sword', 'slam'], 2: ['summon', 'projectiles', 'sword'], 3: ['sword', 'slam', 'projectiles', 'special'] },
  },
  brute: {
    texture: 'brute', name: 'GEAR BRUTE', w: 64, h: 90, hp: 260, speed: 80, cooldown: 1300, contact: 10, phases: 1,
    dmg: { sword: 18, slam: 14, proj: 10, special: 0 },
    patterns: { 1: ['sword', 'slam'] },
  },
};

// Colour palettes for the four areas (used for generated backgrounds and tiles).
export const THEMES = {
  1: { sky: [0x1a1030, 0x4a2c4f], far: 0x2a1a40, mid: 0x1b1030, tile: 0x3b3350, top: 0x5a8c4a, accent: 0xffb347 },
  2: { sky: [0x061a2e, 0x0f3a55], far: 0x0b2c44, mid: 0x08202f, tile: 0x24405a, top: 0x4fd1c5, accent: 0x66f0ff },
  3: { sky: [0x1b1410, 0x3a2a1c], far: 0x2d2018, mid: 0x1c140f, tile: 0x4a4038, top: 0x8a6a3a, accent: 0xff9a3c },
  4: { sky: [0x12060a, 0x3a0f14], far: 0x2a0c12, mid: 0x180609, tile: 0x3a2f33, top: 0x9a2b2b, accent: 0xff4040 },
};

// Audio: set AUDIO_ENABLED = true after adding the files below (see README).
// While false (or when a file is missing) the AudioSystem plays synthesised placeholder sounds.
export const AUDIO_ENABLED = false;
export const AUDIO_FILES = {
  music_menu: 'assets/audio/music_menu.ogg', music_level: 'assets/audio/music_level.ogg', music_boss: 'assets/audio/music_boss.ogg',
  jump: 'assets/audio/jump.ogg', attack: 'assets/audio/attack.ogg', heavy: 'assets/audio/heavy.ogg', dash: 'assets/audio/dash.ogg',
  hit: 'assets/audio/hit.ogg', enemyDeath: 'assets/audio/enemy_death.ogg', boss: 'assets/audio/boss.ogg',
  hurt: 'assets/audio/hurt.ogg', pickup: 'assets/audio/pickup.ogg', ui: 'assets/audio/ui.ogg',
};
