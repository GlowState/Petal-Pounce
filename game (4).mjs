import { Game, WIDTH, FIXED_STEP, MAX_LIVES } from './engine.mjs?v=39';
import { GardenScenery, GARDENS, gardenById } from './scenery.mjs?v=16';
import { HoldControls } from './hold-controls.mjs?v=23';
import { FlowerProfile, PROFILE_KEY } from './profile.mjs?v=16';
import { paintFlower } from './flowers.mjs?v=16';

const $ = id => document.getElementById(id);
const canvas = $('game');
const ctx = canvas.getContext('2d', { alpha: false });
const screen = $('screen');
const cabinet = $('cabinet');
const safeGet = (key, fallback) => { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } };
const safeSet = (key, value) => { try { localStorage.setItem(key, value); return true; } catch { return false; } };
let savedProfile;
try { savedProfile = JSON.parse(safeGet(PROFILE_KEY, 'null')); } catch {}
const profile = new FlowerProfile({ raw: savedProfile, save: value => safeSet(PROFILE_KEY,value) });
const loadedBest = Number(safeGet('nectar-tangle-best-v1', safeGet('bumble-best-v1', '0')));
const game = new Game({ best: Number.isFinite(loadedBest) ? Math.max(0, loadedBest) : 0 });
const input = { left: false, right: false, fly: false, steer: 0, glide: 0 };
const controls = new HoldControls({
  buttons: { left:$('left'), right:$('right'), fly:$('fly') },
  canPress: () => ['playing','reviving'].includes(game.mode) && !$('help-dialog').open && !$('shop-dialog').open,
  onPress: key => { ensureAudio(); if(game.mode === 'title' && key === 'fly') primaryAction(); },
  onChange: state => {
    Object.assign(input,state);
    updateSteeringInput();
    if (!joystickActive) drawJoystick(steeringAxisFromKeys(), 0);
  }
});


// Responsive 360-degree thumbstick: any horizontal deflection steers, even
// at the top/bottom of the circle. Pointer capture preserves two-thumb play.
const stickPlate = $('steering-joystick');
const stickBase = stickPlate.querySelector('.joystick-control');
const stickKnob = $('joystick-stick');
let joystickPointer = null;
let joystickActive = false;
let joystickX = 0;
let joystickY = 0;
let stickVisualX = 0;
let stickVisualY = 0;
const clampUnit = value => Math.max(-1, Math.min(1, value));
const JOYSTICK_DIAGONAL_REDUCTION = .14;
// No horizontal dead zone: only an exactly centered X gives zero steering.
// Speed still varies continuously with the amount of horizontal travel.
function steeringAxisFromKeys() { return Number(input.right) - Number(input.left); }
function updateSteeringInput() {
  input.steer = joystickActive ? joystickX : steeringAxisFromKeys();
  input.glide = joystickActive ? -joystickY : 0;
}
function stickBounds() {
  // The hit target is larger than the visible arcade ring. Use the ring's center
  // for analog input, so an enlarged hit target never changes steering feel.
  return stickBase.getBoundingClientRect();
}
function joystickRadius() {
  const box = stickBounds();
  return Math.max(1, Math.min(box.width, box.height) * .34);
}
function joystickTravel() {
  const box = stickBounds();
  return Math.max(4, Math.min(box.width, box.height) / 2 - 41);
}
function drawJoystick(x, y = 0) {
  const distance = joystickTravel();
  stickPlate.style.setProperty('--stick-x', `${(x * distance).toFixed(1)}px`);
  stickPlate.style.setProperty('--stick-y', `${(y * distance).toFixed(1)}px`);
  stickPlate.dataset.direction = Math.hypot(x, y) < .01 ? 'center' : 'tilted';
}
function joystickPosition(clientX, clientY) {
  const box = stickBounds();
  const radius = joystickRadius();
  const dx = (clientX - box.left - box.width / 2) / radius;
  const dy = (clientY - box.top - box.height / 2) / radius;
  const magnitude = Math.hypot(dx, dy);
  // Keep the knob inside the circular well. Its movement does not restrict
  // the larger area that can capture and track the player's thumb.
  const visualX = magnitude > 1 ? dx / magnitude : dx;
  const visualY = magnitude > 1 ? dy / magnitude : dy;
  // Crucial: do not gate steering on angle or overall thumb distance.
  // Any dx > 0 steers right; any dx < 0 steers left, even near vertical.
  const horizontal = clampUnit(dx);
  // Diagonals are slightly slower than a straight horizontal tilt.
  const diagonalFactor = 1 - JOYSTICK_DIAGONAL_REDUCTION * Math.min(1, Math.abs(dy));
  const x = horizontal * diagonalFactor;
  // Preserve the separate Fly control and the subtle glide trimming.
  const y = clampUnit(dy);
  return { x, y, visualX, visualY };
}
function setJoystick(x, y, visualX = x, visualY = y) {
  joystickX = clampUnit(x);
  joystickY = clampUnit(y);
  stickVisualX = clampUnit(visualX);
  stickVisualY = clampUnit(visualY);
  drawJoystick(stickVisualX, stickVisualY);
  updateSteeringInput();
}
function releaseJoystick(pointerId = null) {
  if (joystickPointer === null || (pointerId !== null && pointerId !== joystickPointer)) return;
  const releasedId = joystickPointer;
  joystickPointer = null;
  joystickActive = false;
  stickPlate.classList.remove('engaged');
  setJoystick(0, 0);
  try { if (stickPlate.hasPointerCapture(releasedId)) stickPlate.releasePointerCapture(releasedId); } catch {}
  drawJoystick(steeringAxisFromKeys(), 0);
}
function clearJoystick() {
  if (joystickPointer !== null) releaseJoystick();
  joystickPointer = null;
  joystickActive = false;
  joystickX = 0;
  joystickY = 0;
  stickVisualX = 0;
  stickVisualY = 0;
  stickPlate.classList.remove('engaged');
  drawJoystick(0, 0);
  updateSteeringInput();
}
stickPlate.addEventListener('pointerdown', event => {
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  if (!['playing', 'reviving'].includes(game.mode) || $('help-dialog').open || $('shop-dialog').open) return;
  if (joystickPointer !== null) return;
  event.preventDefault();
  ensureAudio();
  joystickPointer = event.pointerId;
  joystickActive = true;
  stickPlate.classList.add('engaged');
  try { stickPlate.setPointerCapture(event.pointerId); } catch {}
  const pos = joystickPosition(event.clientX, event.clientY);
  setJoystick(pos.x, pos.y, pos.visualX, pos.visualY);
});
stickPlate.addEventListener('pointermove', event => {
  if (event.pointerId !== joystickPointer) return;
  if (event.pointerType === 'mouse' && !(event.buttons & 1)) { releaseJoystick(event.pointerId); return; }
  event.preventDefault();
  const pos = joystickPosition(event.clientX, event.clientY);
  setJoystick(pos.x, pos.y, pos.visualX, pos.visualY);
});
for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  stickPlate.addEventListener(name, event => releaseJoystick(event.pointerId));
  window.addEventListener(name, event => releaseJoystick(event.pointerId), true);
}
for (const name of ['touchstart', 'touchmove']) stickPlate.addEventListener(name, event => event.preventDefault(), { passive: false });
for (const name of ['contextmenu', 'selectstart', 'dragstart']) stickPlate.addEventListener(name, event => event.preventDefault());
window.addEventListener('resize', () => { if (!joystickActive) drawJoystick(steeringAxisFromKeys(), 0); else drawJoystick(stickVisualX, stickVisualY); });
// Existing HoldControls continues to handle Fly and desktop keyboard arrows.

