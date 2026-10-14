// On-screen controls for phones/tablets. Each button fires the same keyboard events the game already
// listens for, so no gameplay code changes. Shown only on touch devices.
const KEYS = {
  left: ['ArrowLeft', 37], right: ['ArrowRight', 39], jump: ['Space', 32], attack: ['KeyJ', 74],
  heavy: ['KeyK', 75], dash: ['KeyL', 76], interact: ['KeyE', 69], pause: ['Escape', 27],
};

function fire(type, name) {
  const [code, kc] = KEYS[name];
  window.dispatchEvent(new KeyboardEvent(type, { code, key: code, keyCode: kc, which: kc, bubbles: true }));
}

export function initTouchControls() {
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;
  if (!isTouch) return;

  const style = document.createElement('style');
  style.textContent = `
    #touch-ui{position:fixed;inset:0;pointer-events:none;z-index:10;user-select:none;-webkit-user-select:none;touch-action:none}
    #touch-ui button{position:absolute;pointer-events:auto;touch-action:none;border:2px solid rgba(183,168,255,.7);background:rgba(20,16,42,.55);
      color:#e8e4ff;font:bold 15px Georgia,serif;border-radius:50%;width:64px;height:64px;-webkit-tap-highlight-color:transparent;padding:0}
    #touch-ui button.on{background:rgba(255,209,102,.55);border-color:#ffd166}
    #touch-ui .sm{width:46px;height:46px;font-size:13px}
    #rotate-hint{position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:#07050d;color:#ffd166;font:24px Georgia,serif;z-index:20;text-align:center;padding:2em}
    @media (orientation:portrait){#rotate-hint{display:flex}}`;
  document.head.appendChild(style);

  const root = document.createElement('div');
  root.id = 'touch-ui';
  const layout = [
    ['left', '◀', 'left:calc(14px + env(safe-area-inset-left));bottom:calc(22px + env(safe-area-inset-bottom))'],
    ['right', '▶', 'left:calc(96px + env(safe-area-inset-left));bottom:calc(22px + env(safe-area-inset-bottom))'],
    ['jump', 'JUMP', 'right:calc(18px + env(safe-area-inset-right));bottom:calc(22px + env(safe-area-inset-bottom))'],
    ['attack', 'J', 'right:calc(92px + env(safe-area-inset-right));bottom:calc(40px + env(safe-area-inset-bottom))'],
    ['heavy', 'K', 'right:calc(92px + env(safe-area-inset-right));bottom:calc(112px + env(safe-area-inset-bottom))'],
    ['dash', 'L', 'right:calc(18px + env(safe-area-inset-right));bottom:calc(94px + env(safe-area-inset-bottom))'],
    ['interact', 'E', 'right:calc(166px + env(safe-area-inset-right));bottom:calc(76px + env(safe-area-inset-bottom));', true],
    ['pause', 'II', 'right:calc(14px + env(safe-area-inset-right));top:calc(10px + env(safe-area-inset-top))', true],
  ];
  for (const [name, label, pos, small] of layout) {
    const b = document.createElement('button');
    b.textContent = label;
    b.style.cssText = pos;
    if (small) b.className = 'sm';
    const press = (e) => { e.preventDefault(); b.setPointerCapture?.(e.pointerId); b.classList.add('on'); fire('keydown', name); };
    const release = (e) => { e.preventDefault(); if (b.classList.contains('on')) { b.classList.remove('on'); fire('keyup', name); } };
    b.addEventListener('pointerdown', press);
    b.addEventListener('pointerup', release);
    b.addEventListener('pointercancel', release);
    b.addEventListener('lostpointercapture', release);
    b.addEventListener('contextmenu', (e) => e.preventDefault());
    root.appendChild(b);
  }
  document.body.appendChild(root);
  const hint = document.createElement('div');
  hint.id = 'rotate-hint';
  hint.textContent = 'Rotate your phone to landscape to play';
  document.body.appendChild(hint);
}
