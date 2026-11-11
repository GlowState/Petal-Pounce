// RC34 · Neon Garden — appearance-only canvas drawing helpers.
// The simulation's platforms, hazards, hitboxes, movement and timing are unchanged.
const PI2 = Math.PI * 2;
const pathPolygon = (c, vertices) => {
  c.beginPath();
  vertices.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
  c.closePath();
  c.fill();
};

// Landing leaves use a cyan upper lip. Their physical positions and dimensions
// come from the same platform objects used by every other garden.
export function paintNeonLeaf(c, p, y) {
  const w=Math.max(14,Math.round(p.w));
  c.save();
  c.translate(Math.round(p.x+w/2),Math.round(y));
  if(p.flip)c.scale(-1,1);
  c.translate(-w/2,0);
  c.shadowColor='#00e7ff';c.shadowBlur=7;
  c.fillStyle='#061c34';
  pathPolygon(c,[[0,-6],[w,-6],[w-5,10],[w-12,13],[12,13],[5,10]]);
  c.shadowBlur=0;
  c.strokeStyle='#08dbff';c.lineWidth=2.6;c.lineCap='round';
  c.beginPath();c.moveTo(4,-7);c.lineTo(w-5,-7);c.stroke();
  c.strokeStyle='#9c4be1';c.lineWidth=1.4;
  c.beginPath();c.moveTo(8,7);c.lineTo(w-8,7);c.stroke();
  c.shadowColor='#ff3fdb';c.shadowBlur=6;c.strokeStyle='#f03be3';c.lineWidth=2;
  c.beginPath();c.moveTo(10,12);c.lineTo(w-11,12);c.stroke();
  c.shadowBlur=0;
  // A few dark scallops add silhouette without becoming false collectibles.
  for(let x=18;x<w-13;x+=31){
    c.fillStyle='#68167a';pathPolygon(c,[[x-4,9],[x+4,9],[x,13]]);
  }
  if(p.launch){
    c.shadowColor='#8efbff';c.shadowBlur=7;c.fillStyle='#fffbc1';
    c.fillRect(Math.round(w/2)-4,-11,8,3);c.shadowBlur=0;
  }
  c.restore();
}

// Draw hazards *inside* the existing capsule collision outlines, preserving
// the geometry and making dangerous edges clearly magenta (vs cyan landings).
export function paintNeonThorn(c,t,camera) {
  c.save();
  c.beginPath();
  for(const segment of t.segments || [t]) {
    const h=Math.max(9,segment.h);
    c.roundRect(segment.x-h,segment.y-camera-h,
      segment.endX-segment.x+2*h,2*h,h);
  }
  c.clip();
  const w=Math.max(10,t.endX-t.x||t.w), h=Math.max(9,t.h);
  c.translate(t.x,t.y-camera);
  c.fillStyle='#300e40';c.fillRect(-h,-h,w+2*h,2*h);
  c.fillStyle='#62155b';c.fillRect(-h+2,-h+4,w+2*h-4,Math.max(3,h*1.3));
  c.shadowColor='#ff2bd6';c.shadowBlur=9;
  c.strokeStyle='#ff47e6';c.lineWidth=3;c.lineCap='square';
  c.beginPath();c.moveTo(-h+1,-h+4);c.lineTo(w+h-1,-h+4);c.stroke();
  c.shadowBlur=3;c.strokeStyle='#fc9df5';c.lineWidth=1;
  c.beginPath();c.moveTo(-h+1,-h+6);c.lineTo(w+h-1,-h+6);c.stroke();
  c.shadowBlur=0;
  const step=t.heavy?14:20;
  for(let x=4;x<w;x+=step){
    c.fillStyle='#f834d6';
    pathPolygon(c,[[x-5,-h+8],[x+5,-h+8],[x,-h+1]]);
    pathPolygon(c,[[x-6,h-4],[x+6,h-4],[x,h-1]]);
    c.fillStyle='#fdb6ff';c.fillRect(x-1,-h+4,2,2);
  }
  c.shadowColor='#ff2bd6';c.shadowBlur=5;
  c.strokeStyle='#d729d0';c.lineWidth=2;
  c.beginPath();c.moveTo(-h+3,h-4);c.lineTo(w+h-3,h-4);c.stroke();
  c.restore();
}

