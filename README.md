# Shadow Forge: Rise of the Guardian

An original 2D dark-fantasy action platformer for the browser (Phaser 3 + Vite). You play **Kael**, a young guardian
fighting through four areas of a ruined mechanical kingdom to defeat **THE IRON WARDEN**.
All art is generated procedurally and all sound is synthesised, so it runs with no paid or external assets.

## Install & run (VS Code)
Requires Node.js 18+.

```bash
cd shadow-forge
npm install
npm run dev        # opens http://localhost:5173
```
Other commands: `npm run build` (production build to `dist/`), `npm run preview`.
Tip: open the folder in VS Code and use the integrated terminal (Ctrl+`).

## Controls
| Key | Action |
|---|---|
| A / Left, D / Right | Move |
| W / Up / Space | Jump (press again in mid-air for double jump once unlocked) |
| J | Basic attack |
| K | Heavy attack - hold to charge, release to swing |
| L | Dash (invulnerable, damages enemies) |
| E | Interact (portals / gates) |
| ESC | Pause menu |

## How to play
* Level 1 teaches movement, jumping, attacking and collecting. A golden **rune** unlocks **double jump**; the **dash rune** is in Level 2.
* Touch a **shrine** (checkpoint) to save progress, restore health and set your respawn point. Progress is stored in `localStorage` (menu: Continue).
* Collect coins, energy crystals (restore stamina), hearts (health) and purple **upgrade crystals** (max health, attack damage, stamina, dash).
* Levels: 1 Forgotten Village, 2 Crystal Caverns (moving platforms, falling crystals), 3 Mechanical Fortress (saws, spikes, **Gear Brute** mini-boss; the gate opens when it falls), 4 Iron Citadel (hard platforming + **The Iron Warden**, 3 phases).

## Architecture
```
index.html / styles/game.css      page + responsive canvas wrapper
src/main.js                       creates the Phaser game
src/config.js                     Phaser config + scene list
src/utils/Constants.js            ALL tuning values (player, enemies, bosses, themes, audio paths)
src/utils/UI.js                   menu builder, controls + settings panels
src/scenes/BootScene.js           generates every texture procedurally, registers AudioSystem
src/scenes/MenuScene.js           main menu (Start / Continue / Settings / Controls)
src/scenes/GameScene.js           base class: terrain, pickups, hazards, enemies, HUD, checkpoints, bosses, save
src/scenes/Level1-4Scene.js       only level data (ground, platforms, movers, enemies, pickups, boss...)
src/scenes/PauseScene.js          pause overlay      src/scenes/GameOverScene.js  game-over + victory
src/entities/Player.js            state machine: IDLE RUN JUMP FALL ATTACK HEAVY_ATTACK DASH HURT DEAD
src/entities/Enemy.js             data-driven enemies, AI: IDLE PATROL CHASE ATTACK HURT DEAD
src/entities/Boss.js              Gear Brute + Iron Warden (telegraphed attacks, 3 phases)
src/entities/Checkpoint.js        shrine
src/systems/CombatSystem.js       hit detection, damage numbers
src/systems/SaveSystem.js         localStorage save + settings
src/systems/AudioSystem.js        audio files if present, otherwise synthesised placeholders
src/systems/ParticleSystem.js     bursts and fog
```
To add a level: copy a `LevelNScene.js`, change `getLevelData()`, register it in `config.js`.

## Replacing assets
* **Sprites/backgrounds/tiles:** textures are generated in `BootScene.makeTextures()`. To use real art, `this.load.image('kael', 'assets/sprites/kael.png')` in `preload()` and remove that key's generator. Keep the same texture keys and roughly the same sizes (player 32x48, enemy sizes in `Constants.js`).
* **Audio:** put files in `assets/audio/` using the names in `AUDIO_FILES` (`jump.ogg`, `attack.ogg`, `heavy.ogg`, `dash.ogg`, `hit.ogg`, `enemy_death.ogg`, `boss.ogg`, `hurt.ogg`, `pickup.ogg`, `ui.ogg`, `music_menu.ogg`, `music_level.ogg`, `music_boss.ogg`), then set `AUDIO_ENABLED = true` in `Constants.js`. Missing files fall back to the synth sounds. Music is silent until files are added (boss music placeholder: `music_boss`).
* For `npm run build`, copy `assets/` into `dist/` (or move it into a `public/` folder).

## Known limitations
* Placeholder art (shapes) and synthesised sounds; no sprite animation frames (poses use tint/rotation/slash effects).
* Keyboard only; no gamepad or touch controls.
* Coins/crystals collected after the last checkpoint are lost on death (by design).
* Automated testing here was a headless (jsdom) playthrough of all scenes, levels and both bosses; real-browser feel (frame rate, audio) is worth a quick manual check.

## Future improvements
Sprite sheets and animations, tilemap editor (Tiled) support, more enemy types and abilities (wall jump, parry), mini-map, gamepad support, difficulty settings, real music.

## Android app (Capacitor)
The `android/` folder is a ready Android Studio project (landscape, app id `com.shadowforge.game`).
1. Install Android Studio (includes the SDK and JDK).
2. `npm install`, then `npm run android:sync` (rebuilds the game and copies it into the app).
3. `npm run android:open`, wait for Gradle to sync, then press Run with your phone connected (USB debugging on).
4. APK: Build > Build Bundle(s)/APK(s) > Build APK(s). For the Play Store use Build > Generate Signed Bundle (AAB).
Change the app id in `capacitor.config.json` and `android/app/build.gradle` before publishing.
