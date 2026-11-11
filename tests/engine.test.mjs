import test from 'node:test';
import assert from 'node:assert/strict';
import {
  Game, makeLevel, WIDTH, RADIUS, FIXED_STEP, REVIVE_DELAY, MAX_LIVES,
  thornDistance, segmentDistance, pointSegmentDistance, advanceCamera, pacingAt
} from '../dist/engine.mjs';

function advance(game, seconds, input = {}) {
  for (let i = 0; i < Math.round(seconds / FIXED_STEP); i++) game.step(FIXED_STEP, input);
}
function support(game, point = game.checkpoint) {
  return game.level.platforms.find(p => p.y - point.y >= 19 && p.y - point.y <= 44
    && point.x >= p.x + 9 && point.x <= p.x + p.w - 9);
}

test('vine geometry detects horizontal, vertical, diagonal and crossing segments', () => {
  assert.equal(pointSegmentDistance(5, 7, 0, 0, 10, 0), 7);
  assert.equal(pointSegmentDistance(7, 5, 0, 0, 0, 10), 7);
  assert.equal(pointSegmentDistance(5, 5, 0, 0, 10, 10), 0);
  assert.equal(segmentDistance(0, 0, 10, 10, 0, 10, 10, 0), 0);
  assert.equal(segmentDistance(0, 0, 10, 0, 5, 0, 15, 0), 0);
  assert.equal(segmentDistance(0, 0, 10, 0, 0, 8, 10, 8), 8);
});

test('continuous gardens remain deterministically seeded with safe generated leaves', () => {
  for (const seed of [1, 137, 98321]) {
    const a = makeLevel(1, seed), b = makeLevel(1, seed);
    assert.deepEqual(a, b);
    assert.ok(a.platforms.length > 8 && a.flowers.length > 8);
    assert.ok(a.platforms.every(p => p.x > -10 && p.x + p.w < WIDTH + 10));
    assert.ok(a.thorns.every(t => t.endY === t.y));
    for (const t of a.thorns) assert.ok(thornDistance(WIDTH / 2, a.height - 104, t) > RADIUS);
  }
});

test('procedural gardens and beetles vary between runs', () => {
  const g = new Game({seed:137});g.start();
  const first=structuredClone(g.level.flowers);g.start();
  assert.notDeepEqual(g.level.flowers,first);
  const other=new Game({seed:137});other.start();assert.deepEqual(other.level.flowers,first);
});

test('thrust lifts the bee; releasing it produces a controlled descent', () => {
  const g = new Game({ seed: 2 });g.start();
  const initialY=g.bee.y;
  advance(g,.8,{fly:true});
  assert.ok(g.bee.y < initialY-50);
  assert.ok(g.bee.vy<0);
  advance(g,.65);
  assert.ok(g.bee.vy>0);
});

test('leaves bounce only on downward contact and establish a checkpoint', () => {
  const g = new Game({seed:1});g.start();
  const p=g.level.platforms[1];
  g.bee={x:p.x+p.w/2,y:p.y-17,vx:0,vy:150};
  g.step(FIXED_STEP);assert.ok(g.bee.vy<0);
  assert.equal(g.checkpoint.x,p.x+p.w/2);
  assert.equal(support(g)?.y,p.y);
  g.bee={x:p.x+p.w/2,y:p.y+20,vx:0,vy:-200};
  g.step(FIXED_STEP,{fly:true});
  assert.ok(g.bee.y>p.y);
});

test('collecting a flower scores once, and the flower remains collected after a revive', () => {
  const g=new Game({seed:1});g.start();
  const f=g.level.flowers[0],remaining=g.remaining;
  g.bee.x=f.x;g.bee.y=f.y;g.step(FIXED_STEP);g.step(FIXED_STEP);
  assert.ok(g.score>=10);assert.equal(g.remaining,remaining-1);
  const collected=g.flowersCollected;
  g.loseLife('beetle');advance(g,REVIVE_DELAY+FIXED_STEP);
  assert.equal(f.taken,true);assert.equal(g.flowersCollected,collected);
  assert.equal(g.lives,2);
});

test('beetle damage revives automatically on an actual leaf with protection', () => {
  const g=new Game({seed:1});g.start();
  g.loseLife('beetle');
  assert.equal(g.mode,'reviving');
  g.prepareRevive(g.checkpoint.y-300,g.checkpoint.y+300);
  advance(g,REVIVE_DELAY+FIXED_STEP);
  assert.equal(g.mode,'playing');assert.ok(g.invulnerable>2.5);
  assert.ok(support(g),'a revived bee must have a leaf beneath it');
});

