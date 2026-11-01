import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, makeLevel, WIDTH, RADIUS, FIXED_STEP, REVIVE_DELAY, MAX_LIVES, thornDistance, segmentDistance, pointSegmentDistance } from '../dist/engine.mjs';

function advance(game, seconds, input = {}) {
  for (let i = 0; i < seconds / FIXED_STEP; i++) game.step(FIXED_STEP, input);
}

function completeCurrent(game) {
  for (const flower of game.level.flowers) flower.taken = true;
  game.remaining = 0;
  game.step(FIXED_STEP);
}

test('vine geometry detects horizontal, vertical, diagonal and crossing segments', () => {
  assert.equal(pointSegmentDistance(5, 7, 0, 0, 10, 0), 7);
  assert.equal(pointSegmentDistance(7, 5, 0, 0, 0, 10), 7);
  assert.equal(pointSegmentDistance(5, 5, 0, 0, 10, 10), 0);
  assert.equal(segmentDistance(0, 0, 10, 10, 0, 10, 10, 0), 0);
  assert.equal(segmentDistance(0, 0, 10, 0, 5, 0, 15, 0), 0);
  assert.equal(segmentDistance(0, 0, 10, 0, 0, 8, 10, 8), 8);
});

test('random gardens keep every flower and respawn leaf accessible without a fixed center lane', () => {
  const patterns = new Set();
  let centerHazards = 0;
  for (let stage = 1; stage <= 30; stage++) {
    for (const seed of [1, 137, 98321]) {
      const level = makeLevel(stage, seed);
      patterns.add(level.pattern);
      assert.equal(level.flowers.length, Math.min(16 + (stage - 1) * 3, 64));
      assert.ok(level.thorns.length >= 10, `garden ${stage} lacks hazards`);
      for (const f of level.flowers) {
        assert.ok(f.x > 30 && f.x < WIDTH - 30 && f.y > 30 && f.y < level.height);
        for (const t of level.thorns) assert.ok(thornDistance(f.x, f.y, t) >= t.h + 42, `flower blocked in stage ${stage}`);
      }
      for (const t of level.thorns) {
        assert.equal(t.angle,0,'every thorn vine must be horizontal');
        assert.equal(t.endY,t.y,'thorn endpoints must have the same height');
        assert.ok(Math.min(t.x, t.endX) - t.h >= 24 && Math.max(t.x, t.endX) + t.h <= WIDTH - 24);
        if (Math.min(t.x, t.endX) <= 360 && Math.max(t.x, t.endX) >= 360) centerHazards++;
        for (const p of level.platforms) assert.ok(thornDistance(p.x+p.w/2,p.y-28,t)>t.h+RADIUS+5, 'unsafe respawn');
        for (let i = 1; i < level.route.length; i++) {
          const a=level.route[i-1],b=level.route[i];
          assert.ok(segmentDistance(t.x,t.y,t.endX,t.endY,a.x,a.y,b.x,b.y)>=t.h+RADIUS+8, 'blocked route');
        }
      }
    }
  }
  assert.equal(patterns.size,4);
  assert.ok(centerHazards>30,'the middle should not be a guaranteed escape lane');
});

test('leaves vary in horizontal position, vertical spacing and size; new runs get fresh layouts', () => {
  const level=makeLevel(1,137);
  const leaves=level.platforms.slice(1);
  const centers=leaves.map(p=>p.x+p.w/2);
  const gaps=leaves.slice(1).map((p,i)=>leaves[i].y-p.y);
  assert.ok(Math.max(...centers)-Math.min(...centers)>350);
  assert.ok(Math.max(...gaps)-Math.min(...gaps)>40);
  assert.ok(Math.max(...leaves.map(p=>p.w))-Math.min(...leaves.map(p=>p.w))>25);
  assert.ok(Math.max(...level.thorns.map(t=>t.w))-Math.min(...level.thorns.map(t=>t.w))>100);
  const g=new Game({seed:137});g.start();const first=structuredClone(g.level.flowers);g.start();
  assert.notDeepEqual(g.level.flowers,first);
  const other=new Game({seed:137});other.start();assert.deepEqual(other.level.flowers,first);
});

test('thrust lifts the bee; releasing it produces a controlled descent', () => {
  const g = new Game({ seed: 2 });g.start();
  const initialY = g.bee.y;
  advance(g,.8,{fly:true});
  assert.ok(g.bee.y < initialY - 80);
  assert.ok(g.bee.vy < 0);
  advance(g,.65);
  assert.ok(g.bee.vy > 0);
});

test('leaves bounce only on downward contact and establish a checkpoint', () => {
  const g = new Game({ seed: 1 });g.start();
  const p = g.level.platforms[1];
  g.bee = { x: p.x + 40, y: p.y - 17, vx: 0, vy: 150 };
  g.step(FIXED_STEP);
  assert.ok(g.bee.vy < 0);
  assert.equal(g.checkpoint.x,p.x+p.w/2);
  g.bee = { x: p.x + 40, y: p.y + 20, vx: 0, vy: -200 };
  g.step(FIXED_STEP,{fly:true});
  assert.ok(g.bee.y > p.y);
  assert.ok(g.bee.vy < -200);
});

