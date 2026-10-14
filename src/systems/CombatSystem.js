import Phaser from 'phaser';
import { AI_STATE } from '../utils/Constants.js';

/** Hit detection between the player's attacks and enemies/bosses, plus feedback (numbers, effects). */
export class CombatSystem {
  constructor(scene) { this.scene = scene; }

  targets() {
    const list = this.scene.enemies.getChildren().filter((e) => e.active && e.ai !== AI_STATE.DEAD);
    const b = this.scene.boss;
    if (b && !b.dead) list.push(b);
    return list;
  }

  /** Check the player's current attack rectangle (p.hit) against all targets, once per target per swing. */
  playerHit(p) {
    const h = p.hit;
    if (!h) return;
    const rect = new Phaser.Geom.Rectangle(p.facing > 0 ? p.x + 6 : p.x - 6 - h.reach, p.y - h.h / 2, h.reach, h.h);
    for (const t of this.targets()) {
      if (p.hitSet.has(t)) continue;
      if (!Phaser.Geom.Intersects.RectangleToRectangle(rect, t.getBounds())) continue;
      p.hitSet.add(t);
      const dmg = h.dmg * p.dmgMult;
      if (t.takeHit(dmg, p.facing * h.kb, h.kbY, this.scene.time.now) === false) continue;
      this.damageNumber(t.x, t.y - t.height / 2, Math.round(dmg), '#ffe08a');
      this.scene.particles.burst(t.x, t.y, 0xffd166, 9);
      this.scene.audio.play('hit');
      this.scene.shake(h.shake, 90);
    }
  }

  damageNumber(x, y, value, color = '#ffffff') {
    const t = this.scene.add.text(x, y, String(value), { fontFamily: 'Georgia, serif', fontSize: '22px', fontStyle: 'bold', color, stroke: '#000', strokeThickness: 4 })
      .setOrigin(0.5).setDepth(60);
    this.scene.tweens.add({ targets: t, y: y - 50, alpha: 0, duration: 700, ease: 'Cubic.easeOut', onComplete: () => t.destroy() });
  }
}
