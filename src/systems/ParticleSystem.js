import Phaser from 'phaser';

/** Lightweight particles built from tweened rectangles (independent of Phaser's emitter API version). */
export class ParticleSystem {
  constructor(scene) { this.scene = scene; }

  burst(x, y, color = 0xffffff, count = 8, speed = 180, life = 420) {
    for (let i = 0; i < count; i++) {
      const p = this.scene.add.rectangle(x, y, 4, 4, color).setDepth(50);
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.4 + Math.random() * 0.6) * (life / 1000);
      this.scene.tweens.add({
        targets: p, x: x + Math.cos(a) * s, y: y + Math.sin(a) * s + 18, alpha: 0, scale: 0.2,
        duration: life, ease: 'Quad.easeOut', onComplete: () => p.destroy(),
      });
    }
  }

  dust(x, y) { this.burst(x, y, 0x9a9aaa, 4, 70, 300); }
  explosion(x, y, color = 0xff8a3d) { this.burst(x, y, color, 22, 360, 700); this.burst(x, y, 0xffffff, 8, 200, 400); }

  /** Drifting fog banks (camera-relative, so they stay on screen). */
  fog(count = 7, tint = 0x8899aa) {
    for (let i = 0; i < count; i++) {
      const f = this.scene.add.image(Math.random() * 1280, 380 + Math.random() * 300, 'fog')
        .setScrollFactor(0).setDepth(4).setAlpha(0.12 + Math.random() * 0.1).setTint(tint).setScale(1.5 + Math.random() * 1.5);
      this.scene.tweens.add({ targets: f, x: f.x + Phaser.Math.Between(-200, 200), duration: 9000 + Math.random() * 6000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }
}