test('collecting a flower scores only once and retains it through a death', () => {
  const g = new Game({seed:1});g.start();
  const f=g.level.flowers[0];
  g.bee.x=f.x;g.bee.y=f.y;
  g.step(FIXED_STEP);g.step(FIXED_STEP);
  assert.equal(g.score,10);assert.equal(g.remaining,15);assert.equal(g.flowersCollected,1);
  g.loseLife('thorn');advance(g,REVIVE_DELAY+FIXED_STEP);
  assert.equal(f.taken,true);assert.equal(g.remaining,15);assert.equal(g.flowersCollected,1);assert.equal(g.lives,2);
});

test('one hit automatically revives the bee, retaining flowers and granting protection', () => {
  const g = new Game({seed:1});g.start();
  const t=g.level.thorns[0];
  g.invulnerable=0;g.bee.x=(t.x+t.endX)/2;g.bee.y=(t.y+t.endY)/2;g.bee.vy=0;
  g.step(FIXED_STEP);
  assert.equal(g.lives,2);assert.equal(g.mode,'reviving');
  const time=g.time;advance(g,.3);assert.equal(g.time,time);assert.equal(g.lives,2);
  advance(g,.5);assert.equal(g.mode,'playing');assert.ok(g.invulnerable>1.8);
  assert.ok(Math.abs(g.bee.x-g.checkpoint.x)<1);
  assert.equal(g.drainEvents().filter(e=>e.type==='revive').length,1);
});

test('pause freezes an automatic revival and resumes it without requiring a continue button', () => {
  const g=new Game({seed:1});g.start();g.loseLife('thorn');advance(g,.2);g.pause();
  const time=g.reviveTime;advance(g,2);assert.equal(g.reviveTime,time);assert.equal(g.mode,'paused');
  g.resume();assert.equal(g.mode,'reviving');advance(g,.6);assert.equal(g.mode,'playing');
  const x=g.bee.x;advance(g,.1,{right:true,fly:true});assert.ok(g.bee.x>x);
});

test('timeout automatically restores the timer; the third loss ends the game', () => {
  const g = new Game({seed:1});g.start();g.pause();
  const before=g.time;advance(g,2);assert.equal(g.time,before);
  g.resume();g.time=.001;g.step(FIXED_STEP);
  assert.equal(g.mode,'reviving');assert.equal(g.lives,2);
  advance(g,REVIVE_DELAY+FIXED_STEP);assert.ok(g.time>g.level.seconds-.1);
  g.score=250;g.loseLife('thorn');advance(g,REVIVE_DELAY+FIXED_STEP);g.loseLife('thorn');
  assert.equal(g.mode,'over');assert.equal(g.lives,0);assert.equal(g.best,250);
  advance(g,2);assert.equal(g.mode,'over');assert.equal(g.lives,0);
});

test('every cleared garden grants one life up to three and lives carry forward', () => {
  const g = new Game({seed:1});g.start();
  g.loseLife('thorn');advance(g,REVIVE_DELAY+FIXED_STEP);
  g.loseLife('thorn');advance(g,REVIVE_DELAY+FIXED_STEP);
  assert.equal(g.lives,1);

  completeCurrent(g);
  assert.equal(g.mode,'complete');assert.equal(g.lives,2);assert.equal(g.earnedLife,true);assert.ok(g.bonus>0);
  const score=g.score;g.next();
  assert.equal(g.stage,2);assert.equal(g.remaining,19);assert.equal(g.score,score);assert.equal(g.lives,2);

  completeCurrent(g);
  assert.equal(g.lives,3);assert.equal(g.earnedLife,true);
  g.step(FIXED_STEP);assert.equal(g.lives,3,'the complete screen cannot award twice');
  g.next();assert.equal(g.lives,3);assert.equal(g.stage,3);
  completeCurrent(g);
  assert.equal(g.lives,MAX_LIVES);assert.equal(g.earnedLife,false);
});

test('the run has no final garden and late stages stay bounded and playable', () => {
  const g=new Game({seed:17});g.start();
  g.stage=999;g.loadLevel();
  assert.equal(g.level.flowers.length,64);
  assert.equal(g.level.thorns.length,72);
  assert.ok(g.level.seconds>0);
  assert.ok(g.level.thorns.every(thorn=>thorn.angle===0&&thorn.endY===thorn.y));
  completeCurrent(g);g.next();
  assert.equal(g.stage,1000);assert.equal(g.mode,'playing');assert.equal(g.remaining,64);
});

test('lateral input respects both walls and restarting resets the run', () => {
  const g = new Game({seed:1,best:500});g.start();
  g.bee.y=500;advance(g,2,{left:true,fly:true});assert.ok(g.bee.x>=25);
  advance(g,4,{right:true,fly:true});assert.ok(g.bee.x<=WIDTH-25);
  g.score=10;g.stage=6;g.lives=1;g.start();
  assert.equal(g.score,0);assert.equal(g.stage,1);assert.equal(g.lives,MAX_LIVES);assert.equal(g.flowersCollected,0);assert.equal(g.best,500);
});
