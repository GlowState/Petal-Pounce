// 18% larger sprites and scenery without clipping the player at the screen edges.
// The canvas and physics use the same narrower world, rather than CSS cropping.
export const WIDTH = 610;
export const RADIUS = 13;
export const FIXED_STEP = 1 / 120;
export const REVIVE_DELAY = .75;
export const MAX_LIVES = 3;

// Flight power grows with the player's best distance during this run.
// Stage/elapsed time do not determine the upgrade: progress has to be earned.
export function flightPower(distance = 0) {
  const progress = Math.max(0, Math.min(1, distance / 1100));
  const eased = progress * progress * (3 - 2 * progress);
  return { climbCap: 230 + 100 * eased, thrust: 660 + 180 * eased, progress };
}

export function random(seed) {
  let n = seed >>> 0;
  return () => {
    n += 0x6D2B79F5;
    let t = Math.imul(n ^ n >>> 15, 1 | n);
    t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function pointSegmentDistance(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  const along = lengthSquared ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared)) : 0;
  return Math.hypot(px - ax - along * dx, py - ay - along * dy);
}

export function segmentDistance(ax, ay, bx, by, cx, cy, dx, dy) {
  const vx = bx - ax, vy = by - ay, wx = dx - cx, wy = dy - cy;
  const cross = vx * wy - vy * wx;
  if (Math.abs(cross) > 1e-9) {
    const s = ((cx - ax) * wy - (cy - ay) * wx) / cross;
    const t = ((cx - ax) * vy - (cy - ay) * vx) / cross;
    if (s >= 0 && s <= 1 && t >= 0 && t <= 1) return 0;
  }
  return Math.min(
    pointSegmentDistance(ax, ay, cx, cy, dx, dy), pointSegmentDistance(bx, by, cx, cy, dx, dy),
    pointSegmentDistance(cx, cy, ax, ay, bx, by), pointSegmentDistance(dx, dy, ax, ay, bx, by)
  );
}

export const thornDistance = (x, y, thorn) => pointSegmentDistance(x, y, thorn.x, thorn.y, thorn.endX, thorn.endY);