let viewH = 480;
let camera = 0;
let clock = 0;
let accumulator = 0;
let lastFrame = 0;
let displayedMode = '';
let displayedLives = -1;
let displayedGarden = '';
let toastTimer;
let helpWasPlaying = false;
let shopWasPlaying = false;
let displayedFlowers = -1;
let muted = safeGet('nectar-tangle-sound-v1', safeGet('bumble-sound-v1', 'off')) !== 'on';
let audio;
let shake = 0;
const particles = [];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const scenery = new GardenScenery({ reducedMotion });
const shopScenery = new GardenScenery({ reducedMotion:true });
const currentGarden = () => gardenById(profile.data.equipped);
const fmtScore = value => Math.floor(value).toString().padStart(6, '0');

function resize() {
  const rect = screen.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  viewH = Math.round(WIDTH * rect.height / rect.width);
  canvas.width = WIDTH;
  canvas.height = viewH;
  ctx.imageSmoothingEnabled = false;
  camera = game.bee.y - viewH * .6;
}
new ResizeObserver(resize).observe(screen);
resize();

function ensureAudio() {
  if (muted) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume().catch(() => {});
  } catch {}
}

function tone(freq, duration = .09, type = 'sine', delay = 0, volume = .035) {
  if (muted || !audio) return;
  const at = audio.currentTime + delay;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(freq, at);
  gain.gain.setValueAtTime(0, at);
  gain.gain.linearRampToValueAtTime(volume, at + .008);
  gain.gain.exponentialRampToValueAtTime(.001, at + duration);
  oscillator.connect(gain);
  gain.connect(audio.destination);
  oscillator.start(at);
  oscillator.stop(at + duration + .01);
}

function setSoundButton() {
  $('sound').querySelector('use').setAttribute('href', muted ? '#i-muted' : '#i-sound');
  $('sound').setAttribute('aria-label', muted ? 'Turn sound on' : 'Turn sound off');
  $('sound').title = muted ? 'Turn sound on' : 'Turn sound off';
  $('sound').setAttribute('aria-pressed', String(!muted));
}
setSoundButton();
$('sound').addEventListener('click', () => {
  muted = !muted;
  safeSet('nectar-tangle-sound-v1', muted ? 'off' : 'on');
  ensureAudio();
  setSoundButton();
  tone(660);
});

