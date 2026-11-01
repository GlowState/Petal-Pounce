const KEY_MAP = {ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'fly',KeyW:'fly',Space:'fly'};

// Keep holds tied to live pointers. Releases are watched outside the controls too,
// since mobile browsers can deliver the final touch event to a different node.
export class HoldControls {
  constructor({buttons={},joystick=null,root=window,document:doc=document,canPress=()=>true,onPress=()=>{},onChange=()=>{}}) {
    this.buttons=buttons;this.joystick=joystick;this.root=root;this.document=doc;this.canPress=canPress;this.onPress=onPress;this.onChange=onChange;
    this.pointers=new Map();this.keys=new Set();this.state={left:false,right:false,fly:false};this.horizontal=0;
    this.joyPointerId=null;this.joyVector={x:0,y:0};

    for(const [key,button] of Object.entries(buttons)){
      if(!button)continue;
      button.addEventListener('pointerdown',event=>{
        if(event.button!==0)return;
        event.preventDefault();this.onPress(key);
        if(!this.canPress())return;
        this.release(event.pointerId);
        this.pointers.set(event.pointerId,{key,button,type:event.pointerType});
        try{button.setPointerCapture(event.pointerId);}catch{}
        this.sync();
      });
      for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,event=>this.release(event.pointerId));
      for(const type of ['touchstart','touchmove'])button.addEventListener(type,event=>event.preventDefault(),{passive:false});
      for(const type of ['contextmenu','selectstart','dragstart'])button.addEventListener(type,event=>event.preventDefault());
    }

    if(joystick){
      const start=event=>{
        if(event.button!==undefined&&event.button!==0)return;
        event.preventDefault();this.onPress('move');
        if(!this.canPress())return;
        this.joyPointerId=event.pointerId??'mouse';
        try{joystick.setPointerCapture?.(this.joyPointerId);}catch{}
        this.updateJoystick(event);
      };
      joystick.addEventListener('pointerdown',start);
      joystick.addEventListener('pointermove',event=>{ if(event.pointerId===this.joyPointerId) this.updateJoystick(event); });
      for(const type of ['pointerup','pointercancel','lostpointercapture'])joystick.addEventListener(type,event=>{ if(event.pointerId===this.joyPointerId)this.clearJoystick(); });
      for(const type of ['touchstart','touchmove'])joystick.addEventListener(type,event=>event.preventDefault(),{passive:false});
      for(const type of ['contextmenu','selectstart','dragstart'])joystick.addEventListener(type,event=>event.preventDefault());
    }

    for(const type of ['pointerup','pointercancel','lostpointercapture'])root.addEventListener(type,event=>this.release(event.pointerId),true);
    root.addEventListener('pointermove',event=>{
      const hold=this.pointers.get(event.pointerId);if(hold){
        const r=hold.button.getBoundingClientRect(),margin=8;
        if((event.pointerType==='mouse'&&!(event.buttons&1))||event.clientX<r.left-margin||event.clientX>r.right+margin||event.clientY<r.top-margin||event.clientY>r.bottom+margin)this.release(event.pointerId);
      }
      if(this.joyPointerId===event.pointerId)this.updateJoystick(event);
    },true);
    root.addEventListener('touchend',event=>this.reconcileTouches(event.touches),{capture:true,passive:true});
    root.addEventListener('touchcancel',()=>this.clearPointers(),{capture:true,passive:true});
    root.addEventListener('mouseup',()=>{
      for(const [id,hold] of this.pointers)if(hold.type!=='touch')this.release(id);
      if(this.joyPointerId!==null)this.clearJoystick();
    },true);
    for(const type of ['blur','pagehide'])root.addEventListener(type,()=>this.clear());
    doc.addEventListener('visibilitychange',()=>{if(doc.hidden)this.clear();});
  }

  updateJoystick(event){
    if(!this.joystick)return;
    const rect=this.joystick.getBoundingClientRect();
    const cx=rect.left+rect.width/2, cy=rect.top+rect.height/2;
    const dx=event.clientX-cx, dy=event.clientY-cy;
    const radius=Math.max(12,Math.min(rect.width,rect.height)*.34);
    const distance=Math.hypot(dx,dy)||1;
    const scale=Math.min(1,distance/radius);
    this.joyVector={x:(dx/distance)*scale||0,y:(dy/distance)*scale||0};
    this.renderJoystick();
    this.sync();
  }

  renderJoystick(){
    if(!this.joystick)return;
    this.joystick.style.setProperty('--joy-x',`${this.joyVector.x*26}px`);
    this.joystick.style.setProperty('--joy-y',`${this.joyVector.y*26}px`);
    this.joystick.classList.toggle('active',Math.abs(this.joyVector.x)>.02||Math.abs(this.joyVector.y)>.02);
  }

  clearJoystick(){ this.joyPointerId=null;this.joyVector={x:0,y:0};this.renderJoystick();this.sync(); }

  keyDown(event) {
    if(!KEY_MAP[event.code])return false;
    event.preventDefault();
    if(!this.canPress())return true;
    this.keys.add(event.code);this.sync();return true;
  }

  keyUp(event) {
    if(!KEY_MAP[event.code])return false;
    this.keys.delete(event.code);this.sync();return true;
  }

  release(id) {
    const hold=this.pointers.get(id);if(!hold)return;
    this.pointers.delete(id);
    try{if(hold.button.hasPointerCapture(id))hold.button.releasePointerCapture(id);}catch{}
    this.sync();
  }

  reconcileTouches(touches) {
    const remaining=Array.from(touches??[]);
    for(const [id,hold] of this.pointers){
      if(hold.type!=='touch')continue;
      const r=hold.button.getBoundingClientRect();
      if(!remaining.some(t=>t.clientX>=r.left-8&&t.clientX<=r.right+8&&t.clientY>=r.top-8&&t.clientY<=r.bottom+8))this.release(id);
    }
    if(this.joystick&&this.joyPointerId!==null){
      const r=this.joystick.getBoundingClientRect();
      if(!remaining.some(t=>t.clientX>=r.left-8&&t.clientX<=r.right+8&&t.clientY>=r.top-8&&t.clientY<=r.bottom+8))this.clearJoystick();
    }
  }

  clearPointers() { for(const id of [...this.pointers.keys()])this.release(id); }
  clear() { this.keys.clear();this.clearPointers();this.clearJoystick();this.sync(); }

  sync() {
    const keyHorizontal=[...this.keys].reduce((value,code)=>value+(KEY_MAP[code]==='right'?1:KEY_MAP[code]==='left'?-1:0),0);
    const pointerHorizontal=(this.state.right?1:0)-(this.state.left?1:0);
    let horizontal=keyHorizontal||this.joyVector.x;
    horizontal=Math.max(-1,Math.min(1,horizontal));
    this.state.left=horizontal<-.18||[...this.pointers.values()].some(hold=>hold.key==='left');
    this.state.right=horizontal>.18||[...this.pointers.values()].some(hold=>hold.key==='right');
    this.state.fly=[...this.keys].some(code=>KEY_MAP[code]==='fly')||[...this.pointers.values()].some(hold=>hold.key==='fly');
    this.horizontal=horizontal;
    for(const [key,button] of Object.entries(this.buttons)) if(button) button.classList.toggle('pressed',this.state[key]);
    this.onChange({...this.state,horizontal:this.horizontal});
  }
}
