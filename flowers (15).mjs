// The same flower artwork is used in the game and in garden-shop previews.
export function paintFlower(c,f,{palette,time=0,reducedMotion=false,scale=1}={}) {
  c.save();c.translate(Math.round(f.x),Math.round(f.y));c.scale(scale,scale);
  // Glowwood collectible skin: a bright mushroom centered on the *same*
  // existing flower location. Collection, missed-flower rules, scoring and
  // pickup hitboxes are still decided by engine.mjs, not this artwork.
  if (palette.shape==='mushroom') {
    c.save();
    if(f.taken){c.fillStyle=palette.stem;c.fillRect(-2,4,5,12);c.restore();c.restore();return;}
    c.translate(0,reducedMotion?0:Math.sin(time*2+(f.phase??0))*1.2);
    const halo=c.createRadialGradient(0,-4,1,0,-4,32);
    halo.addColorStop(0,palette.glow+'73');halo.addColorStop(.48,palette.glow+'32');halo.addColorStop(1,palette.glow+'00');
    c.fillStyle=halo;c.fillRect(-32,-36,64,64);
    c.fillStyle='#24615f';c.fillRect(-5,0,11,22);
    c.fillStyle=palette.stem;c.fillRect(-3,1,7,20);
    c.fillStyle=palette.light;c.fillRect(-2,3,3,15);
    c.fillStyle='#174c62';c.fillRect(-13,-6,27,10);
    c.fillStyle=palette.petal;c.fillRect(-16,-4,33,8);
    c.fillStyle=palette.petal;c.fillRect(-12,-10,25,6);
    c.fillStyle=palette.light;c.fillRect(-7,-14,15,5);
    c.save();c.shadowColor=palette.glow;c.shadowBlur=7;
    c.strokeStyle=palette.light;c.lineWidth=1.6;
    c.beginPath();c.moveTo(-16,-4);c.lineTo(-12,-10);c.lineTo(-7,-14);
    c.lineTo(7,-14);c.lineTo(13,-10);c.lineTo(17,-4);c.stroke();
    c.strokeStyle=palette.glow;c.beginPath();c.moveTo(-15,4);c.lineTo(16,4);c.stroke();c.restore();
    c.fillStyle='#fff9e4';c.fillRect(-8,-8,4,3);c.fillRect(4,-10,3,3);
    c.fillStyle=palette.center;c.fillRect(-1,-6,3,3);
    c.restore();c.restore();return;
  }
  c.fillStyle=palette.stem;c.fillRect(-1,7,4,29);c.fillRect(3,22,7,3);c.fillRect(7,18,4,5);
  if(f.taken){c.fillStyle='#9ec4a5';c.fillRect(-1,5,5,5);c.restore();return;}
  c.translate(reducedMotion?0:Math.sin(time*2+(f.phase??0))*1.2,0);
  if(palette.glow){
    const halo=c.createRadialGradient(0,0,2,0,0,38);
    halo.addColorStop(0,palette.glow+'70');halo.addColorStop(.45,palette.glow+'30');halo.addColorStop(1,palette.glow+'00');
    c.fillStyle=halo;c.fillRect(-38,-38,76,76);c.shadowColor=palette.glow;c.shadowBlur=10;
  }
  if(palette.shape==='star'){
    c.beginPath();
    for(let i=0;i<16;i++){const a=i*Math.PI/8-Math.PI/2,r=i%2?6:16;const x=Math.cos(a)*r,y=Math.sin(a)*r;i?c.lineTo(x,y):c.moveTo(x,y);}
    c.closePath();c.fillStyle=palette.petal;c.fill();
    c.beginPath();c.moveTo(0,-11);c.lineTo(4,-2);c.lineTo(11,0);c.lineTo(4,3);c.lineTo(0,11);c.lineTo(-4,3);c.lineTo(-11,0);c.lineTo(-4,-2);c.closePath();c.fillStyle=palette.light;c.fill();
  }else if(palette.shape==='daisy'){
    for(let i=0;i<8;i++){const a=i*Math.PI/4;c.beginPath();c.ellipse(Math.cos(a)*8,Math.sin(a)*8,8,4,a,0,Math.PI*2);c.fillStyle=i%2?palette.light:palette.petal;c.fill();}
  }else if(palette.shape==='bell'){
    c.strokeStyle=palette.stem;c.lineWidth=2;c.beginPath();c.moveTo(0,12);c.quadraticCurveTo(-7,-9,2,-13);c.quadraticCurveTo(9,-15,9,-8);c.stroke();
    c.beginPath();c.moveTo(1,-7);c.bezierCurveTo(-1,-14,18,-15,18,-5);c.quadraticCurveTo(17,1,23,7);c.quadraticCurveTo(17,12,7,10);c.quadraticCurveTo(2,8,-1,5);c.quadraticCurveTo(5,1,1,-7);c.fillStyle=palette.petal;c.fill();
    c.beginPath();c.moveTo(6,-7);c.quadraticCurveTo(14,-10,14,-3);c.lineTo(17,5);c.quadraticCurveTo(12,7,8,5);c.fillStyle=palette.light;c.fill();
    c.shadowBlur=0;c.fillStyle=palette.center;c.fillRect(10,9,3,6);c.fillRect(16,8,3,5);c.restore();return;
  }else{
    c.fillStyle=palette.petal;c.fillRect(-5,-14,11,12);c.fillRect(-14,-5,12,11);c.fillRect(4,-5,11,11);c.fillRect(-5,4,11,11);
    c.fillStyle=palette.light;c.fillRect(-10,-10,8,8);c.fillRect(4,-10,8,8);c.fillRect(-10,4,8,8);c.fillRect(4,4,8,8);
  }
  c.shadowBlur=0;c.fillStyle=palette.center;c.beginPath();c.arc(0,0,palette.shape==='classic'?5:4.5,0,Math.PI*2);c.fill();
  c.fillStyle=palette.spark;c.fillRect(-2,-3,3,3);c.restore();
}