export function makeLevel(stage, seed = 6819) {
  const rng = random(seed + stage * 1171);
  const count = Math.min(16 + (stage - 1) * 3, 64);
  // An individual run keeps its seeded layout, but a new run gets a different
  // seed. Rotate through small, mixed leaf behaviors inside *every* section.
  const patterns = ['scatter', 'drift', 'switchbacks', 'pockets', 'weave', 'clusters'];
  const pattern = patterns[Math.floor(rng() * patterns.length)];
  let sectionPattern = pattern;
  let nextPatternChange = 3 + Math.floor(rng() * 5);
  let switchDirection = rng() < .5 ? -1 : 1;
  let wavePhase = rng() * Math.PI * 2;
  let pocketX = 105 + rng() * (WIDTH - 210);
  let pocketLeft = 0;
  let clusterCooldown = 0;
  let climb = 195 + rng() * 45;
  let lastCenter = 112 + rng() * (WIDTH - 224);
  const drafts = [];
  const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));
  for (let i = 0; i < count; i++) {
    if (i >= nextPatternChange) {
      const alternatives = patterns.filter(value => value !== sectionPattern);
      sectionPattern = alternatives[Math.floor(rng() * alternatives.length)];
      nextPatternChange += 3 + Math.floor(rng() * 6);
      // Fresh phase and pocket location prevent repeatable, synchronized lanes.
      wavePhase = rng() * Math.PI * 2;
      pocketLeft = 0;
      if (rng() < .5) switchDirection *= -1;
    }
    // Sometimes place two leaves in a loose vertical cluster; avoid back-to-back
    // clusters and keep enough space to pass comfortably around each leaf.
    const paired = i > 0 && clusterCooldown === 0 && rng() < .17;
    if (i) {
      const roll = rng();
      const gap = paired ? 86 + rng() * 26
        : roll < .25 ? 91 + rng() * 31
        : roll < .80 ? 122 + rng() * 47
        : 169 + rng() * 37;
      climb += gap;
    }
    clusterCooldown = paired ? 2 : Math.max(0, clusterCooldown - 1);
    // A few broad landing leaves, some smaller ones, and many medium ones.
    const widthRoll = rng();
    const w = widthRoll < .17 ? 67 + rng() * 21
      : widthRoll < .85 ? 88 + rng() * 46
      : 135 + rng() * 23;
    let center;
    if (paired) {
      center = lastCenter + (rng() - .5) * 166;
    } else if (sectionPattern === 'drift') {
      center = lastCenter + (rng() - .5) * 290;
    } else if (sectionPattern === 'switchbacks') {
      center = lastCenter + switchDirection * (90 + rng() * 106);
      if (center < 100 || center > WIDTH - 100) switchDirection *= -1;
    } else if (sectionPattern === 'pockets' || sectionPattern === 'clusters') {
      if (pocketLeft <= 0) {
        pocketX = 108 + rng() * (WIDTH - 216);
        pocketLeft = sectionPattern === 'clusters' ? 2 + Math.floor(rng() * 3) : 3 + Math.floor(rng() * 3);
      }
      pocketLeft--;
      center = pocketX + (rng() - .5) * (sectionPattern === 'clusters' ? 125 : 215);
    } else if (sectionPattern === 'weave') {
      center = WIDTH / 2 + Math.sin(i * (1.02 + stage * .005) + wavePhase) * (135 + rng() * 57) + (rng() - .5) * 65;
    } else { // scatter: wide choice, but avoid a physically excessive lateral jump.
      center = 80 + rng() * (WIDTH - 160);
    }
    // Break up long streaks even within a named pattern.
    if (!paired && rng() < .20) center = lastCenter + (rng() - .5) * 350;
    const previousGap = i ? climb - (-drafts[i-1].y) : 120;
    const maxReach = Math.min(225, 105 + previousGap * .64);
    if (i) center = clamp(center, lastCenter - maxReach, lastCenter + maxReach);
    const x = clamp(center - w / 2, 22, WIDTH - w - 22);
    const p = { x, y: -climb, w, flip: rng() > .5 };
    // The minimum vertical interval keeps nearby leaves from intersecting.
    // This guard also protects us if generation constants change later.
    if (i && Math.abs(drafts[i-1].y - p.y) < 82 &&
        p.x < drafts[i-1].x + drafts[i-1].w + 24 &&
        p.x + p.w + 24 > drafts[i-1].x) {
      climb += 82 - Math.abs(drafts[i-1].y - p.y);
      p.y = -climb;
    }
    drafts.push(p);
    lastCenter = p.x + p.w / 2;
  }
  const height = Math.ceil(climb + 220);
  const platforms = [{ x: WIDTH / 2 - 55, y: height - 70, w: 110, launch: true }, ...drafts.map(p => ({ ...p, y: p.y + height }))];
  const flowers = platforms.slice(1).map(p => ({ x: p.flip ? p.x + 16 : p.x + p.w - 16, y: p.y - 31, taken: false, phase: rng() * 7 }));
  const spawn = { x: WIDTH / 2, y: height - 104 };
  // Keep a winding route through all flowers, rather than a straight safe lane.
  const route = [spawn, ...flowers.map(f => ({ x: f.x, y: f.y }))];
  const thorns = [];
  // A rare thorn tangle packs a couple of extra branches into an otherwise
  // normal section. The same flower-route clearance tests still apply.
  const tangle = stage >= 3 && rng() < .22;
  const target = Math.min(15 + (stage - 1) * 2 + (tangle ? 2 : 0), 52);
  const maxLength = 285 + Math.min(stage, 8) * 12;
  // Mixed thorn layout: some vines grow in from the edges, while others float inside the garden.
  // This preserves the overgrown look without leaving the center too open.
  // Vary the edge/interior balance by run, while always keeping both types.
  const edgeTarget = Math.max(3, Math.min(Math.round(target * (.27 + rng() * .16)), target - 5));
  let edgePlaced = 0;
  let lastSide = rng() < .5 ? 'left' : 'right';
  for (let attempt = 0; attempt < target * 220 && thorns.length < target; attempt++) {
    const angle = 0;
    const makeEdge = edgePlaced < edgeTarget && (thorns.length + (edgeTarget - edgePlaced) >= target || rng() < .42);
    const h = 9 + rng() * 10 + Math.min(stage - 1, 10) * .5;
    const cy = 90 + rng() * (height - 310);
    let t;
    if (makeEdge) {
      const side = attempt % 3 === 0 ? (lastSide === 'left' ? 'right' : 'left') : (rng() < .5 ? 'left' : 'right');
      lastSide = side;
      const longReach = attempt % 7 === 0;
      const visibleReach = longReach
        ? 190 + rng() * (Math.min(maxLength, WIDTH * .76) - 190)
        : 95 + rng() * (Math.min(maxLength - 36, WIDTH * .55) - 95);
      const offscreenBleed = 22 + rng() * 16;
      const w = visibleReach + offscreenBleed;
      t = side === 'left'
        ? { x: -offscreenBleed, y: cy, endX: visibleReach, endY: cy, w, h, angle, spacing: 14 + rng() * 9, edge: 'left' }
        : { x: WIDTH - visibleReach, y: cy, endX: WIDTH + offscreenBleed, endY: cy, w, h, angle, spacing: 14 + rng() * 9, edge: 'right' };
    } else {
      const w = attempt % 7 === 0 ? 225 + rng() * (maxLength - 225) : 95 + rng() * (maxLength - 95);
      const centerBias = .18 + rng() * .64;
      const cx = WIDTH * centerBias;
      const dx = w / 2;
      t = { x: cx - dx, y: cy, endX: cx + dx, endY: cy, w, h, angle, spacing: 14 + rng() * 9 };
      if (Math.min(t.x, t.endX) < 24 + h || Math.max(t.x, t.endX) > WIDTH - 24 - h) continue;
    }
    if (t.y < 45 + h || t.y > height - 165) continue;
    if (thornDistance(spawn.x, spawn.y, t) < 120 + h) continue;
    if (flowers.some(f => thornDistance(f.x, f.y, t) < h + 43)) continue;
    if (platforms.some(p => segmentDistance(t.x, t.y, t.endX, t.endY, p.x, p.y - 12, p.x + p.w, p.y - 12) < h + 38)) continue;
    if (route.slice(1).some((p, i) => segmentDistance(t.x, t.y, t.endX, t.endY, route[i].x, route[i].y, p.x, p.y) < h + RADIUS + 9)) continue;
    if (thorns.some(other => segmentDistance(t.x, t.y, t.endX, t.endY, other.x, other.y, other.endX, other.endY) < h + other.h + (tangle ? 36 : 45))) continue;
    thorns.push(t);
    if (makeEdge) edgePlaced++;
  }
  return { stage, pattern, tangle, height, platforms, flowers, thorns, route, seconds: 0, total: count };
}