function notify(message, duration = 3500) {
  clearTimeout(toastTimer);
  $('toast').textContent = message;
  $('toast').classList.add('show');
  toastTimer = setTimeout(() => $('toast').classList.remove('show'), duration);
}

function clearInput() { controls.clear(); clearJoystick(); }

function primaryAction() {
  ensureAudio();
  clearInput();
  if (game.mode === 'title' || game.mode === 'over') {
    game.start();
    particles.length = 0;
    camera = game.bee.y - viewH * .6;
    notify(`${currentGarden().name.toUpperCase()} · HOLD WINGS TO FLY`, 4000);
  } else if (game.mode === 'paused') game.resume();
  updateUI();
}

$('play').addEventListener('click', primaryAction);
$('secondary').addEventListener('click', () => {
  clearInput();
  game.record();
  game.mode = 'title';
  $('toast').classList.remove('show');
  updateUI();
});

function togglePause() {
  if (game.mode === 'paused') game.resume();
  else game.pause();
  clearInput();
  updateUI();
}
$('pause').addEventListener('click', togglePause);

function openHelp() {
  helpWasPlaying = ['playing', 'reviving'].includes(game.mode);
  if (helpWasPlaying) game.pause();
  clearInput();
  updateUI();
  $('help-dialog').showModal();
}
$('help').addEventListener('click', openHelp);
$('close-help').addEventListener('click', () => $('help-dialog').close());
$('got-it').addEventListener('click', () => $('help-dialog').close());
$('help-dialog').addEventListener('close', () => {
  if (helpWasPlaying) game.resume();
  helpWasPlaying = false;
  updateUI();
});

function renderShop() {
  $('shop-balance').textContent=profile.data.flowers;
  $('shop-grid').replaceChildren();
  for(const garden of GARDENS){
    const owned=profile.data.owned.includes(garden.id),equipped=profile.data.equipped===garden.id,affordable=profile.data.flowers>=garden.price;
    const card=document.createElement('article');card.className='shop-card'+(equipped?' equipped':'');
    card.style.setProperty('--garden-color',garden.flower.petal);
    card.innerHTML=`<canvas width="320" height="160" aria-hidden="true"></canvas><div class="shop-card-body"><div class="shop-card-heading"><h3>${garden.name}</h3>${equipped?'<span class="equipped-badge">IN USE</span>':''}</div><p class="flower-variety">${garden.flower.name}</p><button class="garden-action" ${equipped||(!owned&&!affordable)?'disabled':''}>${equipped?'EQUIPPED ✓':owned?'USE GARDEN':`UNLOCK · ${garden.price} FLOWERS`}</button><p class="garden-price-note">${owned?'Yours to keep':affordable?'Unlock once. Keep forever.':`${garden.price-profile.data.flowers} more flowers to unlock`}</p></div>`;
    $('shop-grid').append(card);
    const preview=card.querySelector('canvas'),brush=preview.getContext('2d');
    shopScenery.draw(brush,{theme:garden,width:320,height:160,clock:0,camera:0,groundY:200});
    paintFlower(brush,{x:69,y:84,phase:0},{palette:garden.flower,reducedMotion:true,scale:1.5});
    paintFlower(brush,{x:125,y:112,phase:0},{palette:garden.flower,reducedMotion:true,scale:.85});
    card.querySelector('button').addEventListener('click',()=>{
      const result=owned?profile.equip(garden.id):profile.buy(garden.id);
      if(!result.ok){$('shop-status').textContent=result.reason==='funds'?'Collect a few more flowers first.':'This garden is already unlocked.';renderShop();return;}
      $('shop-status').textContent=result.saved?`${garden.name} equipped. ${owned?'':'Unlocked permanently on this device.'}`:'Equipped for this session. Saving is unavailable on this device.';
      tone(660,.1);tone(880,.13,'sine',.08);
      updateUI();renderShop();
    });
  }
}

function openShop() {
  shopWasPlaying=game.pause();clearInput();updateUI();
  $('shop-status').textContent='Your chosen garden stays equipped for every run.';
  renderShop();$('shop-dialog').showModal();
}
$('open-shop').addEventListener('click',openShop);
$('close-shop').addEventListener('click',()=>$('shop-dialog').close());
$('shop-done').addEventListener('click',()=>$('shop-dialog').close());
$('shop-dialog').addEventListener('close',()=>{
  clearInput();if(shopWasPlaying)game.resume();shopWasPlaying=false;updateUI();
});

addEventListener('keydown', event => {
  if ($('help-dialog').open || $('shop-dialog').open || event.target instanceof HTMLInputElement) return;
  if (event.code === 'Enter' && ['title', 'paused', 'complete', 'over'].includes(game.mode)) {
    // Focused buttons already activate with Enter; let their native click run once.
    if (event.target instanceof HTMLButtonElement) return;
    event.preventDefault();
    if (!event.repeat) primaryAction();
    return;
  }
  if (event.code === 'KeyP' || event.code === 'Escape') {
    if (!event.repeat) togglePause();
    return;
  }
  if (controls.keyDown(event)) ensureAudio();
});
addEventListener('keyup', event => controls.keyUp(event));
function backgroundPause() {
  clearInput();
  if (game.pause()) updateUI();
}
addEventListener('blur', backgroundPause);
document.addEventListener('visibilitychange', () => { if (document.hidden) backgroundPause(); });

