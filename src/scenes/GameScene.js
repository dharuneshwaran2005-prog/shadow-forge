import Phaser from 'phaser';
import { GAME_W, GAME_H, GROUND_Y, THEMES, AI_STATE, PLAYER_STATE, ENEMY_TYPES } from '../utils/Constants.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { ParticleSystem } from '../systems/ParticleSystem.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { Boss } from '../entities/Boss.js';
import { Checkpoint } from '../entities/Checkpoint.js';
import { textStyle } from '../utils/UI.js';

const { JustDown } = Phaser.Input.Keyboard;
/** Helper for level data: a horizontal row of pickups. */
export const row = (type, x, y, n, step = 40) => Array.from({ length: n }, (_, i) => [type, x + i * step, y]);

/**
 * Base class for all levels. A level scene only overrides getLevelData(); everything else
 * (terrain, enemies, pickups, hazards, HUD, bosses, checkpoints, save) lives here.
 */
export class GameScene extends Phaser.Scene {
  getLevelData() { throw new Error('Level scenes must implement getLevelData()'); }

  create() {
    this.L = this.getLevelData();
    this.th = this.L.theme;
    this.audio = this.registry.get('audio');
    this.settings = SaveSystem.loadSettings();
    this.save = SaveSystem.load();
    if (this.save.level !== this.L.id) { this.save.level = this.L.id; this.save.checkpoint = null; SaveSystem.save(this.save); }
    this.ended = false; this.miniDone = false; this.bossStarted = false; this.boss = null;
    this.riding = null; this.escLock = 0; this.walls = [];

    this.physics.world.setBounds(0, -400, this.L.width, GAME_H + 700);
    this.physics.world.setBoundsCollision(true, true, false, false);
    this.particles = new ParticleSystem(this);
    this.combat = new CombatSystem(this);
    this.surfaces = [];
    this.hazards = [];

    this.buildBackground();
    this.buildTerrain();
    this.buildPickups();
    this.buildCheckpoints();
    this.buildHazards();
    this.projectiles = this.physics.add.group({ allowGravity: false });
    this.enemies = this.physics.add.group();
    this.buildPlayer();
    this.buildEnemies();
    this.buildColliders();
    this.buildExit();
    this.buildCamera();
    this.buildHUD();
    (this.L.hints || []).forEach(([x, t]) => this.add.text(x, 380, t, { ...textStyle(22, '#ffe9a8'), align: 'center' }).setOrigin(0.5).setDepth(5).setAlpha(0.9));
    this.audio.playMusic('music_level');
    this.events.on('resume', () => { this.escLock = 4; });
    this.toast(this.L.name, '#ffd166', 2200);
  }

  /* ================= Level construction ================= */
  buildBackground() {
    const t = THEMES[this.th];
    const mk = (key) => this.add.tileSprite(0, 0, GAME_W, GAME_H, key).setOrigin(0).setScrollFactor(0);
    this.bgFar = mk(`bgfar${this.th}`).setDepth(-30);
    this.bgMid = mk(`bgmid${this.th}`).setDepth(-20).setAlpha(0.9);
    this.particles.fog(7, t.accent);
    this.add.image(GAME_W / 2, GAME_H / 2, 'vignette').setScrollFactor(0).setDepth(90);
    this.playerLight = this.add.image(0, 0, 'glow').setTint(0xaaccff).setBlendMode(Phaser.BlendModes.ADD).setScale(5).setAlpha(0.2).setDepth(1);
    // Glowing ambient crystals / lamps scattered along the level.
    for (let x = 300; x < this.L.width; x += 520) {
      const g = this.add.image(x + Math.random() * 120, 140 + Math.random() * 120, 'glow').setTint(t.accent).setBlendMode(Phaser.BlendModes.ADD).setScale(2.5).setAlpha(0.25).setDepth(-5).setScrollFactor(0.8);
      this.tweens.add({ targets: g, alpha: 0.5, duration: 1200 + Math.random() * 1500, yoyo: true, repeat: -1 });
    }
  }