export class Game {
  constructor({ seed = Math.floor(Math.random() * 100000), best = 0 } = {}) {
    this.seed = seed;
    this.run = 0;
    this.best = best;
    this.score = 0;
    this.lives = MAX_LIVES;
    this.flowersCollected = 0;
    this.stage = 1;
    this.distance = 0;
    this.mode = 'title';
    this.events = [];
    this.loadLevel();
  }

  loadLevel() {
    this.earnedLife = false;
    this.level = makeLevel(this.stage, (this.seed + this.run * 741103) >>> 0);
    this.level.wasps = [];
    this.topGenerated = 0;
    this.startY = this.level.height - 104;
    this.highestY = this.startY;
    this.spawnWasps(this.level, 0);
    this.remaining = this.level.total;
    this.time = 0;
    this.respawn();
    this.reviveTime = 0;
  }

  respawn() {
    this.bee = { x: WIDTH / 2, y: this.level.height - 104, vx: 0, vy: 0, face: 1 };
    this.checkpoint = { x: this.bee.x, y: this.bee.y };
    this.invulnerable = 2;
    this.flash = 0;
  }

  start() {
    this.run++;
    this.score = 0;
    this.lives = MAX_LIVES;
    this.flowersCollected = 0;
    this.stage = 1;
    this.distance = 0;
    this.loadLevel();
    this.mode = 'playing';
    this.resumeMode = 'playing';
    this.events = [{ type: 'start' }];
  }