$('fullscreen').addEventListener('click', async () => {
  if (document.fullscreenElement) {
    await document.exitFullscreen();
  } else if (cabinet.classList.contains('fullscreen-fallback')) {
    cabinet.classList.remove('fullscreen-fallback');
    document.body.style.overflow = '';
  } else {
    try {
      if (!cabinet.requestFullscreen) throw new Error('Use fitted fullscreen');
      await cabinet.requestFullscreen();
    } catch {
      cabinet.classList.add('fullscreen-fallback');
      document.body.style.overflow = 'hidden';
    }
  }
  $('fullscreen').setAttribute('aria-label', document.fullscreenElement || cabinet.classList.contains('fullscreen-fallback') ? 'Exit fullscreen' : 'Enter fullscreen');
  resize();
});
document.addEventListener('fullscreenchange', () => {
  $('fullscreen').setAttribute('aria-label', document.fullscreenElement ? 'Exit fullscreen' : 'Enter fullscreen');
  resize();
});

function updateUI() {
  const mode = game.mode;
  const garden = currentGarden();
  if(displayedFlowers!==profile.data.flowers){
    displayedFlowers=profile.data.flowers;
    $('flower-balance').textContent=profile.data.flowers;
    $('open-shop').setAttribute('aria-label',`Open garden shop. ${profile.data.flowers} flowers saved`);
  }
  if (displayedGarden !== garden.id) {
    displayedGarden = garden.id;
    screen.dataset.garden = garden.id;
    screen.dataset.night = String(garden.night);
    $('garden-label').textContent = garden.name.toUpperCase() + ' ✦';
  }
  $('best').textContent = fmtScore(game.best);
  $('score').textContent = fmtScore(game.score);
  $('remaining').textContent = game.flowersCollected;
  $('timer').textContent = `${game.distance}m`;
  $('timer').parentElement.classList.remove('warning');
  $('level-label').textContent = 'DISTANCE';
  $('level-label').title = garden.name;
  $('altitude-fill').style.height = `${Math.max(4, Math.min(100, (game.distance % 300) / 3))}%`;
  const inRun = mode !== 'title';
  $('hud').hidden = !inRun;
  $('lives').hidden = !inRun;
  $('altitude').hidden = !inRun;
  $('garden-label').hidden = inRun;
  $('pause').disabled = !['playing', 'reviving', 'paused'].includes(mode);
  $('pause').setAttribute('aria-label', mode === 'paused' ? 'Resume game' : 'Pause game');
  if (displayedLives !== game.lives) {
    displayedLives = game.lives;
    $('lives').replaceChildren();
    const count = document.createElement('strong');
    count.className = 'lives-count';
    count.textContent = game.lives;
    const label = document.createElement('span');
    label.textContent = game.lives === 1 ? 'LIFE' : 'LIVES';
    $('lives').append(count, label);
    for (let i = 0; i < MAX_LIVES; i++) {
      const icon = document.createElement('img');
      icon.src = './bee.svg';
      icon.alt = '';
      if (i >= game.lives) icon.className = 'lost';
      $('lives').append(icon);
    }
    $('lives').classList.toggle('low', game.lives <= 1);
    $('lives').setAttribute('aria-label', `${game.lives} lives remaining`);
  }
  if (mode === displayedMode) return;
  displayedMode = mode;
  const showMenu = !['playing', 'reviving'].includes(mode);
  $('overlay').hidden = !showMenu;
  $('overlay').classList.toggle('state-overlay', mode !== 'title');
  $('overlay').classList.toggle('title-overlay', mode === 'title');
  $('secondary').hidden = !['paused', 'over'].includes(mode);
  $('start-hint').textContent = 'PRESS ENTER TO CONTINUE';
  const titles = {
    title: ['THE ENDLESS GARDEN RUN', '<span class="title-word">PETAL</span><span class="title-word title-word-last">POUNCE</span>', 'Collect the flowers. Dodge the thorn islands.<br><strong>3 lives. No finish line.</strong>', 'LET’S FLY'],
    paused: ['WINGS AT REST', 'TAKE A<br>BREATHER.', 'Your garden will be right here.<br>Ready when you are.', 'KEEP FLYING'],
    over: ['NO LIVES REMAINING', 'GAME<br>OVER.', `${game.distance} meters traveled · ${game.flowersCollected} flowers gathered · ${game.score} honey earned.<br>Your flower bank and unlocked gardens are safe.`, 'PLAY AGAIN']
  };
  if (showMenu) {
    const [tag, title, description, label] = titles[mode];
    $('menu-tag').innerHTML = `<span></span>${tag}<span></span>`;
    $('menu-title').innerHTML = title;
    $('menu-description').innerHTML = description;
    $('play').innerHTML = `${label} <span>↗</span>`;
    $('secondary').textContent = mode === 'paused' ? 'End run' : 'Back to title';
    $('start-hint').textContent = mode === 'title' ? 'PRESS ENTER TO START' : 'PRESS ENTER TO CONTINUE';
    // Prevent an old focused pause button from intercepting the next Enter press.
    if (document.activeElement instanceof HTMLButtonElement && !$('help-dialog').open && !$('shop-dialog').open) document.activeElement.blur();
  }
}