  buildTerrain() {
    this.solids = this.physics.add.staticGroup();
    this.movers = this.physics.add.group({ allowGravity: false, immovable: true });
    const n = this.th;
    for (const [a, b] of this.L.ground) {
      const ts = this.add.tileSprite((a + b) / 2, GROUND_Y + 60, b - a, 120, `ground${n}`).setDepth(2);
      this.solids.add(ts);
      this.surfaces.push({ a, b, top: GROUND_Y });
    }
    for (const [x, y, w] of this.L.platforms || []) {
      const ts = this.add.tileSprite(x + w / 2, y + 12, w, 24, `plat${n}`).setDepth(2);
      this.solids.add(ts);
      this.surfaces.push({ a: x, b: x + w, top: y });
    }
    for (const m of this.L.movers || []) {
      const ts = this.add.tileSprite(m.x + m.w / 2, m.y + 12, m.w, 24, `plat${n}`).setDepth(2).setTint(0xcfd8ff);
      this.physics.add.existing(ts);
      this.movers.add(ts);
      ts.body.setImmovable(true).setAllowGravity(false);
      const x0 = m.x + m.w / 2, y0 = m.y + 12;
      ts.mv = { x0, y0, x1: x0 + (m.dx || 0), y1: y0 + (m.dy || 0), speed: m.speed };
      ts.mv.toEnd = true;
    }
  }

  buildHazards() {
    for (const [x, y, w] of this.L.spikes || []) {
      const s = this.add.tileSprite(x + w / 2, y + 8, w, 16, 'spikesTex').setDepth(3);
      this.hazards.push({ obj: s, dmg: 15, rect: () => s.getBounds() });
    }
    for (const s of this.L.saws || []) {
      const saw = this.add.image(s.x, s.y1, 'saw').setDepth(3);
      this.tweens.add({ targets: saw, y: s.y2, duration: s.dur, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: saw, angle: 360, duration: 500, repeat: -1 });
      this.add.rectangle(s.x, (s.y1 + s.y2) / 2, 4, Math.abs(s.y2 - s.y1), 0x333344).setDepth(1);
      this.hazards.push({ obj: saw, dmg: 18, rect: () => new Phaser.Geom.Rectangle(saw.x - 18, saw.y - 18, 36, 36) });
    }
    if (this.L.stalactites) {
      this.stalactites = this.physics.add.group();
      this.time.addEvent({ delay: this.L.stalactites.interval, loop: true, callback: () => this.dropStalactite() });
    }
  }

  dropStalactite() {
    if (this.ended || !this.player) return;
    const near = this.L.stalactites.xs.filter((x) => Math.abs(x - this.player.x) < 650);
    if (!near.length) return;
    const x = Phaser.Utils.Array.GetRandom(near);
    const warn = this.add.image(x, 10, 'stalactite').setScale(0.5).setDepth(6).setTint(0xffaaaa);
    this.tweens.add({ targets: warn, x: x + 3, duration: 40, yoyo: true, repeat: 10 });
    this.time.delayedCall(550, () => {
      warn.destroy();
      const s = this.stalactites.create(x, 20, 'stalactite').setDepth(6);
      s.body.setSize(16, 48); s.setVelocityY(0);
      this.physics.add.collider(s, this.solids, () => { this.particles.burst(s.x, s.y + 28, 0xaee6ff, 10); s.destroy(); });
      this.physics.add.overlap(this.player, s, () => { if (s.active && this.player.takeDamage(18, s.x)) { s.destroy(); } });
    });
  }

  buildPickups() {
    this.pickups = this.physics.add.group({ allowGravity: false });
    (this.L.pickups || []).forEach(([type, x, y, extra], i) => {
      const id = `${this.L.id}:${i}`;
      if (this.save.collected.includes(id) && (type === 'upgrade' || type === 'rune')) return;
      if (this.save.collected.includes(id)) return;
      this.addPickup(type, x, y, extra, id);
    });
  }