test('pause freezes an automatic revival and resumes it', () => {
  const g=new Game({seed:1});g.start();g.loseLife('beetle');
  advance(g,.2);g.pause();const left=g.reviveTime;
  advance(g,2);assert.equal(g.reviveTime,left);assert.equal(g.mode,'paused');
  g.resume();assert.equal(g.mode,'reviving');
  advance(g,.6);assert.equal(g.mode,'playing');
});

test('the run is endless and extends its generated world without a complete menu', () => {
  const g=new Game({seed:17});g.start();const initial=g.generatedAltitudeM;
  for(let i=0;i<8;i++) {
    g.bee.y=g.topGenerated-300;
    g.extendWorld();
  }
  assert.ok(g.generatedAltitudeM>initial+1000);
  assert.ok(g.level.platforms.length>5);
  assert.equal(g.mode,'playing');
});

test('camera only advances toward achieved altitude and never jumps upward spontaneously', () => {
  assert.equal(advanceCamera(500,1000,700,.2),500);
  assert.ok(advanceCamera(500,100,700,.2)<500);
});

test('camera position with zero visible leaves chooses another real leaf, never open air', () => {
  for (const seed of [1,2,17,137,98321]) {
    const g=new Game({seed});g.start();
    g.checkpoint={x: WIDTH/2,y:-50000};
    g.loseLife('beetle');
    g.prepareRevive(-50000,-49400);
    assert.ok(support(g),`seed ${seed} respawned without a leaf`);
    assert.ok(g.checkpointHasLeaf(g.checkpoint));
    advance(g,REVIVE_DELAY+FIXED_STEP);
    assert.equal(g.mode,'playing');
    assert.ok(support(g));
  }
});

test('checkpoint whose leaf disappeared is not considered safe even if visible', () => {
  const g=new Game({seed:21});g.start();
  const target={x:WIDTH/2,y:g.bee.y-180};
  assert.equal(g.checkpointHasLeaf(target),false);
  assert.equal(g.checkpointIsSafeAndVisible(target,target.y-300,target.y+300),false);
  g.checkpoint=target;g.loseLife('beetle');
  g.prepareRevive(target.y-300,target.y+300);
  assert.ok(support(g));
});

test('emergency fallback creates a real rescue leaf if no safe leaf exists anywhere', () => {
  const g=new Game({seed:7});g.start();
  g.level.platforms=[];g.level.thorns=[];g.level.wasps=[];
  g.checkpoint={x:WIDTH/2,y:g.bee.y-100};
  g.loseLife('beetle');g.prepareRevive(g.bee.y-250,g.bee.y+350);
  const leaf=support(g);
  assert.ok(leaf?.rescue,'a collidable rescue platform must be created');
  advance(g,REVIVE_DELAY+FIXED_STEP);
  assert.equal(g.mode,'playing');
  advance(g,1.5);assert.equal(g.mode,'playing');
  assert.ok(g.lives===2,'do not lose a second life while not pressing Fly');
});

test('a high-progress beetle collision retains the run and always respawns on a leaf', () => {
  for (const seed of [1, 81, 193, 1229]) {
    const g=new Game({seed});g.start();g.flowersCollected=122;
    for(let i=0;i<7;i++) {g.bee.y=g.topGenerated-280;g.extendWorld();}
    g.checkpoint={x:WIDTH/2,y:g.startY-9000}; // old checkpoint was pruned
    g.loseLife('beetle');
    g.prepareRevive(g.bee.y-250,g.bee.y+350);
    assert.ok(support(g),`seed ${seed} has no rescue leaf after 122 flowers`);
    advance(g,REVIVE_DELAY+FIXED_STEP);
    assert.equal(g.mode,'playing');
    assert.equal(g.flowersCollected,122);
    assert.equal(g.lives,2);
    assert.ok(support(g));
  }
});

test('repeated respawns after beetle hits remain supported and preserve earned flowers', () => {
  const g=new Game({seed:122});g.start();g.flowersCollected=122;
  for(let i=0;i<2;i++){
    g.loseLife('beetle');
    g.prepareRevive(g.bee.y-300,g.bee.y+300);
    advance(g,REVIVE_DELAY+FIXED_STEP);
    assert.ok(support(g),`attempt ${i+1} has no leaf`);
    assert.equal(g.mode,'playing');
    assert.equal(g.flowersCollected,122);
  }
  assert.equal(g.lives,1);
});

test('lateral input respects both walls and restarting resets the run', () => {
  const g=new Game({seed:1,best:500});g.start();
  g.bee.y=500;advance(g,2,{left:true,fly:true});assert.ok(g.bee.x>=25);
  advance(g,4,{right:true,fly:true});assert.ok(g.bee.x<=WIDTH-25);
  g.score=10;g.lives=1;g.start();assert.equal(g.score,0);
  assert.equal(g.lives,MAX_LIVES);assert.equal(g.flowersCollected,0);assert.equal(g.best,500);
});
