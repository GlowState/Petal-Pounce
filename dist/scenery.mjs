import { random } from './engine.mjs?v=10';

export const GARDENS = [
  { id:'twilight', name:'Twilight Garden', price:0, night:true, sky:['#172943','#25485c','#425775'],
    flower:{name:'Moonstars',shape:'star',petal:'#bd70fa',light:'#f1baff',glow:'#c06cff',center:'#ffe8ad',spark:'#fff9dc',stem:'#79b6ab'}, hint:'#d5d8f4' },
  { id:'blossom', name:'Flower Garden', price:60, night:false, sky:['#afdbe6','#f4e4d9','#f9d4b3'],
    flower:{name:'Rose daisies',shape:'daisy',petal:'#ed79aa',light:'#ffe0ec',glow:'#ef9bc9',center:'#ffd369',spark:'#fff9d6',stem:'#568965'}, hint:'#4d6875' },
  { id:'glowwood', name:'Glowwood Forest', price:120, night:true, sky:['#081d35','#154450','#2d696b'],
    flower:{name:'Glowbells',shape:'bell',petal:'#67d8ee',light:'#c9ffff',glow:'#62e4ff',center:'#adfff1',spark:'#f0fff9',stem:'#6fc6b0'}, hint:'#a8e9da' },
  { id:'classic', name:'Classic Garden', price:0, night:false, sky:['#75bab7','#91cfbf','#c3d9ad'],
    flower:{name:'White daisies',shape:'classic',petal:'#eff2d7',light:'#fff9e4',glow:null,center:'#f8c555',spark:'#ffe99c',stem:'#456f38'}, hint:'#3c7356' }
];

export const gardenById = id => GARDENS.find(garden=>garden.id===id)??GARDENS[0];

function ellipse(c,x,y,rx,ry,color,rotation=0) {
  c.beginPath();c.ellipse(x,y,rx,ry,rotation,0,Math.PI*2);c.fillStyle=color;c.fill();
}

function glow(c,x,y,r,color,strength='40') {
  const gradient=c.createRadialGradient(x,y,0,x,y,r);
  gradient.addColorStop(0,color+strength);gradient.addColorStop(1,color+'00');
  ellipse(c,x,y,r,r,gradient);
}

function sparkle(c,x,y,r,color) {
  c.beginPath();c.moveTo(x,y-r);c.quadraticCurveTo(x+1,y-1,x+r,y);
  c.quadraticCurveTo(x+1,y+1,x,y+r);c.quadraticCurveTo(x-1,y+1,x-r,y);
  c.quadraticCurveTo(x-1,y-1,x,y-r);c.fillStyle=color;c.fill();
}

function hills(c,w,h,base,amplitude,phase,color) {
  c.beginPath();c.moveTo(0,h);
  for(let x=0;x<=w+20;x+=20)c.lineTo(x,base+Math.sin(x/125+phase)*amplitude+Math.cos(x/230+phase)*amplitude*.5);
  c.lineTo(w,h);c.closePath();c.fillStyle=color;c.fill();
}

function moon(c,x,y,r,sky) {
  glow(c,x,y,r*4,'#d3c8ff','36');ellipse(c,x,y,r,r,'#e5ddf5');
  ellipse(c,x-r*.36,y-r*.24,r*.91,r*.91,sky);
  glow(c,x+r*.5,y+r*.3,r*1.5,'#e8caff','16');
}

function bloom(c,x,y,r,petal,center,alpha=1) {
  c.save();c.globalAlpha*=alpha;c.strokeStyle='#608e89';c.lineWidth=Math.max(2,r*.065);c.lineCap='round';
  c.beginPath();c.moveTo(x,y+r*.4);c.quadraticCurveTo(x-r*.3,y+r*2,x+r*.2,y+r*3.8);c.stroke();
  ellipse(c,x-r*.3,y+r*1.5,r*.42,r*.14,'#79a99c',-.45);
  for(let i=0;i<7;i++){const a=i/7*Math.PI*2;ellipse(c,x+Math.cos(a)*r*.58,y+Math.sin(a)*r*.58,r*.51,r*.23,petal,a);}
  ellipse(c,x,y,r*.31,r*.31,center);c.restore();
}