  addPickup(type, x, y, extra, id = null) {
    const key = type === 'health' ? 'heart' : type;
    const p = this.pickups.create(x, y, key).setDepth(6);
    p.body.setAllowGravity(false);
    p.kind = type; p.extra = extra; p.pid = id;
    this.tweens.add({ targets: p, y: y - 6, duration: 700 + Math.random() * 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    if (type !== 'coin') {
      const col = { crystal: 0x2ad4ff, upgrade: 0xb36bff, rune: 0xffd166, health: 0xff3355 }[type];
      p.glow = this.add.image(x, y, 'glow').setTint(col).setBlendMode(Phaser.BlendModes.ADD).setScale(type === 'upgrade' || type === 'rune' ? 2.4 : 1.4).setAlpha(0.5).setDepth(5);
      this.tweens.add({ targets: p.glow, alpha: 0.9, duration: 800, yoyo: true, repeat: -1 });
    }
    return p;
  }

  buildCheckpoints() {
    this.checkpoints = this.physics.add.staticGroup();
    this.cpList = [];
    (this.L.checkpoints || []).forEach(([x]) => {
      const cp = new Checkpoint(this, x, GROUND_Y - 32);
      this.checkpoints.add(cp);
      cp.cpx = x;
      this.cpList.push(cp);
    });
  }

  buildPlayer() {
    const cp = this.save.checkpoint && this.save.checkpoint.level === this.L.id ? this.save.checkpoint : null;
    const sp = cp ? { x: cp.x, y: GROUND_Y - 60 } : this.L.spawn;
    this.player = new Player(this, sp.x, sp.y, this.save);
    if (cp) this.cpList.forEach((c) => { if (Math.abs(c.cpx - cp.x) < 2) c.activate(); });
  }

  buildEnemies() { (this.L.enemies || []).forEach(([type, x, y, range]) => this.spawnEnemy(type, x, y, range)); }

  /** Spawns an enemy; ground enemies are clamped to the surface they stand on so they never walk off edges. */
  spawnEnemy(type, x, y, range = 150, bounds = null) {
    const cfg = ENEMY_TYPES[type];
    let minX = x - range, maxX = x + range;
    if (!cfg.flying && !bounds) {
      const s = this.surfaces.filter((f) => x >= f.a && x <= f.b && f.top >= y - 20).sort((p, q) => p.top - q.top)[0];
      if (s) { minX = Math.max(minX, s.a + 24); maxX = Math.min(maxX, s.b - 24); }
    }
    if (bounds) [minX, maxX] = bounds;
    const e = new Enemy(this, type, x, y, minX, maxX);
    this.enemies.add(e);
    e.initBody();
    return e;
  }

  buildColliders() {
    const p = this.player;
    this.physics.add.collider(p, this.solids);
    this.physics.add.collider(p, this.movers, (pl, m) => { if (pl.body.touching.down && m.body.touching.up) this.riding = m; });
    this.physics.add.collider(this.enemies, this.solids);
    this.physics.add.collider(this.enemies, this.movers);
    this.physics.add.overlap(p, this.enemies, (pl, e) => { if (e.ai !== AI_STATE.DEAD && e.ai !== AI_STATE.HURT) pl.takeDamage(e.cfg.dmg, e.x); });
    this.physics.add.overlap(p, this.pickups, (pl, pk) => this.collect(pk));
    this.physics.add.overlap(p, this.checkpoints, (pl, cp) => this.activateCheckpoint(cp));
    this.physics.add.overlap(p, this.projectiles, (pl, pr) => { if (pl.takeDamage(pr.dmg, pr.x)) { this.particles.burst(pr.x, pr.y, pr.tintTopLeft, 6); pr.destroy(); } });
  }

  buildExit() {
    const e = this.L.exit;
    if (!e) return;
    this.exit = this.add.image(e.x, GROUND_Y - 50, 'portal').setDepth(4);
    this.exitGlow = this.add.image(e.x, GROUND_Y - 50, 'glow').setTint(0xb7a8ff).setBlendMode(Phaser.BlendModes.ADD).setScale(5).setAlpha(0.4).setDepth(3);
    this.tweens.add({ targets: [this.exit, this.exitGlow], alpha: { from: 0.6, to: 1 }, duration: 900, yoyo: true, repeat: -1 });
    this.exitPrompt = this.add.text(e.x, GROUND_Y - 130, 'Press E', textStyle(22, '#ffffff')).setOrigin(0.5).setDepth(6).setVisible(false);
  }

  buildCamera() {
    const cam = this.cameras.main;
    cam.setBounds(0, 0, this.L.width, GAME_H);
    cam.startFollow(this.player, true, 0.1, 0.1);
    cam.setDeadzone(80, 40);
    cam.fadeIn(500);
  }

  /* ================= HUD ================= */
  buildHUD() {
    const sf = (o) => o.setScrollFactor(0).setDepth(100);
    sf(this.add.rectangle(18, 18, 308, 30, 0x000000, 0.6).setOrigin(0).setStrokeStyle(2, 0x6a5acd));
    this.hpFill = sf(this.add.rectangle(22, 22, 300, 22, 0xd9304f).setOrigin(0));
    this.hpText = sf(this.add.text(30, 22, '', textStyle(16, '#ffffff')));
    sf(this.add.rectangle(18, 54, 258, 20, 0x000000, 0.6).setOrigin(0).setStrokeStyle(2, 0x6a5acd));
    this.stFill = sf(this.add.rectangle(22, 58, 250, 12, 0x3ad17a).setOrigin(0));
    sf(this.add.image(GAME_W - 190, 34, 'coin').setScale(1.6));
    this.coinText = sf(this.add.text(GAME_W - 168, 18, '', textStyle(26, '#ffd23f')));
    sf(this.add.image(GAME_W - 90, 34, 'crystal').setScale(1.3));
    this.crystalText = sf(this.add.text(GAME_W - 70, 18, '', textStyle(26, '#6ae3ff')));
    this.zoneText = sf(this.add.text(GAME_W / 2, 18, this.L.name, textStyle(18, '#8a8fb5')).setOrigin(0.5, 0));
    // Ability indicators (bottom centre)
    this.slots = [['J', 'Slash', -150], ['K', 'Heavy', -50], ['L', 'Dash', 50], ['SPC', 'Jump x2', 150]].map(([k, name, ox]) => {
      const x = GAME_W / 2 + ox, y = GAME_H - 48;
      sf(this.add.rectangle(x, y, 80, 56, 0x0c0a1c, 0.8).setStrokeStyle(2, 0x6a5acd));
      sf(this.add.text(x, y - 8, k, textStyle(20, '#ffd166')).setOrigin(0.5));
      sf(this.add.text(x, y + 14, name, textStyle(13, '#b7bce0')).setOrigin(0.5));
      return sf(this.add.rectangle(x - 40, y + 28, 80, 56, 0x000000, 0.65).setOrigin(0, 1).setVisible(false));
    });
    this.chargeBar = sf(this.add.rectangle(GAME_W / 2 - 40, GAME_H - 82, 0, 6, 0xffaa33).setOrigin(0, 0.5));
    // Boss bar
    this.bossUI = [
      sf(this.add.rectangle(GAME_W / 2, 90, 604, 26, 0x000000, 0.75).setStrokeStyle(3, 0xff4d6d)),
      this.bossFill = sf(this.add.rectangle(GAME_W / 2 - 300, 90, 600, 20, 0xc41e3a).setOrigin(0, 0.5)),
      this.bossName = sf(this.add.text(GAME_W / 2, 62, '', textStyle(24, '#ff9aa8')).setOrigin(0.5)),
    ];
    this.bossUI.forEach((o) => o.setVisible(false));
    this.toastText = sf(this.add.text(GAME_W / 2, 150, '', textStyle(34, '#ffd166')).setOrigin(0.5).setAlpha(0));
  }

  toast(msg, color = '#ffd166', dur = 1600) {
    this.toastText.setText(msg).setColor(color).setAlpha(1);
    this.tweens.killTweensOf(this.toastText);
    this.tweens.add({ targets: this.toastText, alpha: 0, delay: dur, duration: 500 });
  }

  updateHUD(time) {
    const p = this.player;
    this.hpFill.width = 300 * (p.hp / p.maxHp);
    this.hpText.setText(`${Math.ceil(p.hp)} / ${p.maxHp}`);
    this.stFill.width = 250 * (p.stamina / p.maxStamina);
    this.coinText.setText(this.save.coins);
    this.crystalText.setText(this.save.crystals);
    const cd = (ready, locked) => (locked ? 56 : ready ? 0 : 56);
    const [j, k, l, dj] = this.slots;
    j.setVisible(true).height = cd(time >= p.attackReadyAt && p.stamina >= 8);
    k.setVisible(true).height = cd(p.stamina >= 25);
    l.setVisible(true).height = cd(p.abilities.dash && time >= p.dashReadyAt && p.stamina >= p.dashCost, !p.abilities.dash);
    dj.setVisible(true).height = p.abilities.doubleJump ? 0 : 56;
    this.chargeBar.width = p.charging ? 80 * p.chargeFrac : 0;
    if (this.boss && !this.boss.dead) this.bossFill.width = 600 * (this.boss.hp / this.boss.maxHp);
  }

  /* ================= Frame loop ================= */
  update(time, delta) {
    if (this.escLock > 0) this.escLock--;
    else if (!this.ended && JustDown(this.player.keys.esc)) { this.pauseGame(); return; }

    this.player.update(time, delta);
    if (this.riding && this.player.body.touching.down) {
      this.player.x += this.riding.body.deltaX();
      if (this.riding.body.deltaY() > 0) this.player.y += this.riding.body.deltaY();
    }
    this.riding = null;
    this.movers.getChildren().forEach((m) => this.updateMover(m));
    this.enemies.getChildren().slice().forEach((e) => e.update(time, delta, this.player));
    if (this.boss) this.boss.update(time, delta, this.player);

    this.bgFar.tilePositionX = this.cameras.main.scrollX * 0.08;
    this.bgMid.tilePositionX = this.cameras.main.scrollX * 0.3;
    this.playerLight.setPosition(this.player.x, this.player.y);

    if (this.player.pState !== PLAYER_STATE.DEAD) {
      this.checkHazards();
      if (this.player.y > GAME_H + 60) this.player.fallDamage();
      this.checkBossTrigger();
      this.checkExit();
    }
    this.updateHUD(time);
  }

  updateMover(m) {
    const v = m.mv, tx = v.toEnd ? v.x1 : v.x0, ty = v.toEnd ? v.y1 : v.y0;
    const dx = tx - m.x, dy = ty - m.y, dist = Math.hypot(dx, dy);
    if (dist < 4) { v.toEnd = !v.toEnd; m.body.setVelocity(0, 0); return; }
    m.body.setVelocity((dx / dist) * v.speed, (dy / dist) * v.speed);
  }

  checkHazards() {
    const pb = this.player.getBounds();
    Phaser.Geom.Rectangle.Inflate(pb, -8, -4);
    for (const h of this.hazards) {
      if (Phaser.Geom.Intersects.RectangleToRectangle(pb, h.rect())) this.player.takeDamage(h.dmg, h.obj.x);
    }
  }

  checkExit() {
    if (!this.exit) return;
    const near = Math.abs(this.player.x - this.exit.x) < 70;
    this.exitPrompt.setVisible(near);
    if (near && JustDown(this.player.keys.e)) {
      if (this.L.exit.needsMiniBoss && !this.miniDone) { this.toast('The gate is sealed by the guardian...', '#ff9aa8'); return; }
      this.nextLevel();
    }
  }

  nextLevel() {
    this.ended = true;
    this.save.level = this.L.id + 1;
    this.save.checkpoint = null;
    SaveSystem.save(this.save);
    this.audio.play('checkpoint');
    this.cameras.main.fadeOut(600);
    this.time.delayedCall(650, () => this.scene.start(`Level${this.L.id + 1}Scene`));
  }

  pauseGame() {
    this.scene.launch('PauseScene', { from: this.scene.key });
    this.scene.pause();
  }

  /* ================= Gameplay events ================= */
  shake(strength = 0.005, dur = 100) { if (this.settings.shake) this.cameras.main.shake(dur, strength); }

  spawnProjectile(x, y, vx, vy, dmg, color = 0xff6a00, life = 2500, tex = 'orb') {
    const p = this.projectiles.create(x, y, tex).setDepth(8).setTint(color);
    p.body.setAllowGravity(false);
    p.setVelocity(vx, vy);
    p.dmg = dmg;
    if (tex === 'wave') p.setFlipX(vx < 0);
    this.time.delayedCall(life, () => p.active && p.destroy());
    return p;
  }

  collect(pk) {
    if (!pk.active) return;
    const p = this.player;
    this.audio.play('pickup');
    this.particles.burst(pk.x, pk.y, 0xffffff, 6, 120, 300);
    switch (pk.kind) {
      case 'coin': this.save.coins++; break;
      case 'crystal': this.save.crystals++; p.stamina = Math.min(p.maxStamina, p.stamina + 30); break;
      case 'health': p.heal(30); this.combat.damageNumber(p.x, p.y - 30, '+30', '#6dff9c'); break;
      case 'upgrade': this.applyUpgrade(pk.extra); break;
      case 'rune': this.applyRune(pk.extra); break;
      default: break;
    }
    if (pk.pid) this.save.collected.push(pk.pid);
    if (pk.kind === 'upgrade' || pk.kind === 'rune') SaveSystem.save(this.save);
    pk.glow?.destroy();
    pk.destroy();
  }

  applyUpgrade(kind) {
    const s = this.save.stats, p = this.player;
    if (kind === 'hp') { s.maxHp += 20; this.toast('MAX HEALTH UP!', '#ff6b81'); }
    if (kind === 'dmg') { s.dmgLevel++; this.toast('ATTACK DAMAGE UP!', '#ffb347'); }
    if (kind === 'stamina') { s.staminaLevel++; this.toast('STAMINA UP!', '#6dff9c'); }
    if (kind === 'dash') { s.dashLevel++; this.toast('DASH IMPROVED!', '#6ae3ff'); }
    p.applySave(this.save);
    p.hp = p.maxHp; p.stamina = p.maxStamina;
  }

  applyRune(kind) {
    this.save.abilities[kind] = true;
    this.player.applySave(this.save);
    this.toast(kind === 'doubleJump' ? 'DOUBLE JUMP UNLOCKED!  (press jump in mid-air)' : 'DASH UNLOCKED!  (press L)', '#ffd166', 2600);
    this.shake(0.006, 150);
  }

  activateCheckpoint(cp) {
    if (cp.activated || this.player.pState === PLAYER_STATE.DEAD) return;
    this.cpList.forEach((c) => c.deactivate());
    cp.activate();
    this.player.hp = this.player.maxHp;
    this.player.stamina = this.player.maxStamina;
    this.save.checkpoint = { level: this.L.id, x: cp.cpx };
    SaveSystem.save(this.save);
    this.audio.play('checkpoint');
    this.particles.burst(cp.x, cp.y - 20, 0x66f0ff, 16, 200, 600);
    this.toast('CHECKPOINT  -  progress saved', '#66f0ff');
  }

  onEnemyKilled(e) {
    const n = e.cfg.coins;
    for (let i = 0; i < n; i++) this.addPickup('coin', e.x + (i - n / 2) * 14, e.y - 10);
    if (Math.random() < 0.2) this.addPickup('health', e.x, e.y - 20);
    if (Math.random() < 0.25) this.addPickup('crystal', e.x + 10, e.y - 20);
  }

  onPlayerDeath() {
    this.ended = true;
    this.shake(0.012, 300);
    this.time.delayedCall(1300, () => {
      this.cameras.main.fadeOut(400);
      this.time.delayedCall(450, () => this.scene.start('GameOverScene', { mode: 'gameover', level: this.L.id }));
    });
  }

  /* ================= Boss encounters ================= */
  checkBossTrigger() {
    const b = this.L.boss;
    if (b && !this.bossStarted && this.player.x > b.triggerX) this.startBossFight();
  }

  startBossFight() {
    const b = this.L.boss;
    this.bossStarted = true;
    this.arena = { left: b.arenaLeft, right: b.arenaRight };
    this.cameras.main.setBounds(b.arenaLeft, 0, b.arenaRight - b.arenaLeft, GAME_H);
    for (const x of [b.arenaLeft - 20, b.arenaRight + 20]) {
      const w = this.add.rectangle(x, GAME_H / 2, 40, GAME_H * 2, 0x6a5acd, 0.0);
      this.solids.add(w);
      this.walls.push(w);
    }
    this.boss = new Boss(this, b.variant, b.x, b.y, this.arena);
    this.physics.add.collider(this.boss, this.solids);
    this.physics.add.overlap(this.player, this.boss, () => { if (!this.boss.dead && this.boss.mode !== 'INTRO') this.player.takeDamage(this.boss.cfg.contact, this.boss.x); });
    this.bossUI.forEach((o) => o.setVisible(true));
    this.bossName.setText(this.boss.cfg.name);
    this.audio.playMusic('music_boss');
    this.audio.play('boss');
    this.shake(0.01, 600);
    const t = this.add.text(GAME_W / 2, GAME_H / 2 - 40, this.boss.cfg.name, { ...textStyle(76, '#ff4d6d'), strokeThickness: 8 }).setOrigin(0.5).setScrollFactor(0).setDepth(120).setAlpha(0);
    this.tweens.add({ targets: t, alpha: 1, scale: { from: 1.4, to: 1 }, duration: 600, hold: 1300, yoyo: true, onComplete: () => t.destroy() });
  }

  onBossDefeated(boss) {
    this.bossUI.forEach((o) => o.setVisible(false));
    this.shake(0.02, 500);
    this.audio.play('enemyDeath');
    if (boss.variant === 'warden') {
      this.ended = true; // final boss: victory sequence
      this.player.locked = true;
      this.enemies.getChildren().forEach((e) => e.active && e.die());
      for (let i = 0; i < 10; i++) this.time.delayedCall(i * 220, () => this.particles.explosion(boss.x + Phaser.Math.Between(-50, 50), boss.y + Phaser.Math.Between(-60, 60), 0xffb347));
      this.time.delayedCall(800, () => this.toast('THE IRON WARDEN IS DEFEATED', '#ffd166', 2200));
      this.time.delayedCall(3200, () => this.cameras.main.fadeOut(900));
      this.time.delayedCall(4200, () => { this.save.level = 4; SaveSystem.save(this.save); this.scene.start('GameOverScene', { mode: 'victory', level: 4 }); });
    } else {
      this.miniDone = true;
      this.toast('GUARDIAN DEFEATED - the gate opens', '#ffd166', 2400);
      this.walls.forEach((w) => w.destroy());
      this.walls = [];
      this.cameras.main.setBounds(0, 0, this.L.width, GAME_H);
      this.addPickup('upgrade', boss.x, boss.y - 20, this.L.boss.reward || 'dmg');
      for (let i = 0; i < 6; i++) this.addPickup('coin', boss.x + (i - 3) * 22, boss.y - 40);
      this.audio.playMusic('music_level');
    }
  }
}
