import test from 'node:test';import assert from 'node:assert/strict';
import {STORAGE_KEY,load,save} from '../src/storage.js';import {initialState,reduce} from '../src/model.js';
test('exact namespace and compatible catalogue summary; no other storage touched',()=>{
 const store=new Map([['daily-games:contrapeso:v1','untouched']]);const storage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};
 let s=initialState();s.completed[0]={bestMoves:3};s=reduce(s,{type:'NAVIGATE',index:1});assert(save(s,storage));const raw=JSON.parse(store.get(STORAGE_KEY));assert.equal(STORAGE_KEY,'daily-games:mosaico-nomada:v1');assert.equal(raw.version,1);assert.equal(raw.currentLevel,1);assert.equal(raw.completed[0].bestMoves,3);assert(raw.run);assert.equal(typeof raw.updatedAt,'string');assert.deepEqual(load(storage).state.boards,s.boards);assert.equal(store.get('daily-games:contrapeso:v1'),'untouched');assert.equal(store.size,2);
});
test('interrupted sessions recover valid placements and undo history; transient input omitted',()=>{
 let raw;const storage={getItem:()=>raw,setItem:(k,v)=>raw=v};let s=initialState();s=reduce(s,{type:'SELECT',id:'A'});s=reduce(s,{type:'CURSOR',x:0,y:0});s=reduce(s,{type:'ACTIVATE'});s=reduce(s,{type:'SELECT',id:'B'});s=reduce(s,{type:'REQUEST_RESET'});save(s,storage);const resumed=load(storage).state;assert.deepEqual(resumed.boards,s.boards);assert.equal(resumed.selected,null);assert.equal(resumed.modal,null);
});
test('blocked, corrupt, oversized, null and future storage do not crash gameplay',()=>{
 const blocked={getItem(){throw Error('blocked');},setItem(){throw Error('quota');}};assert.equal(load(blocked).available,false);assert.equal(save(initialState(),blocked),false);
 for(const raw of ['{bad','x'.repeat(500001)])assert.equal(load({getItem:()=>raw}).available,false);
 for(const raw of [null,'null','{"version":999}'])assert.equal(load({getItem:()=>raw}).state.currentLevel,0);
});
