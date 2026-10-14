import Phaser from 'phaser';
import { BOSS_TYPES } from '../utils/Constants.js';

const Rect = Phaser.Geom.Rectangle;

/**
 * Boss used for both the Gear Brute (mini-boss) and THE IRON WARDEN (3 phases).
 * Modes: INTRO -> IDLE -> TELEGRAPH -> ACTION -> RECOVER -> IDLE ... -> dead.
 * Every attack shows a red telegraph zone before it hits.
 */
export class Boss extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, variant, x, y, arena) {
    const cfg = BOSS_TYPES[variant];
    super(scene, x, y, cfg.texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.cfg = cfg; this.variant = variant; this.arena = arena;
    this.maxHp = this.hp = cfg.hp;
    this.phase = 1; this.speedScale = 1;
    this.mode = 'INTRO'; this.modeUntil = scene.time.now + 2400;
    this.dead = false; this.facing = -1; this.atkIdx = 0; this.nextAttackAt = 0;
    this.telegraphs = [];
    this.setDepth(9);
    this.body.setSize(cfg.w, cfg.h);
  }

  update(time, delta, player) {
    if (this.dead) return;
    const dx = player.x - this.x;
    if (this.mode === 'IDLE' || this.mode === 'INTRO') this.facing = dx >= 0 ? 1 : -1;
    this.setFlipX(this.facing < 0);
    switch (this.mode) {
      case 'INTRO':
        this.setVelocityX(0);
        if (time >= this.modeUntil) { this.mode = 'IDLE'; this.nextAttackAt = time + 700; }
        break;
      case 'IDLE':
        this.setVelocityX(Math.abs(dx) > 150 ? Math.sign(dx) * this.cfg.speed * this.speedScale : 0);
        if (time >= this.nextAttackAt) this.beginAttack(time, player);
        break;
      case 'TELEGRAPH':
        this.setVelocityX(0);
        if (time >= this.modeUntil) this.execute(time, player);
        break;
      case 'ACTION': this.updateAction(time); break;
      case 'RECOVER':
        this.setVelocityX(0);
        if (time >= this.modeUntil) { this.mode = 'IDLE'; this.nextAttackAt = time + this.cfg.cooldown / this.speedScale; }
        break;
      default: break;
    }
  }

  /* ---------- Attack selection + telegraphs ---------- */
  beginAttack(time, player) {
    const list = this.cfg.patterns[this.phase];
    this.attack = list[this.atkIdx++ % list.length];
    const s = this.speedScale;
    this.mode = 'TELEGRAPH';
    switch (this.attack) {
      case 'sword':
        this.swordRect = this.swordZone();
        this.addTele(this.swordRect);
        this.modeUntil = time + 700 / s; break;
      case 'slam':
        this.setTintFill(0xffaa55); this.scene.time.delayedCall(150, () => this.active && this.clearTint());
        this.addTele(new Rect(this.x - 60, this.y + this.cfg.h / 2 - 12, 120, 12));
        this.modeUntil = time + 600 / s; break;
      case 'summon': this.setTint(0xaa66ff); this.modeUntil = time + 700 / s; break;
      case 'projectiles': this.setTint(0xff5533); this.modeUntil = time + 550 / s; break;
      case 'special': {
        const a = this.arena;
        this.columns = [-300, 0, 300].map((o) => Phaser.Math.Clamp(player.x + o, a.left + 80, a.right - 80)).map((cx) => new Rect(cx - 70, 0, 140, 720));
        this.columns.forEach((r) => this.addTele(r));
        this.setTint(0xffdd33);
        this.modeUntil = time + 1300; break;
      }
      default: this.modeUntil = time + 500;
    }
  }

  swordZone() {
    const reach = 150, h = 120;
    const x0 = this.facing > 0 ? this.x + this.cfg.w / 2 - 20 : this.x - this.cfg.w / 2 + 20 - reach;
    return new Rect(x0, this.y - h / 2, reach, h);
  }

  addTele(r) {
    const g = this.scene.add.rectangle(r.x + r.width / 2, r.y + r.height / 2, r.width, r.height, 0xff2233, 0.3).setDepth(7);
    this.scene.tweens.add({ targets: g, alpha: 0.65, duration: 120, yoyo: true, repeat: -1 });
    this.telegraphs.push(g);
  }
  clearTele() { this.telegraphs.forEach((g) => g.destroy()); this.telegraphs = []; this.clearTint(); }