function mushroom(c,x,y,r,color) {
  glow(c,x,y-r*.25,r*2.4,color,'39');
  c.strokeStyle='#5caeab';c.lineWidth=r*.23;c.lineCap='round';
  c.beginPath();c.moveTo(x+r*.1,y);c.quadraticCurveTo(x-r*.1,y+r*.65,x+r*.12,y+r);c.stroke();
  const fill=c.createLinearGradient(x,y-r,x,y+r*.25);fill.addColorStop(0,color+'bb');fill.addColorStop(1,'#285e77');
  c.beginPath();c.moveTo(x-r,y);c.bezierCurveTo(x-r*.72,y-r*1.1,x+r*.65,y-r*1.1,x+r,y);c.quadraticCurveTo(x,y+r*.35,x-r,y);c.fillStyle=fill;c.fill();
  ellipse(c,x,y,r,r*.16,color+'77');
  for(const [dx,dy,s] of [[-.48,-.25,.09],[.05,-.52,.12],[.48,-.22,.07]])ellipse(c,x+dx*r,y+dy*r,r*s,r*s*.6,'#b7fff6aa');
  c.strokeStyle=color+'77';c.lineWidth=1;
  for(let i=-2;i<=2;i++){c.beginPath();c.moveTo(x+i*r*.33,y);c.lineTo(x,y+r*.13);c.stroke();}
}

export class GardenScenery {
  constructor({reducedMotion=false}={}) { this.reducedMotion=reducedMotion;this.cache=new Map();this.size=''; }

  draw(c,{theme,width:w,height:h,clock,camera,groundY}) {
    const size=w+':'+h;
    if(this.size!==size){this.cache.clear();this.size=size;}
    if(!this.cache.has(theme.id)){
      const layer=document.createElement('canvas');layer.width=w;layer.height=h;
      const base=layer.getContext('2d',{alpha:false});
      this.paintBase(base,theme,w,h);this.cache.set(theme.id,layer);
    }
    c.save();c.drawImage(this.cache.get(theme.id),0,0);
    this.ambient(c,theme,w,h,this.reducedMotion?0:clock,camera);
    if(groundY<h+100){
      const colors=theme.id==='twilight'?['#356075','#284953']:theme.id==='glowwood'?['#367577','#205451']:theme.id==='blossom'?['#8cb69a','#668e7b']:['#9bb788','#70956e'];
      hills(c,w,h,groundY-10,17,1,colors[0]);hills(c,w,h,groundY+8,12,3,colors[1]);
    }
    c.restore();
  }

  paintBase(c,theme,w,h) {
    const sky=c.createLinearGradient(0,0,0,h);
    theme.sky.forEach((color,i)=>sky.addColorStop(i/2,color));c.fillStyle=sky;c.fillRect(0,0,w,h);
    if(theme.id==='twilight')this.twilight(c,w,h,theme);
    else if(theme.id==='blossom')this.blossom(c,w,h);
    else if(theme.id==='glowwood')this.glowwood(c,w,h);
    else this.classic(c,w,h);
  }

  twilight(c,w,h,theme) {
    glow(c,w*.74,h*.2,220,'#bcacf8','29');glow(c,w*.12,h*.77,240,'#8ce4cb','22');
    moon(c,w*.77,h*.18,27,theme.sky[0]);
    const rng=random(1371);
    for(let i=0;i<65;i++){
      const x=rng()*w,y=rng()*h*.87,r=.6+rng()*1.3;
      c.globalAlpha=.25+rng()*.55;
      if(i%9===0)sparkle(c,x,y,r+1,'#e8dfff');else ellipse(c,x,y,r,r,'#d1e6ee');
    }
    c.globalAlpha=1;
    for(let i=0;i<4;i++)ellipse(c,80+i*200,h*(.32+i*.08),130,9,'#b6bfd90b');
    hills(c,w,h,h*.87,28,1,'#7e91aa18');hills(c,w,h,h*.94,37,3,'#193a4b70');
    for(const side of [12,w-12]){
      c.strokeStyle='#8fadc31b';c.lineWidth=10;c.lineCap='round';c.beginPath();
      c.moveTo(side,h+20);c.bezierCurveTo(side-35,h*.7,side+35,h*.3,side,-20);c.stroke();
      for(let i=0;i<6;i++){
        const y=80+i*h/6,x=side+(i%2?10:-10);
        ellipse(c,x,y,21,6,'#94b6ba18',i%2?-.4:.4);
        glow(c,x,y-18,22,'#b397e8','1b');ellipse(c,x,y-18,3,5,'#d6b9e34a');
      }
    }
  }