  pause() {
    if (this.mode === 'playing' || this.mode === 'reviving') {
      this.resumeMode = this.mode;
      this.mode = 'paused';
      return true;
    }
    return false;
  }

  resume() {
    if (this.mode === 'paused') this.mode = this.resumeMode || 'playing';
  }

  // Each additional segment is attached above the previous one in the same world.
  // There is no level-complete menu or camera reset.
  extendWorld() {
    const nextStage = this.stage + 1;
    const piece = makeLevel(nextStage, (this.seed + this.run * 741103) >>> 0);
    const offset = this.topGenerated - piece.height + 140;
    for (const platform of piece.platforms.slice(1)) this.level.platforms.push({ ...platform, y: platform.y + offset });
    for (const flower of piece.flowers) this.level.flowers.push({ ...flower, y: flower.y + offset });
    for (const thorn of piece.thorns) this.level.thorns.push({ ...thorn, y: thorn.y + offset, endY: thorn.endY + offset });
    this.spawnWasps(piece, offset);
    this.topGenerated = offset;
    this.stage = nextStage;
    this.remaining += piece.flowers.length;
    this.events.push({ type: 'distanceMilestone', stage: nextStage, tangle: piece.tangle });
    // Drop passed geometry, but retain a safe area below the bee for revives.
    const cutoff = this.bee.y + 1800;
    this.level.platforms = this.level.platforms.filter(p => p.y < cutoff || p.launch);
    this.level.flowers = this.level.flowers.filter(f => f.y < cutoff);
    this.level.thorns = this.level.thorns.filter(t => t.y < cutoff);
    this.level.wasps = this.level.wasps.filter(w => w.y < cutoff);
  }

  spawnWasps(piece, offset) {
    const rng = random(this.seed + this.run * 53719 + piece.stage * 9137);
    const count = Math.min(3 + piece.stage, 15);
    // Occasionally one clearly marked wasp patrols faster than the rest.
    // No surprise wasps in the opening two zones.
    const rushSlot = piece.stage >= 3 && rng() < .28 ? Math.floor(rng() * count) : -1;
    for (let i = 0; i < count; i++) {
      const y = offset + 190 + (piece.height - 380) * (i + .5) / count;
      const x = 70 + rng() * (WIDTH - 140);
      const rush = i === rushSlot;
      const baseSpeed = .8 + rng() * .6 + Math.min(piece.stage, 18) * .09;
      this.level.wasps.push({ x, y, homeX: x, phase: rng() * Math.PI * 2,
        amplitude: rush ? 130 + rng() * 80 : 85 + rng() * 125,
        speed: baseSpeed * (rush ? 1.43 : 1), rush, warned: false });
    }
  }

  next() {} // Kept for compatibility with older UI consumers.

  loseLife(reason) {
    if (this.mode !== 'playing') return;
    this.lives--;
    this.events.push({ type: 'hit', reason, x: this.bee.x, y: this.bee.y });
    if (this.lives <= 0) {
      this.mode = 'over';
      this.record();
      this.events.push({ type: 'over', reason });
    } else {
      this.mode = 'reviving';
      this.reason = reason;
      this.reviveTime = REVIVE_DELAY;
    }
  }

  revive() {
    if (this.mode !== 'reviving') return;
    const point = this.checkpoint;
    this.bee = { x: point.x, y: point.y, vx: 0, vy: -90, face: 1 };
    this.invulnerable = 2;
    this.reviveTime = 0;
    this.mode = 'playing';
    this.events.push({ type: 'revive', x: point.x, y: point.y });
  }

  record() { this.best = Math.max(this.best, this.score); }

