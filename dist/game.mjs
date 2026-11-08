import { Game, WIDTH, FIXED_STEP, MAX_LIVES, advanceCamera } from './engine.mjs?v=54';
import { GardenScenery, GARDENS, gardenById } from './scenery.mjs?v=16';
import { HoldControls } from './hold-controls.mjs?v=23';
import { FlowerProfile, PROFILE_KEY } from './profile.mjs?v=16';
import { paintFlower } from './flowers.mjs?v=16';

const $ = id => document.getElementById(id);
const APP_VERSION = '1.0 RC2';
const FIRST_FLIGHT_KEY = 'petal-pounce-first-flight-v1';
const MODAL_IDS = ['help-dialog','shop-dialog','records-dialog','achievements-dialog','first-flight-dialog','credits-dialog'];
const blockingDialogOpen = () => MODAL_IDS.some(id => $(id)?.open);
const canvas = $('game');
canvas.style.imageRendering = 'auto'; // Use Flower Garden's smooth scaling in every garden.
const ctx = canvas.getContext('2d', { alpha: false });
const screen = $('screen');
const cabinet = $('cabinet');
const safeGet = (key, fallback) => { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } };
const safeSet = (key, value) => { try { localStorage.setItem(key, value); return true; } catch { return false; } };
const PROGRESS_KEY = 'petal-pounce-records-achievements-v1';
const BEE_STYLES = Object.freeze({
  classic: { id:'classic', name:'Garden Bee', body:'#423d29', stripe:'#edb445', highlight:'#ffda75',
    wingEdge:'#477a70', wing:'#e5f3d9', wingShade:'#b0d6c7', trail:null },
  rose: { id:'rose', name:'Rose Stripe', body:'#49323c', stripe:'#d97891', highlight:'#ffc1cc',
    wingEdge:'#6c5571', wing:'#f2dce8', wingShade:'#d5a8bd', trail:null },
  royal: { id:'royal', name:'Royal Bloom', body:'#302c4d', stripe:'#8c70d9', highlight:'#d2c0ff',
    wingEdge:'#4c4777', wing:'#ebe6ff', wingShade:'#bcb2ea', trail:null },
  mint: { id:'mint', name:'Mintwing', body:'#3d412d', stripe:'#e8b94e', highlight:'#ffe08a',
    wingEdge:'#36786c', wing:'#d5ffe7', wingShade:'#8ed6bf', trail:null },
  gold: { id:'gold', name:'Golden Guardian', body:'#43351f', stripe:'#f1c24e', highlight:'#fff0a0',
    wingEdge:'#97732f', wing:'#fff2ba', wingShade:'#e8c765', trail:null },
  sky: { id:'sky', name:'Windwhisper', body:'#303d4e', stripe:'#79b8d8', highlight:'#c8edff',
    wingEdge:'#477892', wing:'#e2f7ff', wingShade:'#9fd7eb', trail:null },
  petal: { id:'petal', name:'Petal Parade', body:'#423d29', stripe:'#edb445', highlight:'#ffda75',
    wingEdge:'#7a596e', wing:'#f6e8ed', wingShade:'#d9b5c7', trail:'petal' },
  star: { id:'star', name:'Starlight Wings', body:'#353044', stripe:'#d7b85d', highlight:'#fff0a6',
    wingEdge:'#655d8b', wing:'#f0edff', wingShade:'#c7bdf3', trail:'star' }
});
const ACHIEVEMENTS = Object.freeze([
  { id:'first-bouquet', icon:'✿', name:'First Bouquet', description:'Collect 25 flowers in one run.', reward:'Rose Stripe bee', styleId:'rose', target:25, metric:'bestFlowers' },
  { id:'full-bloom', icon:'❀', name:'Full Bloom', description:'Collect 100 flowers in one run.', reward:'Royal Bloom bee', styleId:'royal', target:100, metric:'bestFlowers' },
  { id:'perfect-patch', icon:'◇', name:'Perfect Patch', description:'Collect 25 flowers without missing one.', reward:'Mintwing style', styleId:'mint', target:25, metric:'bestPerfect' },
  { id:'untouchable', icon:'♢', name:'Untouchable', description:'Collect 50 flowers without losing a life.', reward:'Golden Guardian style', styleId:'gold', target:50, metric:'bestUntouchable' },
  { id:'wind-rider', icon:'≈', name:'Wind Rider', description:'Survive a full high-wind scene without taking damage.', reward:'Windwhisper style', styleId:'sky', target:1, metric:'cleanWinds' },
  { id:'thread-needle', icon:'✦', name:'Thread the Needle', description:'Earn 10 close calls in one run.', reward:'Petal Parade trail', styleId:'petal', target:10, metric:'bestCloseCalls' },
  { id:'bloom-master', icon:'★', name:'Bloom Master', description:'Reach the ×4 Bloom Streak multiplier.', reward:'Starlight Wings trail', styleId:'star', target:25, metric:'bestStreak' }
]);
const defaultProgress = () => ({
  records: { bestStreak:0, bestCloseCalls:0, totalFlowers:0, runsPlayed:0,
    bestPerfect:0, bestUntouchable:0, cleanWinds:0 },
  unlocked: {}, equippedStyle:'classic'
});
function loadProgress() {
  const fallback = defaultProgress();
  try {
    const raw = JSON.parse(safeGet(PROGRESS_KEY, 'null'));
    if (!raw || typeof raw !== 'object') return fallback;
    for (const key of Object.keys(fallback.records)) {
      fallback.records[key] = Math.max(0, Math.floor(Number(raw.records?.[key]) || 0));
    }
    for (const achievement of ACHIEVEMENTS) fallback.unlocked[achievement.id] = !!raw.unlocked?.[achievement.id];
    if (BEE_STYLES[raw.equippedStyle]) fallback.equippedStyle = raw.equippedStyle;
  } catch {}
  return fallback;
}
const progress = loadProgress();
const saveProgress = () => safeSet(PROGRESS_KEY, JSON.stringify(progress));
const styleUnlocked = styleId => styleId === 'classic' || ACHIEVEMENTS.some(achievement =>
  achievement.styleId === styleId && progress.unlocked[achievement.id]);