function poly(points, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
  ctx.fill();
}

function drawSky(attract) {
  scenery.draw(ctx, {
    theme: currentGarden(), width: WIDTH, height: viewH, clock,
    camera: attract ? 0 : camera,
    groundY: attract ? viewH - 8 : game.level.height - camera - 6
  });
}

function drawLeaf(p, offset = camera) {
  const y = Math.round(p.y - offset);
  if (y < -65 || y > viewH + 50) return;
  ctx.save();
  ctx.translate(Math.round(p.x + p.w / 2), y);
  if (p.flip) ctx.scale(-1, 1);
  const w = Math.round(p.w), l = -Math.round(w / 2);
  ctx.translate(l, 0);
  poly([[0,-4],[12,1],[23,-1],[43,-9],[w-24,-12],[w-10,-7],[w,-2],[w-7,7],[w-25,15],[37,15],[18,10],[8,4]], '#315c35');
  poly([[5,-2],[20,3],[43,-4],[w-25,-8],[w-8,-4],[w-18,5],[w-39,11],[32,10],[18,6]], '#6d9e45');
  poly([[20,3],[43,-4],[w-25,-8],[w-12,-5],[w-37,2],[36,7]], '#8ab558');
  poly([[23,7],[w-12,-3],[w-22,1],[35,11]], '#4d803c');
  ctx.strokeStyle = '#b1c36b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();ctx.moveTo(18,5);ctx.lineTo(w-5,-3);ctx.stroke();
  ctx.strokeStyle = '#4e7e38';ctx.lineWidth = 1;
  for (let i = 35; i < w - 15; i += 18) {
    ctx.beginPath();ctx.moveTo(i,3);ctx.lineTo(i-8,-5);ctx.moveTo(i,3);ctx.lineTo(i-5,10);ctx.stroke();
  }
  if (p.launch) {
    ctx.fillStyle = '#d8dda0';
    ctx.fillRect(w/2-4,-5,8,3);
    ctx.fillRect(w/2-1,-8,3,8);
  }
  ctx.restore();
}

function drawFlower(f, offset = camera) {
  const y=f.y-offset;
  if(y < -45 || y > viewH+45)return;
  if (f.bait) {
    ctx.save();ctx.shadowColor=currentGarden().flower.light;ctx.shadowBlur=13;
    paintFlower(ctx,{...f,y},{palette:currentGarden().flower,time:clock,reducedMotion,scale:1.28});
    ctx.restore();
  } else paintFlower(ctx,{...f,y},{palette:currentGarden().flower,time:clock,reducedMotion});
}

// Merge touching pieces on the same horizontal line for rendering only. The
// collision geometry remains untouched, but dense traps read as one natural
// island instead of several bars laid end-to-end.
function obstacleVisuals(thorns) {
  const visible = thorns.filter(t => Math.max(t.y,t.endY) >= camera-45 && Math.min(t.y,t.endY) <= camera+viewH+45)
    .map(t => ({...t,endX:t.endX ?? t.x+t.w,w:(t.endX ?? t.x+t.w)-t.x}))
    .sort((a,b) => a.y-b.y || a.x-b.x);
  const merged=[];
  for (const thorn of visible) {
    const last=merged.at(-1);
    if(last && Math.abs(last.y-thorn.y)<1 && thorn.x<=last.endX+6){
      last.endX=Math.max(last.endX,thorn.endX);
      last.x=Math.min(last.x,thorn.x);
      last.w=last.endX-last.x;
      last.h=Math.max(last.h,thorn.h);
      last.heavy ||= thorn.heavy;
      last.edge ||= thorn.edge;
      continue;
    }
    merged.push(thorn);
  }
  return merged;
}

