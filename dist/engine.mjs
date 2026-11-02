// 18% larger sprites and scenery without clipping the player at the screen edges.
// The canvas and physics use the same narrower world, rather than CSS cropping.
export const WIDTH = 610;
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

export const thornDistance = (x, y, thorn) => pointSegmentDistance(x, y, thorn.x, thorn.y, thorn.endX, thorn.endY);

export function makeLevel(stage, seed = 6819) {
  const rng = random(seed + stage * 1171);
  const count = Math.min(16 + (stage - 1) * 3, 64);
  const pattern = ['scatter', 'steps', 'pockets', 'weave'][Math.floor(rng() * 4)];
  const drafts = [];
  const clampCenter = x => Math.max(82, Math.min(WIDTH - 82, x));
  let climb = 215;
  let stepX = 95 + rng() * (WIDTH - 190);
  let stepDirection = rng() > .5 ? 1 : -1;
  let pocketX = 150 + rng() * (WIDTH - 300);
  for (let i = 0; i < count; i++) {
    if (i) climb += rng() < .3 ? 62 + rng() * 30 : 105 + rng() * 65;
    const w = 70 + rng() * Math.max(35, 60 - stage * 1.2);
    let center = 82 + rng() * (WIDTH - 164);
    if (pattern === 'steps') {
      stepX += stepDirection * (105 + rng() * 90);
      if (stepX < 100 || stepX > WIDTH - 100) stepDirection *= -1;
      stepX = clampCenter(stepX);
      center = clampCenter(stepX + (rng() - .5) * 75);
    } else if (pattern === 'pockets') {
      if (i % 3 === 0) pocketX = 150 + rng() * (WIDTH - 300);
      center = clampCenter(pocketX + (rng() - .5) * 310);
    } else if (pattern === 'weave') {
      center = clampCenter(WIDTH / 2 + Math.sin(i * 1.65 + seed) * (160 + rng() * 100) + (rng() - .5) * 110);
    }
    if (rng() < .2) center = 82 + rng() * (WIDTH - 164);
    const p = { x: center - w / 2, y: -climb, w, flip: rng() > .5 };
    // Close vertical pairs must be side by side, with room for wings between leaves.
    for (let attempt = 0; drafts.some(other => Math.abs(other.y - p.y) < 82 && p.x < other.x + other.w + 25 && p.x + p.w + 25 > other.x); attempt++) {
      if (attempt < 16) p.x = 82 + rng() * (WIDTH - 164) - w / 2;
      else { climb += 35; p.y = -climb; }
    }
    drafts.push(p);
  }
  const height = Math.ceil(climb + 220);
  const platforms = [{ x: WIDTH / 2 - 55, y: height - 70, w: 110, launch: true }, ...drafts.map(p => ({ ...p, y: p.y + height }))];
  const flowers = platforms.slice(1).map(p => ({ x: p.flip ? p.x + 16 : p.x + p.w - 16, y: p.y - 31, taken: false, phase: rng() * 7 }));
  const spawn = { x: WIDTH / 2, y: height - 104 };
  // Keep a winding route through all flowers, rather than a straight safe lane.
  const route = [spawn, ...flowers.map(f => ({ x: f.x, y: f.y }))];
  const thorns = [];
  const target = Math.min(15 + (stage - 1) * 2, 52);
  const maxLength = 285 + Math.min(stage, 8) * 12;
  // A few branches grow into view from off-screen on either side.
  // The game still checks the full visible portion for collisions and safe flower routes.
  const edgeQuota = Math.min(3, Math.max(2, Math.round(target * .13)));
  let edgePlaced = 0;
  for (let attempt = 0; attempt < target * 200 && thorns.length < target; attempt++) {
    const angle = 0;
    const side = edgePlaced < edgeQuota;
    const w = side ? 105 + rng() * 78
      : attempt % 7 === 0 ? 235 + rng() * (maxLength - 235) : 90 + rng() * (maxLength - 90);
    const h = 9 + rng() * 10 + Math.min(stage - 1, 10) * .5;
    const cy = 90 + rng() * (height - 310);
    const leftEdge = side && rng() < .5;
    const cx = side ? (leftEdge ? -14 + w / 2 : WIDTH + 14 - w / 2) : 45 + rng() * (WIDTH - 90);
    const dx = w / 2;
    const t = {
      x: cx - dx, y: cy, endX: cx + dx, endY: cy,
      w, h, angle, spacing: 14 + rng() * 9,
      ...(side ? { edge: leftEdge ? 'left' : 'right' } : {})
    };
    // Edge branches may begin outside the viewport. All other branches must fit inside.
    if ((!side && (t.x < 24 + h || t.endX > WIDTH - 24 - h)) ||
        t.y < 45 + h || t.y > height - 165) continue;
    if (thornDistance(spawn.x, spawn.y, t) < 120 + h) continue;
    if (flowers.some(f => thornDistance(f.x, f.y, t) < h + 43)) continue;
    if (platforms.some(p => segmentDistance(t.x, t.y, t.endX, t.endY, p.x, p.y - 12, p.x + p.w, p.y - 12) < h + 38)) continue;
    if (route.slice(1).some((p, i) => segmentDistance(t.x, t.y, t.endX, t.endY, route[i].x, route[i].y, p.x, p.y) < h + RADIUS + 9)) continue;
    if (thorns.some(other => segmentDistance(t.x, t.y, t.endX, t.endY, other.x, other.y, other.endX, other.endY) < h + other.h + 44)) continue;
    thorns.push(t);
    if (side) edgePlaced++;
  }
  return { stage, pattern, height, platforms, flowers, thorns, route, seconds: 0, total: count };
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
    this.events.push({ type: 'distanceMilestone', stage: nextStage });
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
    for (let i = 0; i < count; i++) {
      const y = offset + 190 + (piece.height - 380) * (i + .5) / count;
      const x = 70 + rng() * (WIDTH - 140);
      this.level.wasps.push({ x, y, homeX: x, phase: rng() * Math.PI * 2, amplitude: 85 + rng() * 125, speed: .8 + rng() * .6 + Math.min(piece.stage, 18) * .09 });
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
    const oldBottom = b.y + RADIUS;
    const direction = Number(!!input.right) - Number(!!input.left);
    b.vx += direction * 1100 * dt;
    if (!direction) b.vx *= Math.exp(-7 * dt);
    b.vx = Math.max(-245, Math.min(245, b.vx));
    if (direction) b.face = direction;
    b.vy += (input.fly ? -760 : 660) * dt;
    b.vy = Math.max(-295, Math.min(340, b.vy));
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