export function paintNeonBeetle(c,b,camera,time,reducedMotion) {
  const y=b.y-camera;
  c.save();c.translate(Math.round(b.x),Math.round(y));
  c.scale(Math.cos(b.phase)<0?-1:1,1);
  const flap=reducedMotion?0:Math.sin(time*38+b.phase)*2;
  c.shadowColor='#ff46c9';c.shadowBlur=7;
  c.strokeStyle='#ff50d5';c.lineWidth=2;
  c.beginPath();c.ellipse(0,1,15,10,0,0,PI2);c.stroke();
  c.shadowBlur=0;c.fillStyle='#2b103e';
  c.beginPath();c.ellipse(0,1,13,9,0,0,PI2);c.fill();
  c.strokeStyle='#86eaff';c.lineWidth=1.5;
  c.beginPath();c.ellipse(-6,-10-flap,9,4,-.3,0,PI2);
  c.ellipse(4,-10+flap,9,4,.25,0,PI2);c.stroke();
  c.strokeStyle='#ff6bd9';c.beginPath();c.moveTo(-9,-1);c.lineTo(8,2);c.stroke();
  c.fillStyle='#fff4bd';c.fillRect(9,-2,3,3);
  c.strokeStyle='#ff50d5';c.beginPath();c.moveTo(8,-6);c.lineTo(13,-12);c.stroke();
  c.restore();
}

// Gentle edge glow behind the existing chosen bee skin; never replaces it.
export function paintNeonBeeGlow(c,b,offset) {
  const y=b.y-offset;
  c.save();c.translate(Math.round(b.x),Math.round(y));
  c.shadowColor='#02e8ff';c.shadowBlur=9;
  c.strokeStyle='#24e3fa66';c.lineWidth=1.1;
  c.beginPath();c.ellipse(0,-1,17,23,0,0,PI2);c.stroke();
  c.restore();
}


// RC42 cosmetic trims for the four existing non-neon gardens. Drawing is
// bounded to the original leaf/hazard art. No collision bodies are modified.
export function paintGardenLeafTrim(c,p,y,theme) {
  if(!theme || theme.id==='neon')return;
  const accent=theme.glowColors;
  if(!accent)return;
  const w=Math.max(14,Math.round(p.w));
  c.save();c.translate(Math.round(p.x+w/2),Math.round(y));
  if(p.flip)c.scale(-1,1);
  c.translate(-w/2,0);
  c.shadowColor=accent.leaf;c.shadowBlur=4;c.strokeStyle=accent.leaf;
  c.globalAlpha=theme.id==='classic'?.63:.82;c.lineWidth=1.5;c.lineCap='round';
  c.beginPath();c.moveTo(Math.min(18,w*.20),-2);
  c.lineTo(Math.min(43,w*.34),-9);
  c.lineTo(Math.max(w*.5,w-24),-12);
  c.lineTo(w-10,-7);c.stroke();
  c.shadowBlur=0;c.globalAlpha=.43;c.strokeStyle=accent.light;c.lineWidth=.9;
  c.beginPath();c.moveTo(22,8);c.lineTo(Math.max(23,w-20),8);c.stroke();
  if(p.launch){c.globalAlpha=.7;c.fillStyle=accent.light;c.fillRect(w/2-4,-5,8,2);}
  c.restore();
}

export function paintGardenThornTrim(c,t,camera,theme) {
  if(!theme || theme.id==='neon')return;
  const accent=theme.glowColors;
  if(!accent)return;
  const h=Math.max(9,t.h),w=Math.max(10,t.endX-t.x||t.w);
  c.save();c.beginPath();
  // Clip to the unchanged hazard capsule outlines so the trim never extends
  // the visible danger shape outside its original collision boundary.
  for(const segment of t.segments||[t]){
    const hh=Math.max(9,segment.h);
    c.roundRect(segment.x-hh,segment.y-camera-hh,
      segment.endX-segment.x+2*hh,2*hh,hh);
  }c.clip();
  c.translate(t.x,t.y-camera);
  c.globalAlpha=theme.id==='classic'?.67:.81;
  c.shadowColor=accent.danger;c.shadowBlur=5;c.strokeStyle=accent.danger;
  c.lineWidth=1.6;c.lineCap='round';
  c.beginPath();c.moveTo(2,-h*.56);c.lineTo(w-2,-h*.56);c.stroke();
  c.globalAlpha=.48;c.shadowBlur=0;
  c.strokeStyle=accent.danger;c.lineWidth=1.1;
  for(let x=15;x<w-5;x+=39){
    c.beginPath();c.moveTo(x,h*.32);c.lineTo(x+5,h*.51);c.stroke();
  }
  c.restore();
}
