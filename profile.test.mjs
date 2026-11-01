import test from 'node:test';
import assert from 'node:assert/strict';
import { FlowerProfile, normalizeProfile } from '../dist/profile.mjs';
import { Game, FIXED_STEP, REVIVE_DELAY } from '../dist/engine.mjs';

test('free gardens are always owned and malformed saved values are normalized',()=>{
  const data=normalizeProfile({flowers:-8,lifetimeFlowers:NaN,owned:['glowwood','unknown'],equipped:'unknown'});
  assert.equal(data.flowers,0);assert.equal(data.lifetimeFlowers,0);
  assert.ok(data.owned.includes('twilight'));assert.ok(data.owned.includes('classic'));assert.ok(data.owned.includes('glowwood'));
  assert.equal(data.owned.includes('unknown'),false);assert.equal(data.equipped,'twilight');
});

test('flowers buy a garden once, and an equipped owned garden survives reload',()=>{
  let saved='';
  const profile=new FlowerProfile({raw:{flowers:180},save:value=>(saved=value,true)});
  assert.deepEqual(profile.buy('blossom'),{ok:true,saved:true});
  assert.equal(profile.data.flowers,120);assert.equal(profile.data.equipped,'blossom');
  assert.deepEqual(profile.buy('blossom'),{ok:false,reason:'owned'});
  assert.equal(profile.data.flowers,120,'a repeated purchase cannot charge twice');
  assert.deepEqual(profile.buy('glowwood'),{ok:true,saved:true});
  assert.equal(profile.data.flowers,0);assert.equal(profile.data.equipped,'glowwood');
  const reloaded=new FlowerProfile({raw:JSON.parse(saved)});
  assert.equal(reloaded.data.equipped,'glowwood');assert.ok(reloaded.data.owned.includes('blossom'));
});

test('locked or unaffordable gardens cannot be equipped or purchased',()=>{
  const profile=new FlowerProfile({raw:{flowers:59}});
  assert.deepEqual(profile.equip('blossom'),{ok:false,reason:'locked'});
  assert.deepEqual(profile.buy('blossom'),{ok:false,reason:'funds'});
  assert.deepEqual(profile.buy('missing'),{ok:false,reason:'unknown'});
  assert.equal(profile.data.flowers,59);
});

test('banked flowers persist independently of deaths and new runs',()=>{
  let stored='';
  const profile=new FlowerProfile({save:value=>(stored=value,true)});
  const game=new Game({seed:4});game.start();
  const flower=game.level.flowers[0];game.bee.x=flower.x;game.bee.y=flower.y;game.step(FIXED_STEP);
  for(const item of game.drainEvents())if(item.type==='flower')profile.collect();
  assert.equal(profile.data.flowers,1);
  game.loseLife('thorn');for(let i=0;i<(REVIVE_DELAY+.1)/FIXED_STEP;i++)game.step(FIXED_STEP);
  game.start();
  assert.equal(profile.data.flowers,1);assert.equal(JSON.parse(stored).flowers,1);
});

test('storage failure never blocks play',()=>{
  const profile=new FlowerProfile({save:()=>{throw new Error('storage disabled');}});
  assert.deepEqual(profile.collect(),{ok:true,saved:false});
  assert.equal(profile.data.flowers,1);
});
