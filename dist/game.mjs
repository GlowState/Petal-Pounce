import { Game, WIDTH, FIXED_STEP, MAX_LIVES } from './engine.mjs?v=16';
import { GardenScenery, GARDENS, gardenById } from './scenery.mjs?v=16';
import { HoldControls } from './hold-controls.mjs?v=16';
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
const input = { left: false, right: false, fly: false };
const controls = new HoldControls({
  buttons: { left:$('left'), right:$('right'), fly:$('fly') },
  canPress: () => ['playing','reviving'].includes(game.mode) && !$('help-dialog').open && !$('shop-dialog').open,
  onPress: key => { ensureAudio(); if(game.mode === 'title' && key === 'fly') primaryAction(); },
  onChange: state => Object.assign(input,state)
});
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

function clearInput() { controls.clear(); }

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
  $('shop-status').textContent='Your chosen garden stays equipped for every level.';
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
  $('level-label').textContent = `DISTANCE · ZONE ${String(game.stage).padStart(2, '0')}`;
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
    title: ['THE ENDLESS GARDEN RUN', '<span class="title-word">PETAL</span><span class="title-word title-word-last">POUNCE</span>', 'Fly as far as you can. Dodge the wasps.<br><strong>3 lives. No finish line.</strong>', 'LET’S FLY'],
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
  paintFlower(ctx,{...f,y},{palette:currentGarden().flower,time:clock,reducedMotion});
}

function drawThorn(t) {
  if (Math.max(t.y, t.endY) < camera - 35 || Math.min(t.y, t.endY) > camera + viewH + 35) return;
  const w = Math.round(t.w), h = t.h;
  ctx.save();
  ctx.translate(Math.round(t.x), Math.round(t.y - camera));
  ctx.rotate(t.angle);
  const night = currentGarden().night;
  const stem = Math.max(6, Math.round(h * .55));
  ctx.fillStyle = night ? '#a57aab' : '#443a43';ctx.fillRect(0,-stem/2,w,stem);
  ctx.fillStyle = night ? '#dfb1dc' : '#876071';ctx.fillRect(3,-stem/2,w-6,2);
  for (let i = 5; i < w - 3; i += t.spacing) {
    poly([[i-4,-2],[i+2,-h],[i+7,-2]], night ? '#bc83bb' : '#6b435a');
    poly([[i-4,2],[i+4,h],[i+8,2]], night ? '#966b9b' : '#644254');
    ctx.fillStyle = night ? '#ffe0eb' : '#d39b94';ctx.fillRect(i+1,-h,2,3);
  }
  ctx.fillStyle = '#b78385';ctx.fillRect(0,-stem/2,3,stem);ctx.fillRect(w-3,-stem/2,3,stem);
  ctx.restore();
}

function drawWasp(w) {
  const y = w.y - camera;
  if (y < -35 || y > viewH + 35) return;
  ctx.save();ctx.translate(w.x,y);
  const flap = Math.sin(clock*28 + w.phase)*5;
  ctx.fillStyle='rgba(230,245,255,.68)';
  ctx.beginPath();ctx.ellipse(-9,-12-flap,10,7,-.3,0,Math.PI*2);ctx.ellipse(9,-12+flap,10,7,.3,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#eab840';ctx.beginPath();ctx.ellipse(0,0,17,11,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#3b273d';ctx.fillRect(-9,-9,5,18);ctx.fillRect(2,-10,5,20);
  ctx.beginPath();ctx.moveTo(13,1);ctx.lineTo(24,5);ctx.lineTo(12,8);ctx.fill();
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

function addBurst(x, y) {
  for (let i = 0; i < (reducedMotion ? 4 : 13); i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 25 + Math.random() * 100;
    particles.push({ x, y, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed-20, life: .75, max: .75, color: i % 2 ? currentGarden().flower.light : currentGarden().flower.center });
  }
  particles.push({ x, y: y-15, vx: 0, vy: -35, life: 1, max: 1, text: '+10' });
}

function events() {
  for (const event of game.drainEvents()) {
    if (event.type === 'flower') {
      const credit=profile.collect();
      if(!credit.saved)notify('FLOWER SAVED FOR THIS SESSION · DEVICE STORAGE UNAVAILABLE',3000);
      addBurst(event.x, event.y);
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
    } else if (event.type === 'distanceMilestone') {
      notify(`ZONE ${String(event.stage).padStart(2,'0')} · WASPS GET FASTER`, 1800);
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
    for (const t of game.level.thorns) drawThorn(t);
    for (const f of game.level.flowers) drawFlower(f);
    for (const w of game.level.wasps) drawWasp(w);
    drawBee(game.bee);
    if (game.mode === 'playing') {
      const above = game.level.flowers.filter(f=>!f.taken && f.y<camera+70).length;
      const below = game.level.flowers.filter(f=>!f.taken && f.y>camera+viewH-45).length;
      ctx.font = '9px \"Press Start 2P\", monospace';ctx.textAlign='right';ctx.fillStyle=currentGarden().hint;
      if (above) ctx.fillText(`${above} ABOVE ↑`,WIDTH-24,90);
      if (below) ctx.fillText(`${below} BELOW ↓`,WIDTH-24,viewH-12);
    }
  }
  for (let i=particles.length-1;i>=0;i--) {
    const p=particles[i];
    p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;
    if(p.life<=0){particles.splice(i,1);continue;}
    ctx.globalAlpha=Math.min(1,p.life/p.max*2);
    if(p.text){ctx.font='12px \"Press Start 2P\", monospace';ctx.textAlign='center';ctx.fillStyle='#456039';ctx.fillText(p.text,p.x+1,p.y-camera+2);ctx.fillStyle='#fff4b9';ctx.fillText(p.text,p.x,p.y-camera);}
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