function drawThorn(t) {
  const w=Math.max(10,Math.round(t.endX-t.x||t.w));
  const h=Math.max(9,t.h);
  const heavy=!!t.heavy;
  const night=currentGarden().night;
  const slab=Math.max(8,Math.round(h*(heavy?.72:.58)));
  const spacing=Math.max(15,Math.round(t.spacing||19));
  const palette=night?{
    shadow:'#25343a',rock:'#48565c',rockLight:'#71817e',soil:'#343f3b',
    moss:'#587b55',mossLight:'#91aa72',root:'#52684e',tip:'#c8d0ae'
  }:{
    shadow:'#28342d',rock:'#55564c',rockLight:'#858274',soil:'#3e4437',
    moss:'#4f7944',mossLight:'#8fa95e',root:'#516843',tip:'#d1d59d'
  };
  ctx.save();
  ctx.translate(Math.round(t.x),Math.round(t.y-camera));

  // Deep shadow makes adjoining pieces feel like one floating landform.
  ctx.fillStyle=palette.shadow;
  ctx.fillRect(1,-slab/2+3,w,slab+2);

  // Irregular stone-and-soil body. The deterministic notches keep the pixel
  // silhouette lively without flickering from frame to frame.
  const top=[],bottom=[];
  top.push([0,-slab/2]);
  for(let x=12;x<w;x+=18){const notch=((x*7+Math.round(t.y))%5)-2;top.push([x,-slab/2+notch]);}
  top.push([w,-slab/2]);
  bottom.push([w,slab/2]);
  for(let x=w-13;x>0;x-=19){const notch=((x*5+Math.round(t.y))%7)-2;bottom.push([x,slab/2+notch]);}
  bottom.push([0,slab/2]);
  poly([...top,...bottom],palette.rock);

  // Mossy plant cap visually connects long rows and matches the leaf art.
  ctx.fillStyle=palette.moss;
  ctx.fillRect(2,-slab/2-3,Math.max(0,w-4),5);
  ctx.fillStyle=palette.mossLight;
  ctx.fillRect(6,-slab/2-4,Math.max(0,w-12),2);
  for(let x=8;x<w-5;x+=spacing){
    const rise=Math.min(h-3,heavy?9:7);
    poly([[x-5,-slab/2-2],[x,-slab/2-rise],[x+5,-slab/2-2]],palette.mossLight);
  }

  // Layered rock faces and hanging roots keep repeated hazards from looking
  // like separate mechanical bars.
  for(let x=11;x<w-8;x+=24){
    ctx.fillStyle=palette.rockLight;
    ctx.fillRect(x,-1,Math.min(11,w-x-3),2);
    ctx.fillStyle=palette.soil;
    ctx.fillRect(x+4,2,Math.min(7,w-x-4),2);
  }
  ctx.strokeStyle=palette.root;
  ctx.lineWidth=2;
  for(let x=17;x<w-8;x+=43){
    const length=Math.min(h-slab/2-2,5+((x+Math.round(t.y))%7));
    if(length<3)continue;
    ctx.beginPath();ctx.moveTo(x,slab/2-1);ctx.lineTo(x+2,slab/2+length);ctx.stroke();
  }

  // Stone teeth occupy the same visual boundary as the existing hitbox.
  for(let x=6;x<w-4;x+=spacing){
    const tooth=Math.min(h,heavy?h:Math.max(8,h*.84));
    poly([[x-5,slab/2-1],[x+1,tooth],[x+8,slab/2-1]],palette.rockLight);
    ctx.fillStyle=palette.tip;ctx.fillRect(x,tooth-2,2,2);
  }

  // Sharp, natural end caps. Edge-rooted pieces continue beyond the screen;
  // only their inward end remains visible as a pointed rock face.
  const cap=Math.min(h,heavy?18:14);
  if(t.edge!=='left')poly([[1,-slab/2],[-cap,0],[1,slab/2]],palette.rockLight);
  if(t.edge!=='right')poly([[w-1,-slab/2],[w+cap,0],[w-1,slab/2]],palette.rockLight);
  ctx.fillStyle=palette.tip;
  if(t.edge!=='left')ctx.fillRect(-cap, -1, 3, 2);
  if(t.edge!=='right')ctx.fillRect(w+cap-3, -1, 3, 2);
  ctx.restore();
}

