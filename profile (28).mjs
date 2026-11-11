import { GARDENS } from './scenery.mjs?v=93';

export const PROFILE_KEY='petal-pounce-profile-v1';
const safeInteger=value=>typeof value==='number'&&Number.isFinite(value)?Math.max(0,Math.min(1e9,Math.floor(value))):0;

export function normalizeProfile(raw) {
  if(!raw||typeof raw!=='object')raw={};
  const owned=new Set(GARDENS.filter(g=>g.price===0).map(g=>g.id));
  if(Array.isArray(raw.owned))for(const id of raw.owned)if(GARDENS.some(g=>g.id===id))owned.add(id);
  return {version:1,flowers:safeInteger(raw.flowers),lifetimeFlowers:Math.max(safeInteger(raw.lifetimeFlowers),safeInteger(raw.flowers)),owned:[...owned],equipped:owned.has(raw.equipped)?raw.equipped:'twilight'};
}

export class FlowerProfile {
  constructor({raw,save=()=>true}={}) {this.data=normalizeProfile(raw);this.save=save;}
  persist() {try{return this.save(JSON.stringify(this.data))!==false;}catch{return false;}}
  collect(amount=1) {
    amount=safeInteger(amount);if(!amount)return {ok:false};
    this.data.flowers=safeInteger(this.data.flowers+amount);
    this.data.lifetimeFlowers=safeInteger(this.data.lifetimeFlowers+amount);
    return {ok:true,saved:this.persist()};
  }
  buy(id) {
    const garden=GARDENS.find(g=>g.id===id);
    if(!garden)return {ok:false,reason:'unknown'};
    if(this.data.owned.includes(id))return {ok:false,reason:'owned'};
    if(this.data.flowers<garden.price)return {ok:false,reason:'funds'};
    this.data.flowers-=garden.price;this.data.owned.push(id);this.data.equipped=id;
    return {ok:true,saved:this.persist()};
  }
  equip(id) {
    if(!this.data.owned.includes(id))return {ok:false,reason:'locked'};
    this.data.equipped=id;return {ok:true,saved:this.persist()};
  }
}