if (!styleUnlocked(progress.equippedStyle)) progress.equippedStyle = 'classic';
const currentBeeStyle = () => BEE_STYLES[progress.equippedStyle] || BEE_STYLES.classic;
let savedProfile;
try { savedProfile = JSON.parse(safeGet(PROFILE_KEY, 'null')); } catch {}
const profile = new FlowerProfile({ raw: savedProfile, save: value => safeSet(PROFILE_KEY,value) });
// Carry the existing lifetime flower total into the new Records screen so this
// update never makes a returning player's collection history look like zero.
progress.records.totalFlowers = Math.max(progress.records.totalFlowers, profile.data.lifetimeFlowers || 0);
const loadedBest = Number(safeGet('nectar-tangle-best-v1', safeGet('bumble-best-v1', '0')));
const loadedBestFlowers = Number(safeGet('petal-pounce-best-flowers-v1', '0'));
const game = new Game({
  best: Number.isFinite(loadedBest) ? Math.max(0, loadedBest) : 0,
  bestFlowers: Number.isFinite(loadedBestFlowers) ? Math.max(0, loadedBestFlowers) : 0
});
let firstFlightSeen = safeGet(FIRST_FLIGHT_KEY, '') === 'done'
  || profile.data.lifetimeFlowers > 0 || game.best > 0 || game.bestFlowers > 0;
