import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, makeLevel, WIDTH, FIXED_STEP, REVIVE_DELAY, MAX_LIVES, pointSegmentDistance, segmentDistance } from '../dist/engine.mjs';

function advance(game, seconds, input = {}) {
  for (let i = 0; i < seconds / FIXED_STEP; i++) game.step(FIXED_STEP, input);
}
function collectOne(game, flower) {
  game.bee.x = flower.x; game.bee.y = flower.y;
  game.step(FIXED_STEP);
}
function completeSection(game) {
  const flower = game.level.flowers.at(-1);
  for (const f of game.level.flowers) f.taken = true;
  flower.taken = false;
  game.remaining = 1;
  collectOne(game, flower);
}

test('segment geometry helpers remain accurate', () => {
  assert.equal(pointSegmentDistance(5,7,0,0,10,0),7);
  assert.equal(pointSegmentDistance(5,5,0,0,10,10),0);
  assert.equal(segmentDistance(0,0,10,10,0,10,10,0),0);
});

test('endless garden generation includes reachable honey pots and roaming beetles', () => {
  const patterns = new Set();
  for (let stage = 1; stage <= 15; stage++) {
    for (const seed of [1,137,98321]) {
      const level = makeLevel(stage,seed);
      patterns.add(level.pattern);
      assert.equal(level.flowers.length,Math.min(14+(stage-1)*2,40));
      assert.ok(level.beetles.length > 0,`stage ${stage} should have beetles`);
      assert.ok(level.platforms.length===level.flowers.length+1);
      assert.ok(level.flowers.every(f=>f.x>25&&f.x<WIDTH-25&&f.y>25&&f.y<level.height));
      for (const b of level.beetles) {
        assert.ok(b.left<=b.x && b.x<=b.right);
        assert.ok(b.speed>0);
        assert.ok(b.right-b.left>=75);
      }
    }
  }
  assert.equal(patterns.size,4);
});

test('beetles increase in speed and number over later sections',()=>{
  const early=makeLevel(1,123),later=makeLevel(20,123);
  assert.ok(later.beetles.length>early.beetles.length);
  assert.ok(Math.min(...later.beetles.map(b=>b.speed))>Math.max(...early.beetles.map(b=>b.speed)));
});

test('new runs generate fresh seeded gardens',()=>{
  const game=new Game({seed:123});game.start();
  const first=structuredClone(game.level.flowers);
  game.start();assert.notDeepEqual(game.level.flowers,first);
  const other=new Game({seed:123});other.start();
  assert.deepEqual(other.level.flowers,first);
});

test('holding fly climbs; releasing makes the bee descend',()=>{
  const game=new Game({seed:2});game.start();
  const startY=game.bee.y;
  advance(game,.7,{fly:true});
  assert.ok(game.bee.y<startY-60);
  assert.ok(game.bee.vy<0);
  advance(game,.6);
  assert.ok(game.bee.vy>0);
});

test('analog steering moves smoothly in proportion to joystick tilt',()=>{
  const slight=new Game({seed:5});slight.start();
  const full=new Game({seed:5});full.start();
  advance(slight,.35,{horizontal:.3,fly:true});
  advance(full,.35,{horizontal:1,fly:true});
  assert.ok(slight.bee.x>365);
  assert.ok(full.bee.x>slight.bee.x+10);
  advance(slight,.3,{horizontal:0,fly:true});
  assert.ok(Math.abs(slight.bee.vx)<180);
});

test('landing on leaves bounces and sets a checkpoint',()=>{
  const game=new Game({seed:1});game.start();
  const p=game.level.platforms[1];
  game.bee={x:p.x+40,y:p.y-17,vx:0,vy:150,face:1};
  game.step(FIXED_STEP);
  assert.ok(game.bee.vy<0);
  assert.equal(game.checkpoint.x,p.x+p.w/2);
});

test('honey pots award score once and stay banked after losing a life',()=>{
  const game=new Game({seed:1});game.start();
  const flower=game.level.flowers[0];
  collectOne(game,flower);
  assert.equal(game.score,10);assert.equal(game.flowersCollected,1);
  game.step(FIXED_STEP);
  assert.equal(game.score,10);
  game.loseLife('beetle');advance(game,REVIVE_DELAY+.02);
  assert.equal(flower.taken,true);assert.equal(game.flowersCollected,1);assert.equal(game.lives,2);
});

test('beetle contact costs a life and revival adds short protection',()=>{
  const game=new Game({seed:7});game.start();
  const beetle=game.level.beetles[0];
  game.bee.x=beetle.x;game.bee.y=beetle.y;game.invulnerable=0;
  game.step(FIXED_STEP);
  assert.equal(game.mode,'reviving');assert.equal(game.lives,2);
  advance(game,REVIVE_DELAY+.02);
  assert.equal(game.mode,'playing');assert.ok(game.invulnerable>1.7);
});

test('each cleared section automatically continues, grants up to one life and advances distance',()=>{
  const game=new Game({seed:2});game.start();
  game.loseLife('beetle');advance(game,REVIVE_DELAY+.02);
  assert.equal(game.lives,2);
  completeSection(game);
  assert.equal(game.mode,'playing');assert.equal(game.stage,2);
  assert.equal(game.lives,3);
  assert.ok(game.distance>=1000);
  assert.ok(game.score>=70);
  completeSection(game);
  assert.equal(game.stage,3);assert.equal(game.lives,MAX_LIVES);
  assert.ok(game.distance>=2000);
});

test('pause freezes progression and the third hit ends the run',()=>{
  const game=new Game({seed:3});game.start();
  game.pause();const time=game.time;advance(game,2);assert.equal(game.time,time);
  game.resume();
  game.loseLife('beetle');advance(game,REVIVE_DELAY+.02);
  game.loseLife('beetle');advance(game,REVIVE_DELAY+.02);
  game.loseLife('beetle');
  assert.equal(game.lives,0);assert.equal(game.mode,'over');
  advance(game,1);assert.equal(game.mode,'over');
});

test('late stages remain bounded and have no final level',()=>{
  const game=new Game({seed:17});game.start();
  game.stage=999;game.loadLevel();
  assert.equal(game.level.flowers.length,40);
  assert.equal(game.level.beetles.length,18);
  completeSection(game);
  assert.equal(game.stage,1000);assert.equal(game.mode,'playing');
});

test('horizontal movement respects side walls and a restart resets the run',()=>{
  const game=new Game({seed:1,best:500});game.start();
  game.bee.y=500;advance(game,2,{horizontal:-1,fly:true});assert.ok(game.bee.x>=25);
  advance(game,4,{horizontal:1,fly:true});assert.ok(game.bee.x<=WIDTH-25);
  game.stage=6;game.lives=1;game.start();
  assert.equal(game.stage,1);assert.equal(game.lives,MAX_LIVES);assert.equal(game.best,500);
});
