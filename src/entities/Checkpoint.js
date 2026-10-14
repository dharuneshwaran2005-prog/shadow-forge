import Phaser from 'phaser';

/** A shrine that saves progress, restores health and sets the respawn point. */
export class Checkpoint extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'checkpoint');
    scene.add.existing(this);
    this.setDepth(3);
    this.activated = false;
    this.glow = scene.add.image(x, y - 22, 'glow').setTint(0x66f0ff).setBlendMode(Phaser.BlendModes.ADD).setScale(0.1).setAlpha(0).setDepth(3);
  }

  activate() {
    if (this.activated) return;
    this.activated = true;
    this.setTexture('checkpoint_on');
    this.glow.setAlpha(0.8).setScale(2.2);
    this.scene.tweens.add({ targets: this.glow, alpha: 0.4, scale: 2.6, duration: 900, yoyo: true, repeat: -1 });
  }

  deactivate() { this.activated = false; this.setTexture('checkpoint'); this.glow.setAlpha(0); }
}