  step(dt, input = {}) {
    dt = Math.min(dt, 1 / 30);
    if (this.mode === 'reviving') {
      this.reviveTime = Math.max(0, this.reviveTime - dt);
      if (this.reviveTime <= 1e-8) this.revive();
      return;
    }
    if (this.mode !== 'playing') return;
    this.time += dt;
    for (const wasp of this.level.wasps) {
      wasp.phase += dt * wasp.speed;
      wasp.x = Math.max(28, Math.min(WIDTH - 28, wasp.homeX + Math.sin(wasp.phase) * wasp.amplitude));
    }
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    const b = this.bee;
    // Warn before the special wasp reaches the bee's part of the screen.
    for (const w of this.level.wasps) {
      if (w.rush && !w.warned && w.y < b.y + 40 && w.y > b.y - 470) {
        w.warned = true;
        this.events.push({ type: 'surprise', kind: 'waspRush' });
      }
    }
    const oldBottom = b.y + RADIUS;
    const digitalDirection = Number(!!input.right) - Number(!!input.left);
    const direction = Number.isFinite(input.steer) ? Math.max(-1, Math.min(1, input.steer)) : digitalDirection;
    // True analog speed control: partial tilt yields a sustainable partial speed,
    // instead of accelerating all the way to the maximum even at a tiny tilt.
    // Exponential easing yields smooth starts, stops and direction reversals.
    const desiredVx = direction * 235;
    const response = Math.abs(direction) < .0001 ? 19 : 16;
    b.vx += (desiredVx - b.vx) * (1 - Math.exp(-response * dt));
    if (Math.abs(b.vx) < .08 && Math.abs(desiredVx) < .0001) b.vx = 0;
    if (direction) b.face = direction;
    // Joystick up/down trims lift without replacing the dedicated Fly button.
    // Up slows a glide / helps takeoff; down increases descent / eases thrust.
    // The first meters are calmer. Both thrust and sustained climb speed
    // increase smoothly with distance, while steering mechanics stay untouched.
    const glide = Number.isFinite(input.glide) ? Math.max(-1, Math.min(1, input.glide)) : 0;
    const flight = flightPower(this.distance);
    b.vy += (input.fly ? -flight.thrust - glide * 145 : 660 - glide * 200) * dt;
    b.vy = Math.max(-flight.climbCap, Math.min(340, b.vy));
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.x < 25) { b.x = 25; b.vx = 0; }
    if (b.x > WIDTH - 25) { b.x = WIDTH - 25; b.vx = 0; }
    this.highestY = Math.min(this.highestY, b.y);
    this.distance = Math.max(this.distance, Math.floor((this.startY - this.highestY) / 10));
    if (b.y < this.topGenerated + 800) this.extendWorld();

    for (const p of this.level.platforms) {
      const top = p.y - 3;
      if (b.vy > 0 && oldBottom <= top + 2 && b.y + RADIUS >= top && b.x > p.x + 7 && b.x < p.x + p.w - 7) {
        b.y = top - RADIUS;
        b.vy = input.fly ? -flight.climbCap : -Math.min(220, flight.climbCap * .93);
        this.checkpoint = { x: p.x + p.w / 2, y: p.y - 28 };
        this.events.push({ type: 'bounce', x: b.x, y: p.y });
        break;
      }
    }

    for (const f of this.level.flowers) {
      if (!f.taken && Math.hypot(b.x - f.x, b.y - f.y) < 29) {
        f.taken = true;
        this.remaining--;
        this.flowersCollected++;
        this.score += 10;
        this.record();
        this.events.push({ type: 'flower', x: f.x, y: f.y });
      }
    }

    if (!this.invulnerable) {
      for (const w of this.level.wasps) {
        if (Math.hypot(b.x - w.x, b.y - w.y) < RADIUS + 15) { this.loseLife('wasp'); return; }
      }
      for (const t of this.level.thorns) {
        if (thornDistance(b.x, b.y, t) < t.h + RADIUS - 3) {
          this.loseLife('thorn');
          return;
        }
      }
    }
    if (b.y > this.level.height + 38) this.loseLife('fall');
  }

  drainEvents() { return this.events.splice(0); }
}