function drawWasp(w) {
  const y = w.y - camera;
  if (y < -35 || y > viewH + 35) return;
  ctx.save();ctx.translate(w.x,y);
  const flap = Math.sin(clock*28 + w.phase)*5;
  ctx.fillStyle='rgba(230,245,255,.68)';
  ctx.beginPath();ctx.ellipse(-9,-12-flap,10,7,-.3,0,Math.PI*2);ctx.ellipse(9,-12+flap,10,7,.3,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=w.rush?'#ef806b':'#eab840';ctx.beginPath();ctx.ellipse(0,0,17,11,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#3b273d';ctx.fillRect(-9,-9,5,18);ctx.fillRect(2,-10,5,20);
  ctx.beginPath();ctx.moveTo(13,1);ctx.lineTo(24,5);ctx.lineTo(12,8);ctx.fill();
  if (w.rush) { ctx.fillStyle='#fff2b8';ctx.fillRect(-2,-8,4,5);ctx.fillRect(9,-3,4,4); }
  ctx.fillStyle='#fff';ctx.fillRect(-13,-6,4,4);ctx.restore();
}

function drawBee(b, offset = camera, attract = false) {
  if (!attract && game.mode === 'reviving') return;
  const y = b.y - offset;
  if (y < -50 || y > viewH + 60) return;
  if (!attract && game.invulnerable > 0 && Math.floor(clock * 12) % 2) ctx.globalAlpha = .45;
  ctx.save();
  ctx.translate(Math.round(b.x), Math.round(y));
  ctx.rotate(Math.max(-.28, Math.min(.28, b.vx / 750)));
  const flap = reducedMotion ? 0 : Math.sin(clock * (input.fly ? 55 : 27)) > 0 ? 4 : 0;
  // Hand-drawn pixel wings and a striped body; no original game assets.
  poly([[-8,-6],[-17,-20+flap],[-28,-19+flap],[-28,-8+flap],[-18,2],[-8,7]], '#477a70');
  poly([[-10,-6],[-18,-17+flap],[-25,-16+flap],[-24,-7+flap],[-16,0],[-10,4]], '#e5f3d9');
  poly([[-14,-5],[-23,-14+flap],[-19,-5],[-12,1]], '#b0d6c7');
  poly([[8,-6],[17,-20+flap],[28,-19+flap],[28,-8+flap],[18,2],[8,7]], '#477a70');
  poly([[10,-6],[18,-17+flap],[25,-16+flap],[24,-7+flap],[16,0],[10,4]], '#e5f3d9');
  poly([[14,-5],[23,-14+flap],[19,-5],[12,1]], '#b0d6c7');
  poly([[-6,-19],[6,-19],[11,-13],[13,1],[11,11],[5,17],[-5,17],[-11,11],[-13,1],[-11,-13]], '#423d29');
  ctx.fillStyle = '#edb445';ctx.fillRect(-8,-10,16,8);ctx.fillRect(-9,4,18,7);ctx.fillRect(-4,12,8,3);
  ctx.fillStyle = '#ffda75';ctx.fillRect(-7,-10,6,3);ctx.fillRect(-8,4,6,3);
  ctx.fillStyle = '#fff2cf';ctx.fillRect(-7,-17,4,4);ctx.fillRect(3,-17,4,4);
  ctx.fillStyle = '#262f2a';ctx.fillRect(-6,-18,2,3);ctx.fillRect(4,-18,2,3);
  poly([[-3,17],[3,17],[0,24]], '#f7e3b5');
  ctx.fillStyle = '#4a4230';ctx.fillRect(-8,-24,2,7);ctx.fillRect(6,-24,2,7);
  ctx.restore();
  ctx.globalAlpha = 1;
}

function addBurst(x, y, value = 1) {
  for (let i = 0; i < (reducedMotion ? 4 : 13); i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 25 + Math.random() * 100;
    particles.push({ x, y, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed-20, life: .75, max: .75, color: i % 2 ? currentGarden().flower.light : currentGarden().flower.center });
  }
  particles.push({ x, y: y-15, vx: 0, vy: -35, life: 1, max: 1, text: `+${value * 10}` });
}

function drawWindOverlay() {
  const wind = game.wind;
  if (!wind || (wind.phase !== 'warning' && wind.phase !== 'active')) return;
  const active = wind.phase === 'active';
  const direction = wind.direction || 1;
  const count = reducedMotion ? 5 : active ? 15 : 9;
  const speed = reducedMotion ? 24 : active ? 175 : 70;
  const wrap = (value, size) => ((value % size) + size) % size;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineWidth = active ? 2 : 1.5;
  ctx.strokeStyle = currentGarden().night ? '#d6eaff' : '#f5f4ca';
  ctx.globalAlpha = active ? .48 : .25;
  for (let i = 0; i < count; i++) {
    const travel = clock * speed * direction;
    const x = wrap(i * 79 + travel, WIDTH + 180) - 90;
    const y = 44 + wrap(i * 97 + Math.sin(clock * 1.7 + i) * 28, Math.max(80, viewH - 88));
    const length = (active ? 48 : 30) + (i % 4) * 9;
    ctx.beginPath();
    ctx.moveTo(x - direction * length, y);
    ctx.lineTo(x - direction * length * .55, y + (i % 2 ? 3 : -3));
    ctx.lineTo(x, y);
    ctx.stroke();
  }
  ctx.globalAlpha = active ? .82 : .52;
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'right';
  ctx.fillStyle = currentGarden().night ? '#edf7ff' : '#fff6c9';
  ctx.fillText(direction < 0 ? '← WIND' : 'WIND →', WIDTH - 24, 116);
  ctx.restore();
}

function events() {
  for (const event of game.drainEvents()) {
    if (event.type === 'flower') {
      let credit;
      for(let i=0;i<(event.value||1);i++)credit=profile.collect();
      if(!credit?.saved)notify('FLOWER SAVED FOR THIS SESSION · DEVICE STORAGE UNAVAILABLE',3000);
      if(event.bait)notify('RISKY BLOOM · +3 FLOWERS',1500);
      addBurst(event.x,event.y,event.value||1);
      tone(784,.08,'sine');tone(1047,.12,'sine',.065);
      safeSet('nectar-tangle-best-v1', String(game.best));
    } else if (event.type === 'bounce') tone(220,.07,'triangle',0,.014);
    else if (event.type === 'hit') {
      tone(160,.17,'sawtooth',0,.025);tone(95,.19,'triangle',.08);
      if (!reducedMotion) shake = .25;
      for (let i = 0; i < (reducedMotion ? 4 : 16); i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 45 + Math.random() * 105;
        particles.push({x:event.x,y:event.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:.7,max:.7,color:i%2?'#ffe28b':'#fff3d2'});
      }
      if (game.mode === 'reviving') notify(`LIFE LOST · ${game.lives} LEFT`, 1800);
    } else if (event.type === 'revive') {
      tone(440,.12,'triangle');tone(660,.14,'triangle',.08);
      notify(`BACK IN THE GARDEN · ${game.lives} ${game.lives === 1 ? 'LIFE' : 'LIVES'} LEFT`, 1800);
    } else if (event.type === 'over') {
      clearInput();
      $('toast').classList.remove('show');
    } else if (event.type === 'difficultyBand') {
      notify(`${event.label} GARDEN · THORNS GROW DENSER`,2100);
    } else if (event.type === 'windWarning') {
      notify('Caution: High Winds', 3000);
      tone(220,.28,'triangle',0,.022);tone(165,.32,'triangle',.12,.018);
    } else if (event.type === 'windStart') {
      notify(`HIGH WINDS · PUSHING ${event.direction < 0 ? 'LEFT' : 'RIGHT'}`, 1400);
      tone(130,.35,'sawtooth',0,.016);
    } else if (event.type === 'windEnd') {
      notify('WINDS CALM', 1200);
      tone(330,.12,'triangle');tone(440,.14,'triangle',.08);
    } else if (event.type === 'surprise' && event.kind === 'waspRush') {
      notify('WATCH OUT · FAST WASP', 1600);
      tone(740,.09,'triangle',0,.022);
    } else if (event.type === 'complete') {
      [523,659,784,1047].forEach((note,i) => tone(note,.18,'triangle',i*.1));
      safeSet('nectar-tangle-best-v1', String(game.best));
      clearInput();
    } else if (event.type === 'start') { tone(392);tone(523,.15,'triangle',.1); }
  }
}

function drawScene(dt) {
  const attract = game.mode === 'title';
  if (!attract) {
    const target = game.bee.y-viewH*.57;
    camera += (target-camera) * (1-Math.exp(-6*dt));
  }
  ctx.save();
  shake = Math.max(0,shake-dt);
  if (shake > 0) ctx.translate(Math.round((Math.random()-.5)*7),Math.round((Math.random()-.5)*7));
  drawSky(attract);
  if (attract) {
    drawLeaf({x:-15,y:viewH*.48,w:120},0);
    drawFlower({x:88,y:viewH*.48-31,phase:0},0);
    drawLeaf({x:WIDTH-100,y:viewH*.77,w:130,flip:true},0);
    drawFlower({x:WIDTH-83,y:viewH*.77-31,phase:2},0);
    drawLeaf({x:95,y:viewH-35,w:115},0);
    drawFlower({x:194,y:viewH-66,phase:3},0);
    drawBee({x:WIDTH*.85+Math.sin(clock*.8)*20,y:viewH*.37+Math.sin(clock*1.5)*12,vx:0},0,true);
  } else {
    for (const p of game.level.platforms) drawLeaf(p);
    for (const t of obstacleVisuals(game.level.thorns)) drawThorn(t);
    for (const f of game.level.flowers) drawFlower(f);
    for (const w of game.level.wasps) drawWasp(w);
    drawBee(game.bee);
    drawWindOverlay();
    if (game.mode === 'playing') {
      const above = game.level.flowers.filter(f=>!f.taken && f.y<camera+70).length;
      const below = game.level.flowers.filter(f=>!f.taken && f.y>camera+viewH-45).length;
      ctx.font = '11px monospace';ctx.textAlign='right';ctx.fillStyle=currentGarden().hint;
      if (above) ctx.fillText(`${above} ABOVE ↑`,WIDTH-24,90);
      if (below) ctx.fillText(`${below} BELOW ↓`,WIDTH-24,viewH-12);
    }
  }
  for (let i=particles.length-1;i>=0;i--) {
    const p=particles[i];
    p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;
    if(p.life<=0){particles.splice(i,1);continue;}
    ctx.globalAlpha=Math.min(1,p.life/p.max*2);
    if(p.text){ctx.font='bold 17px monospace';ctx.textAlign='center';ctx.fillStyle='#456039';ctx.fillText(p.text,p.x+1,p.y-camera+2);ctx.fillStyle='#fff4b9';ctx.fillText(p.text,p.x,p.y-camera);}
    else {ctx.fillStyle=p.color;ctx.fillRect(Math.round(p.x),Math.round(p.y-camera),4,4);}
  }
  ctx.globalAlpha=1;
  ctx.restore();
}

function frame(timestamp) {
  const dt = Math.min(.05, (timestamp-lastFrame)/1000 || 0);
  lastFrame=timestamp;
  clock+=dt;
  if(game.mode==='playing'||game.mode==='reviving'){
    accumulator+=dt;
    while(accumulator>=FIXED_STEP){game.step(FIXED_STEP,input);accumulator-=FIXED_STEP;}
  } else accumulator=0;
  events();
  updateUI();
  drawScene(dt);
  requestAnimationFrame(frame);
}
updateUI();
requestAnimationFrame(frame);