  blossom(c,w,h) {
    glow(c,w*.22,h*.18,160,'#fff3c4','90');ellipse(c,w*.22,h*.18,28,28,'#fff3cf');
    for(const [x,y,s] of [[.14,.3,1],[.6,.17,.8],[.93,.36,1.1]]){
      ellipse(c,w*x,h*y,80*s,14*s,'#fff9f359');ellipse(c,w*x-26*s,h*y-9*s,38*s,14*s,'#fff9f33b');
    }
    hills(c,w,h,h*.8,26,1,'#b6d3bd80');hills(c,w,h,h*.9,27,3,'#87b2a185');
    const rng=random(431);
    for(let i=0;i<18;i++){
      const x=i<8?rng()*w*.17:w*.84+rng()*w*.16;
      const y=h*(.25+rng()*.75),r=17+rng()*25;
      bloom(c,x,y,r,['#fff6e8','#f3b8c9','#c9c0ea'][i%3],'#d8b671',.3+rng()*.18);
    }
    for(let i=0;i<13;i++)bloom(c,i*w/12,h-7+Math.sin(i*2)*13,11+i%3*5,i%2?'#f9cad3':'#fff2d5','#dab678',.65);
  }

  glowwood(c,w,h) {
    // Soft aurora ribbons behind distant trees.
    for(let i=0;i<5;i++){
      c.beginPath();c.moveTo(-30,h*.12+i*6);
      c.bezierCurveTo(w*.25,h*.6-i*10,w*.55,-h*.2,w+30,h*.25+i*9);
      c.strokeStyle=i%2?'#bb9aec0b':'#70f0d41a';c.lineWidth=22-i*2;c.stroke();
    }
    glow(c,w*.63,h*.22,190,'#a3a6f4','28');glow(c,w*.2,h*.8,220,'#57dbd1','25');
    hills(c,w,h,h*.8,30,0,'#163b50');hills(c,w,h,h*.94,35,3,'#1e5059');
    for(let i=0;i<8;i++){
      const x=(i*137+25)%w,r=12+i%3*5;
      c.strokeStyle=i%2?'#14364b':'#174356';c.lineWidth=r;c.lineCap='round';c.beginPath();
      c.moveTo(x,h+30);c.bezierCurveTo(x-22,h*.65,x+15,h*.22,x-15,-40);c.stroke();
      for(let j=0;j<4;j++){
        const y=30+j*h*.22;
        ellipse(c,x+(j%2?23:-20),y,44,14,i%2?'#2c647236':'#4d8d8b25',j%2?-.4:.4);
      }
      c.strokeStyle='#89decd1c';c.lineWidth=1;c.beginPath();c.moveTo(x+3,h*.4);c.lineTo(x+8,h*.7);c.stroke();
    }
    mushroom(c,45,h*.84,56,'#77e9df');mushroom(c,w-39,h*.67,43,'#a8bdff');
    mushroom(c,98,h*.94,24,'#82cde8');mushroom(c,w-106,h*.93,31,'#70dac9');
    for(let i=0;i<17;i++){
      const x=(i*67+29)%w,y=h-8-Math.sin(i)*15;
      ellipse(c,x,y,4,1.5,'#a2eadc39');
    }
  }

  classic(c,w,h) {
    c.fillStyle='#ffedbc22';c.fillRect(60,46,71,71);c.fillStyle='#f9e6a344';c.fillRect(70,56,51,51);
    const rng=random(219);
    for(let i=0;i<13;i++){
      const x=rng()*w,y=rng()*h,scale=.5+rng()*.8;c.save();c.translate(x,y);c.scale(scale,scale);c.globalAlpha=.25+rng()*.3;
      c.fillStyle='#ecf0d9';c.beginPath();
      [[0,18],[18,18],[18,8],[33,8],[33,0],[65,0],[65,8],[80,8],[80,18],[105,18],[105,27],[126,27],[126,35],[-10,35],[-10,27],[0,27]].forEach(([px,py],j)=>j?c.lineTo(px,py):c.moveTo(px,py));
      c.closePath();c.fill();c.restore();
    }
  }

  ambient(c,theme,w,h,time,camera) {
    if(theme.id==='classic')return;
    const count=theme.id==='glowwood'?23:15;
    for(let i=0;i<count;i++){
      const speed=theme.id==='blossom'?12:3;
      const x=((i*137.7+Math.sin(time*.4+i)*12+time*(i%2?1:-1)*2)%w+w)%w;
      const y=((i*93.31+time*speed-camera*.08)%(h+60)+h+60)%(h+60)-30;
      if(theme.id==='blossom'){
        ellipse(c,x,y,3.5,1.8,i%2?'#f2b2c3aa':'#fff3ddb3',time*.3+i);
      }else{
        const alpha=this.reducedMotion ? .55 : .35+(Math.sin(time*1.4+i)+1)*.25;
        c.globalAlpha=alpha;const color=theme.id==='glowwood'?'#a3ffdd':'#e4caff';
        glow(c,x,y,12,color,'44');ellipse(c,x,y,1.5,1.5,color);
        if(i%6===0)sparkle(c,x,y,3,color);c.globalAlpha=1;
      }
    }
  }
}
