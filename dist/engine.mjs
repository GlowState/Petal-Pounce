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
  // A lively but readable garden: more flowers than Update 14, without
  // recreating the old wall of leaves or a repetitive zigzag staircase.
  const count = Math.min(14 + Math.floor((stage - 1) * 2.2), 52);
  const pattern = 'free-scatter';
  const drafts = [];
  let climb = 205 + rng() * 35;
  let lastCenter = WIDTH / 2;
  let lastWasCrossing = false;
  const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));
  const leftSide = center => center < WIDTH * .29;
  const rightSide = center => center > WIDTH * .71;
  for (let i = 0; i < count; i++) {
    // Small/medium/broad leaves without the former forced zigzags, waves or steps.
    const sizeRoll = rng();
    const w = sizeRoll < .18 ? 70 + rng() * 20
      : sizeRoll < .88 ? 90 + rng() * 43
      : 134 + rng() * 24;
    // Try opposite-side jumps occasionally when a flower was already near one edge.
    // Never force one immediately after another: the course is not a zigzag ladder.
    const crossing = i > 0 && !lastWasCrossing && (leftSide(lastCenter) || rightSide(lastCenter)) && rng() < .30;
    let x;
    // Slightly closer everyday leaves; distant crossings get extra flight room.
    let gap = 138 + rng() * 102;
    if (rng() < .13) gap += 48 + rng() * 56;
    if (crossing) {
      // A flower at the *outer* tip of the opposite leaf emphasizes the full-width challenge.
      x = leftSide(lastCenter) ? WIDTH - 22 - w - rng() * 12 : 22 + rng() * 12;
      const center = x + w / 2;
      const sideways = Math.abs(center - lastCenter);
      // Time to cross the playfield at sustainable lateral speed while flying up;
      // later stages allow for the earned faster climb speed from Update 12.
      const expectedClimb = flightPower(Math.min(1100, (stage - 1) * 250)).climbCap;
      gap = Math.max(gap, (sideways / 215) * expectedClimb + 95 + rng() * 38);
    } else {
      // Each new position is independently sampled. We accept nearby repeats,
      // center leaves, and jumps toward an edge instead of alternate-side rules.
      const choosePosition = () => {
        const roll = rng();
        if (roll < .26) return 22 + rng() * 42;
        if (roll < .52) return WIDTH - w - 22 - rng() * 42;
        if (roll < .81) return WIDTH * (.34 + rng() * .32) - w / 2;
        return 22 + rng() * (WIDTH - w - 44);
      };
      x = choosePosition();
      if (i) {
        // Avoid surprise near-impossible hops without smoothing every leaf into
        // another recognizable pattern. Resample rather than pull toward center.
        let tries = 0;
        while (Math.abs(x + w / 2 - lastCenter) > 210 && tries++ < 10) x = choosePosition();
        // On a rare sequence of unhelpful draws, create extra vertical space
        // instead of forcing a leaf to be in a particular direction.
        const sideways = Math.abs(x + w / 2 - lastCenter);
        if (sideways > 210) gap = Math.max(gap, sideways * 1.65 + 80);
      }
    }
    x = clamp(x, 22, WIDTH - w - 22);
    if (i) climb += gap;
    // Put flowers on the outward side for leaves near the screen edges.
    // Other flowers remain randomized in position as before.
    const center = x + w / 2;
    const flip = leftSide(center) ? true : rightSide(center) ? false : rng() > .5;
    const p = { x, y: -climb, w, flip };
    drafts.push(p);
    lastCenter = center;
    lastWasCrossing = crossing;
  }
  const height = Math.ceil(climb + 220);
  const platforms = [{ x: WIDTH / 2 - 55, y: height - 70, w: 110, launch: true }, ...drafts.map(p => ({ ...p, y: p.y + height }))];
  const flowers = platforms.slice(1).map(p => ({ x: p.flip ? p.x + 16 : p.x + p.w - 16, y: p.y - 31, taken: false, phase: rng() * 7 }));
  const spawn = { x: WIDTH / 2, y: height - 104 };
  // Keep a winding route through all flowers, rather than a straight safe lane.
  const route = [spawn, ...flowers.map(f => ({ x: f.x, y: f.y }))];
  const thorns = [];
  const pinchGates = [];
  // Ramp obstacle *density* with progress. Some sections are intentionally
  // quieter; thickets and precision gates create memorable close calls.
  const tangle = stage >= 3 && rng() < .27;
  const hazardRate = Math.min(10.5, 7.55 + (stage - 1) * .22);
  const target = Math.min(150, Math.round(height / 1000 * hazardRate) + (tangle ? 4 : 0));
  const maxLength = 295 + Math.min(stage, 10) * 11;
  const bandCount = Math.min(9, Math.max(4, Math.ceil(height / 1400)));
  const beats = Array(bandCount).fill('normal');
  const quietSlot = Math.floor(rng() * bandCount);
  beats[quietSlot] = 'breather';
  const busyOptions = beats.map((beat, i) => beat === 'normal' && i > 0 ? i : -1).filter(i => i > 0);
  if (busyOptions.length) beats[busyOptions[Math.floor(rng() * busyOptions.length)]] = 'thicket';
  if (stage >= 5 && bandCount >= 5 && rng() < .6) {
    const options = beats.map((beat, i) => beat === 'normal' && i > 0 ? i : -1).filter(i => i > 0);
    if (options.length) beats[options[Math.floor(rng() * options.length)]] = 'thicket';
  }
  const weights = beats.map(beat => beat === 'breather' ? .5 : beat === 'thicket' ? (stage <= 2 ? 2 : 3) : 1);
  const weightTotal = weights.reduce((sum, n) => sum + n, 0);
  const pickHeight = () => {
    let roll = rng() * weightTotal;
    let band = 0;
    for (; band < weights.length - 1; band++) {
      if (roll < weights[band]) break;
      roll -= weights[band];
    }
    return 90 + (band + rng()) * (height - 310) / bandCount;
  };
  const routeClearance = h => h + RADIUS + 8;
  const validThorn = (t, neighbors = thorns) => {
    const h = t.h;
    if (t.y < 45 + h || t.y > height - 165) return false;
    if (thornDistance(spawn.x, spawn.y, t) < 118 + h) return false;
    if (flowers.some(f => thornDistance(f.x, f.y, t) < h + 43)) return false;
    if (platforms.some(platform =>
      segmentDistance(t.x, t.y, t.endX, t.endY, platform.x, platform.y - 12, platform.x + platform.w, platform.y - 12) < h + 38)) return false;
    if (route.slice(1).some((point, i) =>
      segmentDistance(t.x, t.y, t.endX, t.endY, route[i].x, route[i].y, point.x, point.y) < routeClearance(h))) return false;
    if (neighbors.some(other =>
      segmentDistance(t.x, t.y, t.endX, t.endY, other.x, other.y, other.endX, other.endY) < h + other.h + (tangle ? 31 : 38))) return false;
    return true;
  };

  // Construct true "thread the needle" passages: paired thorn branches grow
  // in from opposite edges, leaving one clearly visible opening near a
  // feasible flower-to-flower route. The opening is always wider than the bee.
  // There are more passages later, but never a no-win full-width barrier.
  const gateGoal = Math.min(7, Math.max(1, Math.floor(height / 2400) + Math.floor((stage - 1) / 5)));
  const candidates = [];
  for (let i = 1; i < route.length - 1; i++) {
    const low = route[i - 1], high = route[i];
    const verticalGap = low.y - high.y;
    if (verticalGap < 180) continue;
    const y = (low.y + high.y) / 2 + (rng() - .5) * Math.min(32, verticalGap * .14);
    const fraction = (low.y - y) / verticalGap;
    const center = low.x + (high.x - low.x) * fraction;
    const slope = Math.abs(high.x - low.x) / verticalGap;
    if (center < 145 || center > WIDTH - 145 || slope > 1.3) continue;
    candidates.push({ y, center, slope, pick: rng() });
  }
  candidates.sort((a, b) => a.pick - b.pick);
  for (const site of candidates) {
    if (pinchGates.length >= gateGoal) break;
    if (pinchGates.some(other => Math.abs(other.y - site.y) < 400)) continue;
    // Clearances shrink with stage, with more space for steep approaches.
    const hLeft = 15 + rng() * 6 + Math.min(stage - 1, 10) * .35;
    const hRight = 15 + rng() * 6 + Math.min(stage - 1, 10) * .35;
    const opening = Math.max(124, 184 - Math.min(stage - 1, 10) * 6)
      + Math.min(42, site.slope * 37) + rng() * 12;
    const center = Math.max(opening / 2 + 16, Math.min(WIDTH - opening / 2 - 16, site.center + (rng() - .5) * 13));
    const leftEnd = center - opening / 2;
    const rightStart = center + opening / 2;
    const bleedLeft = 26 + rng() * 16, bleedRight = 26 + rng() * 16;
    const left = { x: -bleedLeft, y: site.y, endX: leftEnd, endY: site.y,
      w: leftEnd + bleedLeft, h: hLeft, angle: 0, spacing: 13 + rng() * 7, edge: 'left', gate: true };
    const right = { x: rightStart, y: site.y, endX: WIDTH + bleedRight, endY: site.y,
      w: WIDTH + bleedRight - rightStart, h: hRight, angle: 0, spacing: 13 + rng() * 7, edge: 'right', gate: true };
    if (!validThorn(left) || !validThorn(right)) continue;
    if (segmentDistance(left.x, left.y, left.endX, left.endY, right.x, right.y, right.endX, right.endY) < hLeft + hRight + 42) continue;
    thorns.push(left, right);
    pinchGates.push({ y: site.y, center, opening });
  }

  // Keep both floating and edge-rooted obstacles. About a quarter to a third
  // of solo thorns are larger, heavier-looking branches with true thicker hitboxes.
  const edgeShare = .27 + rng() * .16;
  let edgePlaced = 0, soloPlaced = 0;
  const soloEdgeGoal = Math.max(3, Math.round(target * edgeShare));
  let lastSide = rng() < .5 ? 'left' : 'right';
  for (let attempt = 0; attempt < target * 240 && soloPlaced < target; attempt++) {
    const makeEdge = edgePlaced < soloEdgeGoal && (soloPlaced + soloEdgeGoal - edgePlaced >= target || rng() < .45);
    const heavyShare = Math.min(.58, .30 + .028 * (stage - 1));
    const heavy = rng() < heavyShare;
    const h = heavy ? 22 + rng() * 6 + Math.min(stage - 1, 10) * .3
      : 9 + rng() * 10 + Math.min(stage - 1, 10) * .45;
    const cy = pickHeight();
    let t;
    if (makeEdge) {
      const side = attempt % 3 === 0 ? (lastSide === 'left' ? 'right' : 'left') : (rng() < .5 ? 'left' : 'right');
      lastSide = side;
      const maxReach = Math.min(maxLength + (heavy ? 20 : 0), WIDTH * .78);
      const reach = (heavy ? 155 : 105) + rng() * (maxReach - (heavy ? 155 : 105));
      const bleed = 24 + rng() * 17;
      t = side === 'left'
        ? { x: -bleed, y: cy, endX: reach, endY: cy, w: reach + bleed, h, angle: 0,
          spacing: heavy ? 12 + rng() * 6 : 14 + rng() * 9, edge: 'left', heavy }
        : { x: WIDTH - reach, y: cy, endX: WIDTH + bleed, endY: cy, w: reach + bleed, h, angle: 0,
          spacing: heavy ? 12 + rng() * 6 : 14 + rng() * 9, edge: 'right', heavy };
    } else {
      const w = (heavy ? 155 : 95) + rng() * (maxLength + (heavy ? 24 : 0) - (heavy ? 155 : 95));
      const cx = WIDTH * (.15 + rng() * .7);
      t = { x: cx - w / 2, y: cy, endX: cx + w / 2, endY: cy, w, h, angle: 0,
        spacing: heavy ? 12 + rng() * 6 : 14 + rng() * 9, heavy };
      if (t.x < 24 + h || t.endX > WIDTH - 24 - h) continue;
    }
    if (!validThorn(t)) continue;
    thorns.push(t);
    soloPlaced++;
    if (makeEdge) edgePlaced++;
  }
  return { stage, pattern, tangle, beats, pinchGates, height, platforms, flowers, thorns, route, seconds: 0, total: count };
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
      // Vary patrol heights so even familiar sections have different timing.
      let y = 190 + (piece.height - 380) * (i + .28 + rng() * .44) / count;
      // A wasp never blocks the narrow opening at the instant it is introduced.
      // Keep the two challenges independent instead of manufacturing unfair hits.
      if (piece.pinchGates?.some(g => Math.abs(g.y - y) < 120)) {
        // Prefer a nearby height to retain patrol distribution; fall back to
        // another open stretch only if every close candidate is occupied.
        const variants = [135, -135, 195, -195, 255, -255];
        for (let j = 0; j < 48; j++) {
          const proposed = j < variants.length ? y + variants[j]
            : 170 + rng() * (piece.height - 325);
          if (proposed > 170 && proposed < piece.height - 155 &&
              piece.pinchGates.every(g => Math.abs(g.y - proposed) >= 120)) { y = proposed; break; }
        }
      }
      y += offset;
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
