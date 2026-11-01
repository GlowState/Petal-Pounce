export const WIDTH = 720;
export const RADIUS = 13;
export const FIXED_STEP = 1 / 120;
export const REVIVE_DELAY = .75;
export const MAX_LIVES = 3;

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

// Kept for backwards compatibility with any older imports.
export const thornDistance = (x, y, thorn) => pointSegmentDistance(x, y, thorn.x, thorn.y, thorn.endX, thorn.endY);

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const beetleHit = (bee, beetle) => Math.hypot(bee.x - beetle.x, bee.y - beetle.y) < beetle.size + RADIUS - 1;

export function makeLevel(stage, seed = 6819) {
  const rng = random(seed + stage * 1171);
  const count = Math.min(14 + (stage - 1) * 2, 40);
  const pattern = ['scatter', 'steps', 'pockets', 'weave'][Math.floor(rng() * 4)];
  const drafts = [];
  const clampCenter = x => Math.max(82, Math.min(WIDTH - 82, x));
  let climb = 215;
  let stepX = 95 + rng() * 530;
  let stepDirection = rng() > .5 ? 1 : -1;
  let pocketX = 180 + rng() * 360;

  for (let i = 0; i < count; i++) {
    if (i) climb += rng() < .35 ? 68 + rng() * 26 : 108 + rng() * 62;
    const w = 72 + rng() * Math.max(34, 62 - stage * 1.1);
    let center = 82 + rng() * (WIDTH - 164);
    if (pattern === 'steps') {
      stepX += stepDirection * (108 + rng() * 86);
      if (stepX < 100 || stepX > WIDTH - 100) stepDirection *= -1;
      stepX = clampCenter(stepX);
      center = clampCenter(stepX + (rng() - .5) * 72);
    } else if (pattern === 'pockets') {
      if (i % 3 === 0) pocketX = 150 + rng() * 420;
      center = clampCenter(pocketX + (rng() - .5) * 308);
    } else if (pattern === 'weave') {
      center = clampCenter(360 + Math.sin(i * 1.65 + seed) * (160 + rng() * 100) + (rng() - .5) * 110);
    }
    if (rng() < .18) center = 82 + rng() * (WIDTH - 164);
    const p = { x: center - w / 2, y: -climb, w, flip: rng() > .5 };
    for (let attempt = 0; drafts.some(other => Math.abs(other.y - p.y) < 82 && p.x < other.x + other.w + 25 && p.x + p.w + 25 > other.x); attempt++) {
      if (attempt < 16) p.x = 82 + rng() * (WIDTH - 164) - w / 2;
      else { climb += 35; p.y = -climb; }
    }
    drafts.push(p);
  }

  const height = Math.ceil(climb + 220);
  const platforms = [{ x: 310, y: height - 70, w: 110, launch: true }, ...drafts.map(p => ({ ...p, y: p.y + height }))];
  const flowers = platforms.slice(1).map(p => ({ x: p.flip ? p.x + 16 : p.x + p.w - 16, y: p.y - 32, taken: false, phase: rng() * 7 }));
  const spawn = { x: 365, y: height - 104 };
  const route = [spawn, ...flowers.map(f => ({ x: f.x, y: f.y }))];

  const beetles = [];
  const target = Math.min(4 + stage, 18);
  for (let attempt = 0; attempt < target * 60 && beetles.length < target; attempt++) {
    const size = 15 + rng() * 8;
    const y = 90 + rng() * (height - 280);
    const span = 140 + rng() * 170;
    const center = 95 + rng() * (WIDTH - 190);
    const left = clamp(center - span / 2, 38, WIDTH - 160);
    const right = clamp(center + span / 2, 160, WIDTH - 38);
    const x = left + rng() * (right - left);
    const beetle = {
      x, y, left, right,
      dir: rng() > .5 ? 1 : -1,
      speed: 72 + stage * 6 + rng() * 56,
      size,
      bob: rng() * Math.PI * 2,
      bobSpeed: 1.8 + rng() * 1.4,
      colorShift: rng()
    };
    if (Math.hypot(beetle.x - spawn.x, beetle.y - spawn.y) < 150) continue;
    if (flowers.some(f => Math.abs(f.y - beetle.y) < 40 && f.x > beetle.left - 36 && f.x < beetle.right + 36)) continue;
    if (platforms.some(p => Math.abs((p.y - 26) - beetle.y) < 28 && p.x - 30 < beetle.right && p.x + p.w + 30 > beetle.left)) continue;
    if (beetles.some(other => Math.abs(other.y - beetle.y) < 45 && !(beetle.right < other.left - 24 || beetle.left > other.right + 24))) continue;
    beetles.push(beetle);
  }

  return { stage, pattern, height, platforms, flowers, beetles, thorns: [], route, seconds: 165 + (count - 14) * 4, total: count };
}

