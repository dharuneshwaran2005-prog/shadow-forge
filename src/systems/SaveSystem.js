// localStorage persistence. Every access is wrapped so blocked/full storage never crashes the game.
const SAVE_KEY = 'shadowForge.save.v1';
const SETTINGS_KEY = 'shadowForge.settings.v1';

const defaultSave = () => ({
  level: 1, checkpoint: null, coins: 0, crystals: 0, collected: [],
  stats: { maxHp: 100, dmgLevel: 0, staminaLevel: 0, dashLevel: 0 },
  abilities: { doubleJump: false, dash: false },
});
const defaultSettings = () => ({ music: 0.6, sfx: 0.8, shake: true });

function read(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch (e) { console.warn('Save read failed', e); return fallback; }
}
function write(key, data) {
  try { window.localStorage.setItem(key, JSON.stringify(data)); return true; }
  catch (e) { console.warn('Save write failed', e); return false; }
}

export const SaveSystem = {
  hasSave() { try { return !!window.localStorage.getItem(SAVE_KEY); } catch (e) { return false; } },
  load() { return read(SAVE_KEY, defaultSave()); },
  save(data) { return write(SAVE_KEY, data); },
  reset() { const d = defaultSave(); write(SAVE_KEY, d); return d; },
  loadSettings() { return read(SETTINGS_KEY, defaultSettings()); },
  saveSettings(s) { return write(SETTINGS_KEY, s); },
};
