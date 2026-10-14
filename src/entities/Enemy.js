import Phaser from 'phaser';
import { ENEMY_TYPES, AI_STATE as A, PLAYER_STATE } from '../utils/Constants.js';

/**
 * Generic enemy. Behaviour is data-driven (ENEMY_TYPES) plus small per-type attack routines.
 * AI states: IDLE -> PATROL -> CHASE -> ATTACK -> (HURT) -> DEAD
 */
export class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, type, x, y, minX, maxX) {
    const cfg = ENEMY_TYPES[type];
    super(scene, x, y, type);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.type = type;
    this.cfg = cfg;
    this.hp = cfg.hp;
    this.ai = A.IDLE;
    this.minX = minX; this.maxX = maxX;
    this.baseY = y;
    this.dir = Math.random() < 0.5 ? -1 : 1;
    this.aiUntil = scene.time.now + 400;
    this.nextAttackAt = 0;
    this.attackStart = 0; this.activeDone = false;
    this.setDepth(8);
  }

  /** Must be called after the enemy has been added to a physics group (groups reset body defaults). */
  initBody() {
    this.body.setSize(this.cfg.w, this.cfg.h);
    this.body.setAllowGravity(!this.cfg.flying);
  }

  update(time, delta, player) {
    if (this.ai === A.DEAD || !this.active) return;
    const dx = player.x - this.x, dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    const alive = player.pState !== PLAYER_STATE.DEAD;
    const detect = alive && dist < this.cfg.detect;

    switch (this.ai) {
      case A.HURT:
        if (time > this.aiUntil) this.ai = detect ? A.CHASE : A.PATROL;
        break;
      case A.IDLE:
        this.setVelocityX(0);
        if (this.cfg.flying) this.setVelocityY(Math.sin(time / 350) * 30);
        if (detect) this.ai = A.CHASE; else if (time > this.aiUntil) this.ai = A.PATROL;
        break;
      case A.PATROL:
        this.patrol(time);
        if (detect) this.ai = A.CHASE;
        break;
      case A.CHASE:
        if (!detect && dist > this.cfg.detect * 1.4) { this.ai = A.PATROL; break; }
        this.chase(dx, dy, time);
        if (Math.abs(dx) < this.cfg.attackRange && Math.abs(dy) < (this.cfg.flying ? 260 : 90) && time > this.nextAttackAt) this.beginAttack(time, player);
        break;
      case A.ATTACK: this.updateAttack(time, player); break;
      default: break;
    }
    this.setFlipX(this.dir < 0);
    if (this.y > 1100) this.die(); // fell out of the world
  }

  moveX(dir, speed) {
    this.dir = dir;
    const blocked = (this.x <= this.minX && dir < 0) || (this.x >= this.maxX && dir > 0);
    this.setVelocityX(blocked ? 0 : dir * speed);
    return blocked;
  }

  patrol(time) {
    const hitEdge = this.moveX(this.dir, this.cfg.speed);
    if (this.cfg.flying) this.setVelocityY(Math.sin(time / 400) * 40);
    if (hitEdge || this.body.blocked.left || this.body.blocked.right) {
      this.dir *= -1; this.ai = A.IDLE; this.aiUntil = time + 600;
    }
  }

  chase(dx, dy, time) {
    if (this.cfg.flying) {
      const tx = dx, ty = dy - 60;
      const len = Math.hypot(tx, ty) || 1;
      this.dir = dx >= 0 ? 1 : -1;
      this.setVelocity((tx / len) * this.cfg.chase, (ty / len) * this.cfg.chase + Math.sin(time / 250) * 20);
    } else if (Math.abs(dx) > 20) {
      this.moveX(dx > 0 ? 1 : -1, this.cfg.chase);
    } else this.setVelocityX(0);
  }

  beginAttack(time, player) {
    this.ai = A.ATTACK; this.attackStart = time; this.activeDone = false;
    this.dir = player.x >= this.x ? 1 : -1;
    this.target = { x: player.x, y: player.y };
    this.setVelocityX(0);
  }

  updateAttack(time, player) {
    const c = this.cfg, t = time - this.attackStart;
    if (t < c.windup) { // telegraph: stand still and flash
      if (this.type !== 'flying_wisp') this.setVelocityX(0);
      this.setTint(Math.floor(t / 80) % 2 ? 0xff7766 : 0xffffff);
      return;
    }
    if (!this.activeDone) { this.activeDone = true; this.clearTint(); this.performAttack(player); }
    if (t > c.windup + c.active) {
      if (t > c.windup + c.active + c.recover) { this.ai = A.CHASE; this.nextAttackAt = time + c.cooldown; }
      else if (this.type !== 'flying_wisp') this.setVelocityX(0);
      else this.setVelocity(0, -30);
    }
  }

  performAttack() {
    const d = this.dir;
    switch (this.type) {
      case 'stone_walker': this.setVelocityX(d * 320); break;
      case 'flying_wisp': { // dive towards where the player was
        const vx = this.target.x - this.x, vy = this.target.y - this.y, len = Math.hypot(vx, vy) || 1;
        this.setVelocity((vx / len) * 340, (vy / len) * 340); break;
      }
      case 'mech_spider': if (this.body.blocked.down) this.setVelocity(d * 320, -430); break;
      case 'shadow_knight': this.setVelocityX(d * 440); break;
      case 'fire_beast': this.scene.spawnProjectile(this.x + d * 34, this.y - 6, d * 340, 0, this.cfg.dmg, 0xff6a00); break;
      default: break;
    }
  }

  /** Returns false if the hit was ignored. */
  takeHit(dmg, kx, ky, time) {
    if (this.ai === A.DEAD) return false;
    this.hp -= dmg;
    if (this.hp <= 0) { this.die(); return true; }
    this.ai = A.HURT; this.aiUntil = time + 280;
    this.clearTint(); this.setTintFill(0xffffff);
    this.scene.time.delayedCall(70, () => this.active && this.clearTint());
    const heavy = this.type === 'fire_beast' || this.type === 'shadow_knight' ? 0.6 : 1; // heavier foes resist knockback
    this.setVelocity(kx * heavy, this.cfg.flying ? ky * -0.5 : -Math.abs(ky) * heavy);
    return true;
  }

  die() {
    if (this.ai === A.DEAD) return;
    this.ai = A.DEAD;
    this.body.enable = false;
    this.clearTint();
    this.scene.audio.play('enemyDeath');
    this.scene.particles.explosion(this.x, this.y, 0xffb347);
    this.scene.onEnemyKilled(this);
    this.scene.tweens.add({ targets: this, scaleY: 0.2, scaleX: 1.4, alpha: 0, angle: this.dir * 40, duration: 380, onComplete: () => this.destroy() });
  }
}