export class Game {
  constructor({ seed = Math.floor(Math.random() * 100000), best = 0 } = {}) {
    this.seed = seed;
    this.run = 0;
    this.best = best;
    this.score = 0;
    this.distance = 0;
    this.lives = MAX_LIVES;
    this.flowersCollected = 0;
    this.stage = 1;
    this.mode = 'title';
    this.events = [];
    this.loadLevel();
  }

  loadLevel() {
    this.earnedLife = false;
    this.bonus = 0;
    this.level = makeLevel(this.stage, (this.seed + this.run * 741103) >>> 0);
    this.remaining = this.level.total;
    this.time = this.level.seconds;
    this.respawn();
    this.reviveTime = 0;
  }

  respawn() {
    this.bee = { x: 365, y: this.level.height - 104, vx: 0, vy: 0, face: 1 };
    this.checkpoint = { x: this.bee.x, y: this.bee.y };
    this.invulnerable = 2;
    this.flash = 0;
  }

  start() {
    this.run++;
    this.score = 0;
    this.distance = 0;
    this.lives = MAX_LIVES;
    this.flowersCollected = 0;
    this.stage = 1;
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

  next() {
    this.stage++;
    this.loadLevel();
    this.mode = 'playing';
    this.events.push({ type: 'start' });
  }

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
    if (this.reason === 'time') this.time = this.level.seconds;
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

    this.time = Math.max(0, this.time - dt);
    if (this.time <= 0) { this.loseLife('time'); return; }
    this.invulnerable = Math.max(0, this.invulnerable - dt);

    const b = this.bee;
    const oldBottom = b.y + RADIUS;
    const horizontal = Number.isFinite(input.horizontal) ? clamp(input.horizontal, -1, 1) : Number(!!input.right) - Number(!!input.left);
    b.vx += horizontal * 1250 * dt;
    if (Math.abs(horizontal) < .06) b.vx *= Math.exp(-7.5 * dt);
    else b.vx *= Math.exp(-1.8 * dt);
    b.vx = clamp(b.vx, -280, 280);
    if (horizontal) b.face = horizontal > 0 ? 1 : -1;

    b.vy += (input.fly ? -760 : 660) * dt;
    b.vy = clamp(b.vy, -295, 340);
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.x < 25) { b.x = 25; b.vx = 0; }
    if (b.x > WIDTH - 25) { b.x = WIDTH - 25; b.vx = 0; }
    if (b.y < 30) { b.y = 30; b.vy = Math.max(0, b.vy); }

    for (const beetle of this.level.beetles) {
      beetle.x += beetle.speed * beetle.dir * dt;
      if (beetle.x <= beetle.left) { beetle.x = beetle.left; beetle.dir = 1; }
      if (beetle.x >= beetle.right) { beetle.x = beetle.right; beetle.dir = -1; }
      beetle.bob += dt * beetle.bobSpeed;
      beetle.renderY = beetle.y + Math.sin(beetle.bob) * 6;
    }

    for (const p of this.level.platforms) {
      const top = p.y - 3;
      if (b.vy > 0 && oldBottom <= top + 2 && b.y + RADIUS >= top && b.x > p.x + 7 && b.x < p.x + p.w - 7) {
        b.y = top - RADIUS;
        b.vy = input.fly ? -295 : -220;
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

    this.distance = Math.max(this.distance, Math.floor((this.stage - 1) * 1000 + Math.max(0, this.level.height - b.y - 70)));

    if (this.remaining === 0) {
      this.bonus = 70 + this.stage * 8;
      this.score += this.bonus;
      this.record();
      this.earnedLife = this.lives < MAX_LIVES;
      this.lives = Math.min(MAX_LIVES, this.lives + 1);
      this.distance = Math.max(this.distance, this.stage * 1000);
      this.stage++;
      this.loadLevel();
      this.mode = 'playing';
      this.events.push({ type: 'section', stage: this.stage, bonus: this.bonus, earnedLife: this.earnedLife, lives: this.lives });
      return;
    }

    if (!this.invulnerable) {
      for (const beetle of this.level.beetles) {
        if (beetleHit({ x: b.x, y: b.y }, { ...beetle, y: beetle.renderY ?? beetle.y })) {
          this.loseLife('beetle');
          return;
        }
      }
    }
    if (b.y > this.level.height + 38) this.loseLife('fall');
  }

  drainEvents() { return this.events.splice(0); }
}