  /* ---------- Execution ---------- */
  execute(time, player) {
    this.clearTele();
    const s = this.scene, d = this.cfg.dmg;
    switch (this.attack) {
      case 'sword':
        this.flash(this.swordRect, 0xffffff);
        if (Rect.Overlaps(this.swordRect, player.getBounds())) player.takeDamage(d.sword, this.x);
        s.shake(0.008, 120);
        this.setVelocityX(this.facing * 320);
        this.mode = 'ACTION'; this.actionUntil = time + 250; break;
      case 'slam':
        this.setVelocity(Phaser.Math.Clamp(player.x - this.x, -300, 300), -720);
        this.mode = 'ACTION'; this.actionMinAt = time + 250; break;
      case 'summon': {
        let n = 0;
        for (const [type, off] of [['flying_wisp', -260], ['mech_spider', 260]]) {
          if (s.enemies.countActive(true) >= 4) break;
          const x = Phaser.Math.Clamp(this.x + off, this.arena.left + 60, this.arena.right - 60);
          s.spawnEnemy(type, x, this.y - 40, 300, [this.arena.left + 40, this.arena.right - 40]); n++;
        }
        s.particles.explosion(this.x, this.y - 40, 0xaa66ff);
        s.audio.play('boss');
        this.recover(time, 900); break;
      }
      case 'projectiles': {
        const base = Math.atan2(player.y - this.y, player.x - this.x);
        for (let i = -2; i <= 2; i++) {
          const a = base + i * 0.22;
          s.spawnProjectile(this.x, this.y - 10, Math.cos(a) * 330, Math.sin(a) * 330, d.proj, 0xff4466, 3000);
        }
        s.audio.play('attack');
        this.recover(time, 700); break;
      }
      case 'special':
        this.columns.forEach((r) => {
          this.flash(r, 0xffee88);
          if (Rect.Overlaps(r, player.getBounds())) player.takeDamage(d.special, r.x + r.width / 2);
        });
        s.shake(0.014, 250); s.audio.play('heavy');
        this.recover(time, 900); break;
      default: this.recover(time, 500);
    }
  }

  updateAction(time) {
    if (this.attack === 'sword' && time >= this.actionUntil) this.recover(time, 500);
    else if (this.attack === 'slam' && time >= this.actionMinAt && this.body.blocked.down) {
      const s = this.scene, y = this.y + this.cfg.h / 2 - 14;
      s.spawnProjectile(this.x - 30, y, -340, 0, this.cfg.dmg.slam, 0xffd166, 1700, 'wave');
      s.spawnProjectile(this.x + 30, y, 340, 0, this.cfg.dmg.slam, 0xffd166, 1700, 'wave');
      s.shake(0.012, 200); s.audio.play('heavy'); s.particles.burst(this.x, y, 0xcccccc, 14, 240);
      this.recover(time, 700);
    }
  }

  recover(time, ms) { this.mode = 'RECOVER'; this.modeUntil = time + ms / this.speedScale; this.clearTint(); }

  flash(r, color) {
    const f = this.scene.add.rectangle(r.x + r.width / 2, r.y + r.height / 2, r.width, r.height, color, 0.8).setDepth(12);
    this.scene.tweens.add({ targets: f, alpha: 0, duration: 220, onComplete: () => f.destroy() });
  }

  /* ---------- Damage / phases / death ---------- */
  takeHit(dmg) {
    if (this.dead || this.mode === 'INTRO') return false;
    this.hp = Math.max(0, this.hp - dmg);
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(60, () => this.active && this.mode !== 'TELEGRAPH' && this.clearTint());
    if (this.hp <= 0) { this.die(); return true; }
    const ratio = this.hp / this.maxHp;
    const phase = this.cfg.phases === 3 ? (ratio > 0.66 ? 1 : ratio > 0.33 ? 2 : 3) : 1;
    if (phase > this.phase) {
      this.phase = phase;
      this.speedScale = 1 + 0.3 * (phase - 1);
      this.scene.audio.play('boss');
      this.scene.shake(0.015, 400);
      this.scene.toast(`PHASE ${phase}`, '#ff6b6b');
      this.scene.particles.explosion(this.x, this.y, 0xff3355);
    }
    return true;
  }

  die() {
    this.dead = true;
    this.clearTele();
    this.body.enable = false;
    this.setVelocity(0, 0);
    this.scene.onBossDefeated(this);
    this.scene.tweens.add({ targets: this, alpha: 0, scaleY: 0.6, duration: 2200, onComplete: () => this.destroy() });
  }
}
