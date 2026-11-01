import test from 'node:test';
import assert from 'node:assert/strict';
import { HoldControls } from '../dist/hold-controls.mjs';

class FakeButton extends EventTarget {
  constructor(rect) {
    super();this.rect=rect;this.captures=new Set();this.classes=new Set();
    this.classList={toggle:(name,on)=>on?this.classes.add(name):this.classes.delete(name)};
  }
  getBoundingClientRect(){return this.rect;}
  setPointerCapture(id){this.captures.add(id);}
  hasPointerCapture(id){return this.captures.has(id);}
  releasePointerCapture(id){this.captures.delete(id);}
}

const event=(type,props={})=>{
  const value=new Event(type,{cancelable:true});
  for(const [key,item] of Object.entries(props))Object.defineProperty(value,key,{value:item,configurable:true});
  return value;
};

function setup() {
  const root=new EventTarget(),doc=new EventTarget();doc.hidden=false;
  const buttons={
    left:new FakeButton({left:0,right:60,top:0,bottom:90}),
    right:new FakeButton({left:70,right:130,top:0,bottom:90}),
    fly:new FakeButton({left:160,right:250,top:0,bottom:100})
  };
  const changes=[];
  const controls=new HoldControls({buttons,root,document:doc,onChange:state=>changes.push(state)});
  return {root,doc,buttons,controls,changes};
}

test('a global pointer release cannot leave Fly stuck and does not release steering',()=>{
  const {root,buttons,controls}=setup();
  buttons.left.dispatchEvent(event('pointerdown',{button:0,pointerId:1,pointerType:'touch',clientX:30,clientY:40}));
  buttons.fly.dispatchEvent(event('pointerdown',{button:0,pointerId:2,pointerType:'touch',clientX:200,clientY:50}));
  assert.deepEqual(controls.state,{left:true,right:false,fly:true});
  root.dispatchEvent(event('pointerup',{pointerId:2,pointerType:'touch'}));
  assert.deepEqual(controls.state,{left:true,right:false,fly:false});
  assert.equal(buttons.fly.classes.has('pressed'),false);
  assert.equal(buttons.left.classes.has('pressed'),true);
});

test('touch reconciliation releases only the fingers no longer over a control',()=>{
  const {root,buttons,controls}=setup();
  buttons.left.dispatchEvent(event('pointerdown',{button:0,pointerId:11,pointerType:'touch',clientX:20,clientY:30}));
  buttons.fly.dispatchEvent(event('pointerdown',{button:0,pointerId:12,pointerType:'touch',clientX:200,clientY:40}));
  root.dispatchEvent(event('touchend',{touches:[{clientX:20,clientY:30}]}));
  assert.deepEqual(controls.state,{left:true,right:false,fly:false});
  root.dispatchEvent(event('touchend',{touches:[]}));
  assert.deepEqual(controls.state,{left:false,right:false,fly:false});
});

test('dragging out, losing capture, cancellation, blur and page hide all clear holds',()=>{
  const {root,buttons,controls}=setup();
  buttons.fly.dispatchEvent(event('pointerdown',{button:0,pointerId:21,pointerType:'touch',clientX:200,clientY:40}));
  root.dispatchEvent(event('pointermove',{pointerId:21,pointerType:'touch',clientX:300,clientY:40,buttons:1}));
  assert.equal(controls.state.fly,false);

  buttons.fly.dispatchEvent(event('pointerdown',{button:0,pointerId:22,pointerType:'touch',clientX:200,clientY:40}));
  buttons.fly.dispatchEvent(event('lostpointercapture',{pointerId:22,pointerType:'touch'}));
  assert.equal(controls.state.fly,false);

  buttons.right.dispatchEvent(event('pointerdown',{button:0,pointerId:23,pointerType:'mouse',clientX:100,clientY:40}));
  root.dispatchEvent(event('pointermove',{pointerId:23,pointerType:'mouse',clientX:100,clientY:40,buttons:0}));
  assert.equal(controls.state.right,false);

  buttons.left.dispatchEvent(event('pointerdown',{button:0,pointerId:24,pointerType:'touch',clientX:20,clientY:40}));
  root.dispatchEvent(event('blur'));
  assert.deepEqual(controls.state,{left:false,right:false,fly:false});
  buttons.fly.dispatchEvent(event('pointerdown',{button:0,pointerId:25,pointerType:'touch',clientX:200,clientY:40}));
  root.dispatchEvent(event('pagehide'));
  assert.deepEqual(controls.state,{left:false,right:false,fly:false});
});

test('multiple keyboard bindings keep Fly active until every held key is released',()=>{
  const {controls}=setup();
  controls.keyDown(event('keydown',{code:'KeyW'}));
  controls.keyDown(event('keydown',{code:'Space'}));
  assert.equal(controls.state.fly,true);
  controls.keyUp(event('keyup',{code:'KeyW'}));
  assert.equal(controls.state.fly,true);
  controls.keyUp(event('keyup',{code:'Space'}));
  assert.equal(controls.state.fly,false);
});

test('long-press browser gestures are cancelled on every gameplay button',()=>{
  const {buttons}=setup();
  for(const button of Object.values(buttons)){
    for(const type of ['touchstart','touchmove','contextmenu','selectstart','dragstart']){
      const gesture=event(type);button.dispatchEvent(gesture);
      assert.equal(gesture.defaultPrevented,true,`${type} must be cancelled`);
    }
  }
});
