const KEY_MAP = {ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'fly',KeyW:'fly',Space:'fly'};

// Keep holds tied to live pointers. Releases are watched outside the buttons too,
// since mobile browsers can deliver the final touch event to a different node.
export class HoldControls {
  constructor({buttons,root=window,document:doc=document,canPress=()=>true,onPress=()=>{},onChange=()=>{}}) {
    this.buttons=buttons;this.root=root;this.document=doc;this.canPress=canPress;this.onPress=onPress;this.onChange=onChange;
    this.pointers=new Map();this.keys=new Set();this.state={left:false,right:false,fly:false};
    for(const [key,button] of Object.entries(buttons)){
      button.addEventListener('pointerdown',event=>{
        if(event.button!==0)return;
        event.preventDefault();this.onPress(key);
        if(!this.canPress())return;
        // A reused ID must replace its old hold rather than leave a second key down.
        this.release(event.pointerId);
        this.pointers.set(event.pointerId,{key,button,type:event.pointerType});
        try{button.setPointerCapture(event.pointerId);}catch{}
        this.sync();
      });
      for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,event=>this.release(event.pointerId));
      // iOS Safari can promote a long press into text selection or a copy callout
      // even when Pointer Events are active. Cancel its parallel touch defaults.
      for(const type of ['touchstart','touchmove'])button.addEventListener(type,event=>event.preventDefault(),{passive:false});
      for(const type of ['contextmenu','selectstart','dragstart'])button.addEventListener(type,event=>event.preventDefault());
    }
    for(const type of ['pointerup','pointercancel','lostpointercapture'])root.addEventListener(type,event=>this.release(event.pointerId),true);
    root.addEventListener('pointermove',event=>{
      const hold=this.pointers.get(event.pointerId);if(!hold)return;
      const r=hold.button.getBoundingClientRect(),margin=8;
      if((event.pointerType==='mouse'&&!(event.buttons&1))||event.clientX<r.left-margin||event.clientX>r.right+margin||event.clientY<r.top-margin||event.clientY>r.bottom+margin)this.release(event.pointerId);
    },true);
    root.addEventListener('touchend',event=>this.reconcileTouches(event.touches),{capture:true,passive:true});
    root.addEventListener('touchcancel',()=>this.clearPointers(),{capture:true,passive:true});
    root.addEventListener('mouseup',()=>{
      for(const [id,hold] of this.pointers)if(hold.type!=='touch')this.release(id);
    },true);
    for(const type of ['blur','pagehide'])root.addEventListener(type,()=>this.clear());
    doc.addEventListener('visibilitychange',()=>{if(doc.hidden)this.clear();});
  }

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
  }

  clearPointers() { for(const id of [...this.pointers.keys()])this.release(id); }
  clear() { this.keys.clear();this.clearPointers();this.sync(); }

  sync() {
    for(const key of Object.keys(this.buttons)){
      this.state[key]=[...this.keys].some(code=>KEY_MAP[code]===key)||[...this.pointers.values()].some(hold=>hold.key===key);
      this.buttons[key].classList.toggle('pressed',this.state[key]);
    }
    this.onChange({...this.state});
  }
}
