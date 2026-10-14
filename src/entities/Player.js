import Phaser from 'phaser';
import { PLAYER as P, PLAYER_STATE as S } from '../utils/Constants.js';

const { JustDown, JustUp } = Phaser.Input.Keyboard;

/**
 * Kael, the player. A small state machine (IDLE/RUN/JUMP/FALL/ATTACK/HEAVY_ATTACK/DASH/HURT/DEAD)
 * drives movement; GameScene calls update() every frame.
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, save) {
    super(scene, x, y, 'kael');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(10);
    this.body.setSize(22, 44).setOffset(5, 4);
    this.keys = scene.input.keyboard.addKeys({
      left: 'LEFT', a: 'A', right: 'RIGHT', d: 'D', up: 'UP', w: 'W', space: 'SPACE',
      j: 'J', k: 'K', l: 'L', e: 'E', esc: 'ESC',
    });
    this.applySave(save);
    this.hp = this.maxHp;
    this.stamina = this.maxStamina;
    this.pState = S.IDLE;
    this.facing = 1;
    this.airJumps = 0;
    this.locked = false;
    this.coyoteUntil = 0; this.jumpBufferUntil = 0; this.invulnUntil = 0; this.stateUntil = 0;
    this.attackReadyAt = 0; this.dashReadyAt = 0; this.staminaDelayUntil = 0;
    this.hit = null; this.hitSet = new Set();
    this.charging = false; this.chargeStart = 0; this.chargeFrac = 0;
    this.safe = { x, y };
  }

  /** Apply permanent upgrades/abilities from the save. */
  applySave(save) {
    this.abilities = save.abilities;
    this.maxHp = save.stats.maxHp;
    this.dmgMult = 1 + 0.2 * save.stats.dmgLevel;
    this.maxStamina = P.BASE_STAMINA + 20 * save.stats.staminaLevel;
    this.dashLevel = save.stats.dashLevel;
  }

  get dashCooldownLeft() { return Math.max(0, this.dashReadyAt - this.scene.time.now); }

  update(time, delta) {
    if (this.pState === S.DEAD) return;
    const k = this.keys;
    const onGround = this.body.blocked.down || this.body.touching.down;
    if (onGround) {
      this.coyoteUntil = time + P.COYOTE;
      this.airJumps = 0;
      if (this.body.blocked.down || this.scene.riding) this.safe = { x: this.x, y: this.y - 4 };
    }
    this.setAlpha(time < this.invulnUntil && this.pState !== S.DASH ? (Math.floor(time / 60) % 2 ? 0.35 : 1) : 1);
    if (time > this.staminaDelayUntil) this.stamina = Math.min(this.maxStamina, this.stamina + (P.STAMINA_REGEN * delta) / 1000);

    if (this.locked) { this.setAccelerationX(0); this.setDragX(1500); return; }
    const dir = (k.right.isDown || k.d.isDown ? 1 : 0) - (k.left.isDown || k.a.isDown ? 1 : 0);

    switch (this.pState) {
      case S.HURT:
        if (time > this.stateUntil) this.pState = onGround ? S.IDLE : S.FALL;
        break;
      case S.DASH: this.updateDash(time); break;
      case S.ATTACK: case S.HEAVY_ATTACK: this.updateAttack(time, dir, onGround); break;
      default: this.updateNormal(time, dir, onGround);
    }
    // Cosmetic lean (rotation does not affect the physics body).
    this.angle = this.pState === S.RUN ? Math.sin(time / 55) * 3 : this.pState === S.ATTACK || this.pState === S.HEAVY_ATTACK ? this.facing * 6 : 0;
  }

  move(dir, onGround, scale) {
    if (dir !== 0) { this.facing = dir; this.setFlipX(dir < 0); }
    this.body.maxVelocity.x = P.MAX_SPEED * scale;
    this.setAccelerationX(dir * P.ACCEL * scale);
    this.setDragX(dir === 0 ? (onGround ? P.FRICTION : P.AIR_FRICTION) : 0);
  }

  jump(v) { this.setVelocityY(v); this.scene.audio.play('jump'); }

  updateNormal(time, dir, onGround) {
    const k = this.keys;
    this.move(dir, onGround, 1);
    const pressed = JustDown(k.space) || JustDown(k.up) || JustDown(k.w);
    if (pressed) this.jumpBufferUntil = time + P.JUMP_BUFFER;
    if (time < this.jumpBufferUntil) {
      if (onGround || time < this.coyoteUntil) {
        this.jump(P.JUMP_V); this.jumpBufferUntil = 0; this.coyoteUntil = 0;
        this.scene.particles.dust(this.x, this.y + 22);
      } else if (pressed && this.abilities.doubleJump && this.airJumps < 1) {
        this.airJumps++; this.jump(P.DOUBLE_JUMP_V); this.jumpBufferUntil = 0;
        this.scene.particles.burst(this.x, this.y + 20, 0x9be7ff, 8, 120, 300);
      }
    }
    if ((JustUp(k.space) || JustUp(k.up) || JustUp(k.w)) && this.body.velocity.y < -200) this.body.velocity.y *= 0.5;

    if (JustDown(k.j) && time >= this.attackReadyAt && this.stamina >= P.ATTACK.cost) return this.startAttack(time);
    if (JustDown(k.k) && this.stamina >= P.HEAVY.cost) return this.startCharge(time);
    if (JustDown(k.l) && this.abilities.dash && time >= this.dashReadyAt && this.stamina >= this.dashCost) return this.startDash(time);
    this.pState = onGround ? (Math.abs(this.body.velocity.x) > 30 ? S.RUN : S.IDLE) : (this.body.velocity.y < 0 ? S.JUMP : S.FALL);
  }

  get dashCost() { return Math.max(15, P.DASH.cost - 3 * this.dashLevel); }

  /* ---------- Basic attack ---------- */
  startAttack(time) {
    const a = P.ATTACK;
    this.pState = S.ATTACK; this.heavy = false;
    this.attackStart = time; this.hit = { ...a }; this.hitSet = new Set();
    this.attackReadyAt = time + a.cooldown;
    this.spend(a.cost);
    this.setVelocityX(this.body.velocity.x + this.facing * 80);
    this.scene.audio.play('attack');
    this.spawnSlash(1);
  }

  /* ---------- Charged heavy attack: hold K, release to swing ---------- */
  startCharge(time) {
    this.pState = S.HEAVY_ATTACK; this.heavy = true;
    this.charging = true; this.chargeStart = time; this.chargeFrac = 0;
  }

  updateAttack(time, dir, onGround) {
    if (this.heavy) {
      if (this.charging) {
        this.chargeFrac = Math.min(1, (time - this.chargeStart) / P.HEAVY.chargeMax);
        this.move(dir, onGround, 0.3);
        this.setTint(Phaser.Display.Color.GetColor(255, 255 - 120 * this.chargeFrac, 255 - 200 * this.chargeFrac));
        if (!this.keys.k.isDown || this.chargeFrac >= 1) this.releaseHeavy(time);
        return;
      }
      this.move(0, onGround, 0.2);
    } else {
      this.move(dir, onGround, 0.5);
    }
    const cfg = this.hit;
    const t = time - this.attackStart;
    if (t >= cfg.from && t <= cfg.to) this.scene.combat.playerHit(this);
    if (t >= cfg.duration) { this.pState = onGround ? S.IDLE : S.FALL; this.clearTint(); }
  }

  releaseHeavy(time) {
    const h = P.HEAVY;
    this.charging = false;
    this.clearTint();
    this.spend(h.cost);
    this.attackStart = time;
    this.hit = { ...h, dmg: h.dmg + h.bonus * this.chargeFrac };
    this.hitSet = new Set();
    this.scene.audio.play('heavy');
    this.spawnSlash(1.7);
    this.scene.shake(0.004, 80);
  }

  /* ---------- Dash (also an attack) ---------- */
  startDash(time) {
    const d = P.DASH;
    this.pState = S.DASH;
    this.dashEnd = time + d.time + 25 * this.dashLevel;
    this.dashReadyAt = time + Math.max(250, d.cooldown - 60 * this.dashLevel);
    this.spend(this.dashCost);
    this.hit = { ...d }; this.hitSet = new Set();
    this.body.setAllowGravity(false);
    this.body.maxVelocity.x = d.speed;
    this.setAccelerationX(0); this.setDragX(0);
    this.setVelocity(this.facing * d.speed, 0);
    this.invulnUntil = Math.max(this.invulnUntil, this.dashEnd + 80);
    this.scene.audio.play('dash');
  }

  updateDash(time) {
    this.setVelocity(this.facing * P.DASH.speed, 0);
    this.scene.combat.playerHit(this);
    if (Math.floor(time / 30) % 2 === 0) {
      const g = this.scene.add.image(this.x, this.y, 'kael').setFlipX(this.flipX).setTint(0x66ccff).setAlpha(0.5).setDepth(9);
      this.scene.tweens.add({ targets: g, alpha: 0, duration: 250, onComplete: () => g.destroy() });
    }
    if (time >= this.dashEnd) {
      this.body.setAllowGravity(true);
      this.setVelocityX(this.facing * P.MAX_SPEED * 0.6);
      this.pState = S.FALL;
    }
  }

  spend(cost) { this.stamina = Math.max(0, this.stamina - cost); this.staminaDelayUntil = this.scene.time.now + P.STAMINA_DELAY; }

  spawnSlash(scale) {
    const s = this.scene.add.image(this.x + this.facing * 34 * scale, this.y, 'slash').setFlipX(this.facing < 0).setScale(scale).setDepth(11).setAlpha(0.9);
    this.scene.tweens.add({ targets: s, alpha: 0, scale: scale * 1.25, duration: 170, onComplete: () => s.destroy() });
  }

  /* ---------- Damage / death ---------- */
  takeDamage(amount, srcX) {
    const time = this.scene.time.now;
    if (time < this.invulnUntil || this.pState === S.DEAD || this.pState === S.DASH) return false;
    this.hp = Math.max(0, this.hp - amount);
    this.invulnUntil = time + P.INVULN;
    this.stateUntil = time + P.HURT_TIME;
    this.charging = false; this.clearTint();
    this.body.setAllowGravity(true);
    this.pState = S.HURT;
    const dir = this.x < srcX ? -1 : 1;
    this.setAccelerationX(0);
    this.setVelocity(dir * 280, -260);
    this.scene.audio.play('hurt');
    this.scene.shake(0.007, 150);
    this.scene.particles.burst(this.x, this.y, 0xff4060, 10);
    this.scene.combat.damageNumber(this.x, this.y - 30, Math.round(amount), '#ff6b81');
    if (this.hp <= 0) this.die();
    return true;
  }

  /** Falling into a pit: fixed damage, back to the last safe ground. */
  fallDamage() {
    this.hp = Math.max(0, this.hp - 20);
    this.scene.audio.play('hurt');
    if (this.hp <= 0) return this.die();
    this.setVelocity(0, 0);
    this.setPosition(this.safe.x, this.safe.y);
    this.invulnUntil = this.scene.time.now + P.INVULN;
    this.scene.combat.damageNumber(this.x, this.y - 30, 20, '#ff6b81');
  }

  heal(n) { this.hp = Math.min(this.maxHp, this.hp + n); }

  die() {
    if (this.pState === S.DEAD) return;
    this.pState = S.DEAD;
    this.setAccelerationX(0); this.setVelocity(0, -200);
    this.clearTint(); this.setAlpha(1);
    this.scene.tweens.add({ targets: this, angle: this.facing * 90, alpha: 0.4, duration: 600 });
    this.scene.onPlayerDeath();
  }
}