const input = { left: false, right: false, fly: false, steer: 0, glide: 0 };
const controls = new HoldControls({
  buttons: { left:$('left'), right:$('right'), fly:$('fly') },
  canPress: () => ['playing','reviving'].includes(game.mode)
    && !blockingDialogOpen(),
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
  if (!['playing', 'reviving'].includes(game.mode) || blockingDialogOpen()) return;
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
let cameraInitialized = false;
let clock = 0;
let accumulator = 0;
let lastFrame = 0;
let displayedMode = '';
let displayedLives = -1;
let displayedGarden = '';
let toastTimer;
let difficultyNoticeUntil = 0;
let missedNoticeUntil = 0;
let missedNoticePoints = 0;
let gardenNoticeTimer;
let gardenNoticeScheduled = false;
let gardenNoticeShowing = false;
const gardenNoticeQueue = [];
const runTracker = { perfectSinceMiss:0, flowersSinceHit:0, windActive:false, windClean:true };
let feedbackTimer;
let beetleWarningCooldown = 0;
let windAudioCooldown = 0;
let warnedBeetles = new WeakSet();
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
const fmtScore = value => (value < 0 ? '−' : '') + Math.abs(value).toString().padStart(6, '0');

function resize() {
  const rect = screen.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  viewH = Math.round(WIDTH * rect.height / rect.width);
  canvas.width = WIDTH;
  canvas.height = viewH;
  ctx.imageSmoothingEnabled = false;
  const target = game.bee.y - viewH * .6;
  if (!cameraInitialized || game.mode === 'title') {
    camera = target;
  }
  else camera = Math.min(camera, target);
  cameraInitialized = true;
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

function showFeedback(kind) {
  const flash = $('feedback-flash');
  clearTimeout(feedbackTimer);
  flash.className = `feedback-flash ${kind}`;
  void flash.offsetWidth;
  flash.classList.add('show');
  feedbackTimer = setTimeout(() => { flash.className = 'feedback-flash'; }, kind === 'hit' ? 520 : 360);
}

function persistSession() {
  const savedBest = Math.max(game.best, game.score);
  const savedFlowers = Math.max(game.bestFlowers, game.flowersCollected);
  safeSet('nectar-tangle-best-v1', String(savedBest));
  safeSet('petal-pounce-best-flowers-v1', String(savedFlowers));
  saveProgress();
}

function clearInput() { controls.clear(); clearJoystick(); }

function clearGardenNotices() {
  clearTimeout(gardenNoticeTimer);
  gardenNoticeScheduled = false;
  gardenNoticeShowing = false;
  gardenNoticeQueue.length = 0;
  const notice = $('garden-notification');
  notice.hidden = true;
  notice.classList.remove('show');
}

function fitGardenNotice() {
  const copy = $('garden-notice-copy');
  const title = $('garden-notice-title');
  const detail = $('garden-notice-detail');
  copy.classList.remove('compact','extra-compact');
  if (title.scrollWidth > title.clientWidth || detail.scrollWidth > detail.clientWidth) copy.classList.add('compact');
  if (title.scrollWidth > title.clientWidth || detail.scrollWidth > detail.clientWidth) copy.classList.add('extra-compact');
}

function showNextGardenNotice() {
  gardenNoticeScheduled = false;
  if (gardenNoticeShowing || !gardenNoticeQueue.length) return;
  gardenNoticeShowing = true;
  const item = gardenNoticeQueue.shift();
  const notice = $('garden-notification');
  notice.dataset.kind = item.kind;
  $('garden-notice-icon').textContent = item.icon;
  $('garden-notice-title').textContent = item.title;
  $('garden-notice-detail').textContent = item.detail;
  notice.hidden = false;
  fitGardenNotice();
  notice.classList.remove('show');
  void notice.offsetWidth;
  notice.classList.add('show');
  if (item.kind === 'achievement') {
    tone(659,.12,'triangle');tone(784,.14,'triangle',.08);tone(1047,.18,'sine',.17,.024);
    if (!reducedMotion && navigator.vibrate) navigator.vibrate([16,28,16]);
  }
  gardenNoticeTimer = setTimeout(() => {
    notice.hidden = true;
    notice.classList.remove('show');
    gardenNoticeShowing = false;
    showNextGardenNotice();
  }, 2650);
}

function queueGardenNotice(item) {
  // A bloom milestone is the immediate result of the collected flower, so it
  // takes priority over an achievement unlocked by that same flower.
  if (item.kind === 'milestone') {
    const firstAchievement = gardenNoticeQueue.findIndex(queued => queued.kind === 'achievement');
    gardenNoticeQueue.splice(firstAchievement < 0 ? gardenNoticeQueue.length : firstAchievement, 0, item);
  } else gardenNoticeQueue.push(item);
  if (!gardenNoticeScheduled && !gardenNoticeShowing) {
    gardenNoticeScheduled = true;
    queueMicrotask(showNextGardenNotice);
  }
}

function achievementProgress(achievement) {
  if (achievement.metric === 'bestFlowers') return Math.max(game.bestFlowers, game.flowersCollected);
  return Math.max(0, Number(progress.records[achievement.metric]) || 0);
}

function unlockAchievement(id, { announce = true } = {}) {
  if (progress.unlocked[id]) return false;
  const achievement = ACHIEVEMENTS.find(item => item.id === id);
  if (!achievement) return false;
  progress.unlocked[id] = true;
  saveProgress();
  if (announce) {
    queueGardenNotice({ kind:'achievement', icon:'★', title:achievement.name.toUpperCase(),
      detail:`${BEE_STYLES[achievement.styleId].name.toUpperCase()} UNLOCKED` });
  }
  if ($('achievements-dialog').open) renderAchievements();
  return true;
}

function checkAchievement(id, value) {
  const achievement = ACHIEVEMENTS.find(item => item.id === id);
  if (achievement && value >= achievement.target) unlockAchievement(id);
}

function renderRecords() {
  const records = [
    ['PERSONAL BEST', fmtScore(game.best)],
    ['MOST FLOWERS', String(Math.max(game.bestFlowers, game.flowersCollected))],
    ['LONGEST STREAK', String(progress.records.bestStreak)],
    ['MOST CLOSE CALLS', String(progress.records.bestCloseCalls)],
    ['TOTAL FLOWERS', String(progress.records.totalFlowers)],
    ['RUNS PLAYED', String(progress.records.runsPlayed)]
  ];
  const grid = $('records-grid');
  grid.replaceChildren();
  for (const [label, value] of records) {
    const card = document.createElement('article');
    card.className = 'record-card';
    const caption = document.createElement('span');
    const strong = document.createElement('strong');
    caption.textContent = label;
    strong.textContent = value;
    card.append(caption, strong);
    grid.append(card);
  }
}

function equipBeeStyle(styleId) {
  if (!styleUnlocked(styleId)) return;
  progress.equippedStyle = styleId;
  saveProgress();
  renderAchievements();
  notify(`${BEE_STYLES[styleId].name.toUpperCase()} EQUIPPED`, 1800);
  tone(523,.09,'triangle');tone(784,.14,'sine',.08);
}

function renderAchievements() {
  const list = $('achievements-list');
  list.replaceChildren();
  const unlockedCount = ACHIEVEMENTS.filter(item => progress.unlocked[item.id]).length;
  $('achievement-count').textContent = `${unlockedCount} / ${ACHIEVEMENTS.length} UNLOCKED`;
  $('equip-classic').disabled = progress.equippedStyle === 'classic';
  $('equip-classic').textContent = progress.equippedStyle === 'classic' ? 'GARDEN BEE EQUIPPED ✓' : 'EQUIP GARDEN BEE';
  for (const achievement of ACHIEVEMENTS) {
    const unlocked = !!progress.unlocked[achievement.id];
    const value = Math.min(achievement.target, achievementProgress(achievement));
    const style = BEE_STYLES[achievement.styleId];
    const card = document.createElement('article');
    card.className = `achievement-card ${unlocked ? 'unlocked' : 'locked'}`;
    card.style.setProperty('--reward-body', style.stripe);
    card.style.setProperty('--reward-wing', style.wing);
    const heading = document.createElement('div');
    heading.className = 'achievement-heading';
    const badge = document.createElement('span');
    badge.className = 'achievement-badge';
    badge.textContent = achievement.icon;
    const copy = document.createElement('div');
    copy.className = 'achievement-copy';
    const name = document.createElement('h3');
    const description = document.createElement('p');
    name.textContent = achievement.name;
    description.textContent = achievement.description;
    copy.append(name, description);
    heading.append(badge, copy);
    const progressTrack = document.createElement('div');
    progressTrack.className = 'achievement-progress';
    const fill = document.createElement('span');
    fill.style.width = `${Math.min(100, value / achievement.target * 100)}%`;
    progressTrack.append(fill);
    const footer = document.createElement('div');
    footer.className = 'achievement-footer';
    const reward = document.createElement('span');
    reward.className = 'achievement-reward';
    reward.textContent = `${unlocked ? 'REWARD' : `${value} / ${achievement.target}`} · ${achievement.reward}`;
    const button = document.createElement('button');
    button.className = 'achievement-equip';
    button.disabled = !unlocked || progress.equippedStyle === achievement.styleId;
    button.textContent = !unlocked ? 'LOCKED' : progress.equippedStyle === achievement.styleId ? 'EQUIPPED ✓' : 'EQUIP';
    if (unlocked) button.addEventListener('click', () => equipBeeStyle(achievement.styleId));
    footer.append(reward, button);
    card.append(heading, progressTrack, footer);
    list.append(card);
  }
}

function openRecords() { renderRecords(); $('records-dialog').showModal(); }
function openAchievements() { renderAchievements(); $('achievements-dialog').showModal(); }
function openCredits() { $('credits-version').textContent = `PETAL POUNCE · ${APP_VERSION}`; $('credits-dialog').showModal(); }
$('open-records').addEventListener('click', openRecords);
$('open-achievements').addEventListener('click', openAchievements);
$('close-records').addEventListener('click', () => $('records-dialog').close());
$('records-done').addEventListener('click', () => $('records-dialog').close());
$('close-achievements').addEventListener('click', () => $('achievements-dialog').close());
$('achievements-done').addEventListener('click', () => $('achievements-dialog').close());
$('equip-classic').addEventListener('click', () => equipBeeStyle('classic'));
$('open-credits').addEventListener('click', openCredits);
$('close-credits').addEventListener('click', () => $('credits-dialog').close());
$('credits-done').addEventListener('click', () => $('credits-dialog').close());
for (const achievement of ACHIEVEMENTS) {
  if (achievementProgress(achievement) >= achievement.target) unlockAchievement(achievement.id, { announce:false });
}
saveProgress();

function startRun() {
  ensureAudio();
  clearInput();
  game.start();
  particles.length = 0;
  camera = game.bee.y - viewH * .6;
  cameraInitialized = true;
  notify(`${currentGarden().name.toUpperCase()} · HOLD WINGS TO FLY`, 4000);
  updateUI();
}

function primaryAction() {
  ensureAudio();
  clearInput();
  if (game.mode === 'title' && !firstFlightSeen) {
    $('first-flight-dialog').showModal();
    return;
  }
  if (game.mode === 'title' || game.mode === 'over') startRun();
  else if (game.mode === 'paused') game.resume();
  updateUI();
}

$('play').addEventListener('click', () => primaryAction());
$('close-first-flight').addEventListener('click', () => $('first-flight-dialog').close());
$('first-flight-go').addEventListener('click', () => {
  firstFlightSeen = true;
  safeSet(FIRST_FLIGHT_KEY, 'done');
  $('first-flight-dialog').close();
  startRun();
});
$('secondary').addEventListener('click', () => {
  clearInput();
  game.record();
  safeSet('nectar-tangle-best-v1', String(game.best));
  safeSet('petal-pounce-best-flowers-v1', String(game.bestFlowers));
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
  if (blockingDialogOpen() || event.target instanceof HTMLInputElement) return;
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
addEventListener('pagehide', persistSession);

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
  $('timer').textContent = String(game.flowersCollected).padStart(3, '0');
  const inRun = mode !== 'title';
  $('streak').hidden = !inRun || game.multiplier <= 1;
  $('streak').textContent = `BLOOM STREAK ${game.streak} · ×${game.multiplier}`;
  $('streak').dataset.multiplier = String(game.multiplier);
  $('timer').parentElement.classList.remove('warning');
  $('level-label').textContent = game.mode === 'playing' && clock < difficultyNoticeUntil
    ? 'DIFFICULTY UP' : 'FLOWERS';
  $('level-label').title = garden.name;
  $('altitude-fill').style.height = `${Math.max(4, Math.min(100, (game.distance % 300) / 3))}%`;
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
  $('meta-actions').hidden = mode !== 'title';
  $('open-credits').hidden = mode !== 'title';
  $('start-hint').textContent = 'PRESS ENTER TO CONTINUE';
  const pointsFromBest = Math.max(0, game.runPreviousBest - game.score);
  const resultCallout = game.newBest && game.newBestFlowers
    ? '<strong class="new-best-callout">NEW SCORE & FLOWER RECORD!</strong>'
    : game.newBest
      ? '<strong class="new-best-callout">NEW PERSONAL BEST!</strong>'
      : game.newBestFlowers
        ? '<strong class="new-best-callout">NEW FLOWER RECORD!</strong>'
    : game.score === game.runPreviousBest
      ? '<strong class="best-gap-callout">PERSONAL BEST MATCHED</strong>'
      : `<strong class="best-gap-callout">${pointsFromBest} ${pointsFromBest === 1 ? 'POINT' : 'POINTS'} FROM YOUR BEST</strong>`;
  const titles = {
    title: ['THE ENDLESS GARDEN RUN', '<span class="title-word">PETAL</span><span class="title-word title-word-last">POUNCE</span>', `Collect flowers. Dodge islands and beetles.<br><strong>3 lives. No finish line.</strong>${game.bestFlowers ? `<br>BEST RUN: ${game.bestFlowers} FLOWERS` : ''}`, 'LET’S FLY'],
    paused: ['WINGS AT REST', 'TAKE A<br>BREATHER.', 'Your garden will be right here.<br>Ready when you are.', 'KEEP FLYING'],
    over: ['NO LIVES REMAINING', 'GAME<br>OVER.', `${resultCallout}<br>${game.score} points · ${game.flowersCollected} flowers<br>Best flowers: ${game.bestFlowers} · Milestone: ${game.highestMilestone || '—'}<br>Best streak: ${game.bestStreak} · Close calls: ${game.nearMisses}<br>Your flower bank and unlocked gardens are safe.`, 'PLAY AGAIN']
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
    if (document.activeElement instanceof HTMLButtonElement && !blockingDialogOpen()) document.activeElement.blur();
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
  if (f.missed) return;
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
    .map(t => ({...t, segments:[t]}))
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
      last.segments.push(...thorn.segments);
      continue;
    }
    merged.push(thorn);
  }
  return merged;
}

function islandNoise(seed, salt) {
  let value=(seed+Math.imul(salt+1,0x9e3779b1))>>>0;
  value=Math.imul(value^(value>>>16),0x21f0aaad);
  value=Math.imul(value^(value>>>15),0x735a2d97);
  return ((value^(value>>>15))>>>0)/4294967295;
}

function drawThorn(t) {
  const w=Math.max(10,Math.round(t.endX-t.x||t.w));
  const h=Math.max(9,t.h);
  const heavy=!!t.heavy;
  const night=currentGarden().night;
  const seed=((Math.round(t.x)*31)^(Math.round(t.y)*131)^(w*17))>>>0;
  const noise=salt=>islandNoise(seed,salt);
  const bodyHalf=Math.max(5,Math.min(h-2,h*(heavy?.59:.50)));
  const sections=Math.max(2,Math.ceil(w/(15+Math.floor(noise(1)*7))));
  const palette=night?{
    shadow:'#1d2d32',rockDark:'#354348',rock:'#536268',rockLight:'#84918b',
    soil:'#3b463d',mossDark:'#405f47',moss:'#63875c',mossLight:'#a1b67d',
    root:'#617757',crack:'#303a3c',tip:'#d2d7b7'
  }:{
    shadow:'#243029',rockDark:'#41443b',rock:'#626156',rockLight:'#969081',
    soil:'#484a3b',mossDark:'#3e653d',moss:'#638a4e',mossLight:'#a8bd6b',
    root:'#5b7147',crack:'#383a33',tip:'#dcdda5'
  };
  const top=[],bottom=[];
  for(let i=0;i<=sections;i++){
    const x=Math.round(w*i/sections);
    const edge=i===0||i===sections;
    top.push([x,Math.round(-bodyHalf+(edge?0:(noise(10+i)-.5)*4))]);
    bottom.push([x,Math.round(bodyHalf+(edge?0:(noise(70+i)-.42)*5))]);
  }
  const topY=x=>top[Math.max(0,Math.min(sections,Math.round(x/w*sections)))][1];
  const bottomY=x=>bottom[Math.max(0,Math.min(sections,Math.round(x/w*sections)))][1];

  ctx.save();
  // Clip the artwork to the original hazard shapes, even when islands share a silhouette.
  ctx.beginPath();
  for (const segment of t.segments) {
    ctx.roundRect(segment.x-segment.h, segment.y-camera-segment.h,
      segment.endX-segment.x+2*segment.h, 2*segment.h, segment.h);
  }
  ctx.clip();
  ctx.translate(t.x,t.y-camera);

  // One irregular landmass spans the full merged obstacle, so neighboring
  // pieces read as a single floating island instead of repeated bars.
  poly([[2,top[0][1]+3],...top.slice(1).map(([x,y])=>[x+2,y+3]),
    ...bottom.slice().reverse().map(([x,y])=>[x+2,y+4])],palette.shadow);
  poly([...top,...bottom.slice().reverse()],palette.rockDark);
  const innerTop=top.map(([x,y])=>[x,y+2]);
  const innerBottom=bottom.slice().reverse().map(([x,y])=>[x,Math.max(1,y-2)]);
  poly([...innerTop,...innerBottom],palette.rock);

  // Patchy moss follows the uneven island contour rather than forming a
  // mechanical stripe. Small gaps reveal soil and age the formation.
  const mossTop=top.map(([x,y],i)=>[x,y-2-Math.round(noise(130+i)*2)]);
  const mossBottom=top.slice().reverse().map(([x,y])=>[x,y+2]);
  poly([...mossTop,...mossBottom],palette.mossDark);
  let patchX=3+noise(180)*8,patch=0;
  while(patchX<w-5){
    const length=8+noise(190+patch)*18;
    const y=topY(patchX)-3-Math.round(noise(220+patch)*2);
    ctx.fillStyle=patch%3===0?palette.mossLight:palette.moss;
    ctx.fillRect(Math.round(patchX),y,Math.max(3,Math.min(Math.round(length),w-Math.round(patchX)-2)),2);
    patchX+=length+5+noise(250+patch)*13;patch++;
  }

  // Uneven rock facets and cracks make long hazards feel hand-built and
  // prevent the repeated platform pattern from showing through.
  let faceX=7+noise(280)*10,face=0;
  while(faceX<w-8){
    const faceW=6+noise(290+face)*13;
    const y=-1+Math.round((noise(320+face)-.5)*4);
    poly([[faceX,y-2],[faceX+faceW,y-1],[faceX+faceW-3,y+3],[faceX+2,y+2]],
      face%3===0?palette.rockLight:palette.soil);
    if(face%2===0){
      ctx.strokeStyle=palette.crack;ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(Math.round(faceX+faceW*.45),y+1);
      ctx.lineTo(Math.round(faceX+faceW*.62),y+4);
      ctx.lineTo(Math.round(faceX+faceW*.45),Math.min(bodyHalf-1,y+7));ctx.stroke();
    }
    faceX+=faceW+8+noise(350+face)*14;face++;
  }

  // Roots and stone points use deliberately irregular spacing and length.
  // Their furthest tips stay inside the existing collision radius.
  ctx.strokeStyle=palette.root;ctx.lineWidth=2;
  let rootX=12+noise(380)*16,root=0;
  while(rootX<w-8){
    const base=bottomY(rootX)-1;
    const length=Math.min(Math.max(0,h-base-2),3+noise(390+root)*8);
    if(length>=2){
      const bend=noise(420+root)>.5?3:-3;
      ctx.beginPath();ctx.moveTo(Math.round(rootX),base);
      ctx.lineTo(Math.round(rootX+bend),Math.round(base+length));
      if(length>5)ctx.lineTo(Math.round(rootX+bend+(bend>0?-2:2)),Math.round(base+length+1));ctx.stroke();
    }
    rootX+=30+noise(450+root)*34;root++;
  }
  let toothX=5+noise(480)*9,tooth=0;
  while(toothX<w-4){
    const halfWidth=4+noise(490+tooth)*5;
    const base=bottomY(toothX)-1;
    const depth=Math.min(h,base+Math.max(4,(h-base)*(.58+noise(520+tooth)*.42)));
    poly([[toothX-halfWidth,base],[toothX+noise(540+tooth)*3-1,depth],[toothX+halfWidth,base]],
      tooth%3===0?palette.rockLight:palette.rock);
    if(depth>h-2){ctx.fillStyle=palette.tip;ctx.fillRect(Math.round(toothX-1),Math.round(depth-2),2,2);}
    toothX+=halfWidth*2+6+noise(560+tooth)*15;tooth++;
  }

  // Occasional grass and tiny sprouts make the islands feel alive without
  // resembling collectible flowers.
  const sproutCount=w<72?0:Math.min(4,1+Math.floor(w/125));
  for(let i=0;i<sproutCount;i++){
    const x=18+noise(600+i)*(w-36);
    const base=topY(x)-2;
    const rise=Math.min(Math.max(3,h+base-1),4+noise(620+i)*5);
    ctx.strokeStyle=palette.mossLight;ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(Math.round(x),base);ctx.lineTo(Math.round(x),Math.round(base-rise));ctx.stroke();
    const side=noise(640+i)>.5?1:-1;
    poly([[x,base-rise+2],[x+side*6,base-rise-1],[x+side*3,base-rise+4]],palette.mossLight);
    if(noise(660+i)>.45)poly([[x,base-rise+4],[x-side*5,base-rise+2],[x-side*3,base-rise+6]],palette.moss);
  }

  // Pointed side faces communicate the capsule-shaped hitbox. Edge-rooted
  // formations continue beyond the screen and therefore omit that outer cap.
  const cap=Math.min(h,heavy?20:15);
  if(t.edge!=='left')poly([[1,top[0][1]],[-cap,-2],[-cap+3,2],[1,bottom[0][1]]],palette.rockLight);
  if(t.edge!=='right')poly([[w-1,top.at(-1)[1]],[w+cap,1],[w+cap-3,4],[w-1,bottom.at(-1)[1]]],palette.rockLight);
  ctx.fillStyle=palette.tip;
  if(t.edge!=='left')ctx.fillRect(-cap,-2,3,2);
  if(t.edge!=='right')ctx.fillRect(w+cap-3,0,3,2);
  ctx.restore();
}

function drawBeetle(beetle) {
  const y = beetle.y - camera;
  if (y < -35 || y > viewH + 35) return;
  ctx.save();
  ctx.translate(Math.round(beetle.x), Math.round(y));
  ctx.scale(Math.cos(beetle.phase) < 0 ? -1 : 1, 1);
  const flap = reducedMotion ? 0 : Math.sin(clock * 38 + beetle.phase) * 3;
  ctx.fillStyle = '#e7efd8b3';
  ctx.beginPath();
  ctx.ellipse(-7, -11 - flap, 12, 5, -.35, 0, Math.PI * 2);
  ctx.ellipse(3, -10 + flap, 11, 5, .25, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#383341';
  ctx.lineWidth = 2;
  for (const x of [-10, -2, 6]) {
    ctx.beginPath();
    ctx.moveTo(x, 5);ctx.lineTo(x - 3, 12);ctx.lineTo(x + 1, 14);
    ctx.stroke();
  }
  poly([[-18,-1],[-13,-10],[-4,-13],[7,-9],[12,-2],[9,8],[0,12],[-12,8]], '#423546');
  poly([[-15,-2],[-10,-9],[-3,-10],[6,-7],[9,0],[6,7],[-1,9],[-11,6]], '#a65f7b');
  poly([[-13,-3],[-8,-8],[-2,-8],[3,-5],[-4,-3]], '#d495a5');
  ctx.strokeStyle = '#674353';
  ctx.beginPath();ctx.moveTo(-14,1);ctx.lineTo(7,1);ctx.stroke();
  ctx.fillStyle = '#583d53';
  ctx.fillRect(-8,3,3,3);ctx.fillRect(0,-6,3,3);
  poly([[9,-6],[16,-7],[20,-2],[19,5],[13,8],[8,4]], '#3a3543');
  ctx.fillStyle = '#fff1cf';ctx.fillRect(15,-3,3,4);
  ctx.fillStyle = '#282c32';ctx.fillRect(17,-2,1,2);
  ctx.strokeStyle = '#3a3543';
  ctx.beginPath();ctx.moveTo(16,-6);ctx.lineTo(20,-12);ctx.lineTo(23,-12);ctx.stroke();
  ctx.restore();
}

function drawBeeTrail(b, offset = camera) {
  const style = currentBeeStyle();
  if (!style.trail || reducedMotion || game.mode === 'reviving') return;
  const baseY = b.y - offset;
  ctx.save();
  for (let i = 1; i <= 5; i++) {
    const age = ((clock * 2.2 + i * .19) % 1 + i * .13);
    const x = b.x - b.vx * age * .10 + Math.sin(clock * 5 + i * 1.7) * (3 + age * 4);
    const y = baseY - b.vy * age * .035 + 13 + age * 27;
    ctx.globalAlpha = Math.max(0, .58 - age * .33);
    ctx.translate(Math.round(x), Math.round(y));
    ctx.rotate(clock + i * 1.1);
    if (style.trail === 'petal') {
      ctx.fillStyle = i % 2 ? '#f1b5df' : '#fff0a5';
      ctx.beginPath();
      ctx.ellipse(-3,0,4,2,-.5,0,Math.PI*2);
      ctx.ellipse(3,0,4,2,.5,0,Math.PI*2);
      ctx.ellipse(0,-3,2,4,0,0,Math.PI*2);
      ctx.fill();
    } else {
      ctx.strokeStyle = i % 2 ? '#fff3ae' : '#d8d0ff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();ctx.moveTo(-4,0);ctx.lineTo(4,0);ctx.moveTo(0,-4);ctx.lineTo(0,4);ctx.stroke();
    }
    ctx.rotate(-(clock + i * 1.1));
    ctx.translate(-Math.round(x), -Math.round(y));
  }
  ctx.restore();
}

function drawBee(b, offset = camera, attract = false) {
  if (!attract && game.mode === 'reviving') return;
  const y = b.y - offset;
  if (y < -50 || y > viewH + 60) return;
  ctx.save();
  ctx.translate(Math.round(b.x), Math.round(y));
  if (!attract && game.invulnerable > 0) {
    ctx.strokeStyle = '#fff2cf';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.ellipse(0, 0, 32, 28, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.rotate(Math.max(-.28, Math.min(.28, b.vx / 750)));
  const flap = reducedMotion ? 0 : Math.sin(clock * (input.fly ? 55 : 27)) > 0 ? 4 : 0;
  const beeStyle = currentBeeStyle();
  // Hand-drawn pixel wings and a striped body; no original game assets.
  poly([[-8,-6],[-17,-20+flap],[-28,-19+flap],[-28,-8+flap],[-18,2],[-8,7]], beeStyle.wingEdge);
  poly([[-10,-6],[-18,-17+flap],[-25,-16+flap],[-24,-7+flap],[-16,0],[-10,4]], beeStyle.wing);
  poly([[-14,-5],[-23,-14+flap],[-19,-5],[-12,1]], beeStyle.wingShade);
  poly([[8,-6],[17,-20+flap],[28,-19+flap],[28,-8+flap],[18,2],[8,7]], beeStyle.wingEdge);
  poly([[10,-6],[18,-17+flap],[25,-16+flap],[24,-7+flap],[16,0],[10,4]], beeStyle.wing);
  poly([[14,-5],[23,-14+flap],[19,-5],[12,1]], beeStyle.wingShade);
  poly([[-6,-19],[6,-19],[11,-13],[13,1],[11,11],[5,17],[-5,17],[-11,11],[-13,1],[-11,-13]], beeStyle.body);
  ctx.fillStyle = beeStyle.stripe;ctx.fillRect(-8,-10,16,8);ctx.fillRect(-9,4,18,7);ctx.fillRect(-4,12,8,3);
  ctx.fillStyle = beeStyle.highlight;ctx.fillRect(-7,-10,6,3);ctx.fillRect(-8,4,6,3);
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
      const collected = Math.max(1, event.value || 1);
      progress.records.totalFlowers += collected;
      runTracker.perfectSinceMiss += collected;
      runTracker.flowersSinceHit += collected;
      progress.records.bestPerfect = Math.max(progress.records.bestPerfect, runTracker.perfectSinceMiss);
      progress.records.bestUntouchable = Math.max(progress.records.bestUntouchable, runTracker.flowersSinceHit);
      progress.records.bestStreak = Math.max(progress.records.bestStreak, event.streak || 0);
      checkAchievement('first-bouquet', game.flowersCollected);
      checkAchievement('full-bloom', game.flowersCollected);
      checkAchievement('perfect-patch', runTracker.perfectSinceMiss);
      checkAchievement('untouchable', runTracker.flowersSinceHit);
      checkAchievement('bloom-master', event.streak || 0);
      saveProgress();
      if(!credit?.saved)notify('FLOWER SAVED FOR THIS SESSION · DEVICE STORAGE UNAVAILABLE',3000);
      if(event.multiplierChanged)notify(`BLOOM STREAK ×${event.multiplier}`,1500);
      else if(event.bait)notify('RISKY BLOOM · +3 FLOWERS',1500);
      addBurst(event.x,event.y,event.value||1);
      const lift = (event.multiplier - 1) * 85;
      tone(784 + lift,.08,'sine');tone(1047 + lift,.12,'sine',.065);
    } else if (event.type === 'flowerMilestone') {
      queueGardenNotice({ kind:'milestone', icon:'✿', title:`${event.milestone} BLOOMS!`, detail:`+${event.bonus} BONUS` });
      for (let i = 0; i < (reducedMotion ? 6 : 24); i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 55 + Math.random() * 145;
        particles.push({ x:event.x, y:event.y, vx:Math.cos(angle)*speed,
          vy:Math.sin(angle)*speed-35, life:1.05, max:1.05,
          color:i%3===0?'#fff5b0':i%2?currentGarden().flower.light:currentGarden().flower.center });
      }
      [523,659,784,1047].forEach((note,i) => tone(note,.14,'triangle',i*.065,.022));
      if (!reducedMotion) shake = Math.max(shake, .12);
      if (!reducedMotion && navigator.vibrate) navigator.vibrate([18,28,22]);
    } else if (event.type === 'flowersMissed') {
      runTracker.perfectSinceMiss = 0;
      missedNoticePoints = (clock < missedNoticeUntil ? missedNoticePoints : 0) + event.points;
      missedNoticeUntil = clock + 1.2;
    } else if (event.type === 'nearMiss') {
      progress.records.bestCloseCalls = Math.max(progress.records.bestCloseCalls, event.count || 0);
      checkAchievement('thread-needle', event.count || 0);
      saveProgress();
      particles.push({x:event.x,y:event.y,vx:0,vy:-42,life:.85,max:.85,text:'CLOSE CALL +5'});
      showFeedback('near');
      tone(330,.06,'square',0,.018);tone(494,.09,'triangle',.045,.018);
      if (!reducedMotion && navigator.vibrate) navigator.vibrate(12);
    } else if (event.type === 'bounce') tone(220,.07,'triangle',0,.014);
    else if (event.type === 'hit') {
      runTracker.flowersSinceHit = 0;
      if (runTracker.windActive) runTracker.windClean = false;
      showFeedback('hit');
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
      safeSet('nectar-tangle-best-v1', String(game.best));
      safeSet('petal-pounce-best-flowers-v1', String(game.bestFlowers));
      if (game.newBest || game.newBestFlowers) {
        [523,659,784,1047].forEach((note,i) => tone(note,.17,'triangle',i*.08,.024));
      }
      clearInput();
      $('toast').classList.remove('show');
    } else if (event.type === 'difficultyBand') {
      difficultyNoticeUntil = clock + 2.1;
    } else if (event.type === 'windWarning') {
      showFeedback('wind');
      notify('Caution: High Winds', 3000);
      tone(220,.28,'triangle',0,.022);tone(165,.32,'triangle',.12,.018);
    } else if (event.type === 'windStart') {
      runTracker.windActive = true;
      runTracker.windClean = true;
      windAudioCooldown = 1.1;
      notify(`HIGH WINDS · PUSHING ${event.direction < 0 ? 'LEFT' : 'RIGHT'}`, 1400);
      tone(130,.35,'sawtooth',0,.016);
    } else if (event.type === 'windEnd') {
      if (runTracker.windActive && runTracker.windClean) {
        progress.records.cleanWinds++;
        checkAchievement('wind-rider', progress.records.cleanWinds);
        saveProgress();
      }
      runTracker.windActive = false;
      notify('WINDS CALM', 1200);
      tone(330,.12,'triangle');tone(440,.14,'triangle',.08);
    } else if (event.type === 'complete') {
      [523,659,784,1047].forEach((note,i) => tone(note,.18,'triangle',i*.1));
      safeSet('nectar-tangle-best-v1', String(game.best));
      safeSet('petal-pounce-best-flowers-v1', String(game.bestFlowers));
      clearInput();
    } else if (event.type === 'start') {
      progress.records.runsPlayed++;
      runTracker.perfectSinceMiss = 0;
      runTracker.flowersSinceHit = 0;
      runTracker.windActive = false;
      runTracker.windClean = true;
      beetleWarningCooldown = 0;
      windAudioCooldown = 0;
      warnedBeetles = new WeakSet();
      saveProgress();
      difficultyNoticeUntil = 0;
      missedNoticeUntil = 0;
      missedNoticePoints = 0;
      clearGardenNotices();
      tone(392);tone(523,.15,'triangle',.1);
    }
  }
}

function updateAmbientCues(dt) {
  beetleWarningCooldown = Math.max(0, beetleWarningCooldown - dt);
  windAudioCooldown = Math.max(0, windAudioCooldown - dt);
  if (!['playing', 'reviving'].includes(game.mode)) return;
  if (game.wind?.phase === 'active' && windAudioCooldown <= 0) {
    const base = game.wind.direction < 0 ? 82 : 94;
    tone(base,.28,'sawtooth',0,.006);
    tone(base * 1.5,.22,'sine',.08,.004);
    windAudioCooldown = 1.65;
  }
  if (game.mode !== 'playing' || beetleWarningCooldown > 0) return;
  const beeY = game.bee.y - camera;
  for (const beetle of game.level.wasps) {
    if (warnedBeetles.has(beetle)) continue;
    const y = beetle.y - camera;
    if (y < 24 || y > Math.min(viewH * .48, beeY - 34)) continue;
    warnedBeetles.add(beetle);
    beetleWarningCooldown = 2.4;
    showFeedback('beetle');
    tone(196,.08,'square',0,.012);
    tone(147,.11,'square',.08,.01);
    break;
  }
}

function drawScene(dt) {
  const attract = game.mode === 'title';
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
    for (const beetle of game.level.wasps) drawBeetle(beetle);
    drawBeeTrail(game.bee);
    drawBee(game.bee);
    drawWindOverlay();
    if (game.mode === 'playing') {
      const above = game.level.flowers.filter(f=>!f.taken && !f.missed && f.y<camera+70).length;
      const below = game.level.flowers.filter(f=>!f.taken && !f.missed && f.y>camera+viewH-45).length;
      ctx.font = '11px monospace';ctx.textAlign='right';ctx.fillStyle=currentGarden().hint;
      if (above) ctx.fillText(`${above} ABOVE ↑`,WIDTH-24,90);
      if (below) ctx.fillText(`${below} BELOW ↓`,WIDTH-24,viewH-12);
      if (clock < missedNoticeUntil) {
        const message = `MISSED · −${missedNoticePoints}`;
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'center';
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#30232d';
        ctx.fillStyle = '#ffc1bb';
        ctx.strokeText(message, WIDTH / 2, 76);
        ctx.fillText(message, WIDTH / 2, 76);
      }
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
  const previousMode = game.mode;
  if(game.mode==='playing'||game.mode==='reviving'){
    accumulator+=dt;
    while(accumulator>=FIXED_STEP){game.step(FIXED_STEP,input);accumulator-=FIXED_STEP;}
  } else accumulator=0;
  if (game.mode === 'reviving') game.prepareRevive(camera, camera + viewH);
  if (game.mode === 'playing') {
    const previousBottom = camera + viewH;
    camera = advanceCamera(camera, game.highestY, viewH, dt);
    if (previousMode === 'playing') game.missFlowers(previousBottom, camera + viewH);
    game.enforceCameraWindow(camera, camera + viewH);
  }
  events();
  updateAmbientCues(dt);
  updateUI();
  drawScene(dt);
  requestAnimationFrame(frame);
}
updateUI();
requestAnimationFrame(frame);
