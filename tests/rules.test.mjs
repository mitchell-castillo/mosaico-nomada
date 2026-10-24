import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {LEVELS} from '../src/levels.js';import {rotate,normalize,absolute,canPlace,validPlacements,isComplete,key} from '../src/geometry.js';
import {initialState,reduce,unlocked,toProgress,fromProgress} from '../src/model.js';import {solve} from '../scripts/solver.js';
const fixtures=JSON.parse(readFileSync(new URL('./solutions.json',import.meta.url)));
function tile(state,id,p){state=reduce(state,{type:'SELECT',id});for(let i=0;i<p.r;i++)state=reduce(state,{type:'ROTATE'});state=reduce(state,{type:'CURSOR',x:p.x,y:p.y});return reduce(state,{type:'ACTIVATE'});}
test('six original connected masks, connected pieces, equal area, unique silhouettes',()=>{
 assert.equal(LEVELS.length,6);const masks=new Set();
 function connected(cells){const rest=new Set(cells.map(c=>key(...c))),queue=[cells[0]];rest.delete(key(...cells[0]));while(queue.length){const [x,y]=queue.pop();for(const [a,b] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]])if(rest.delete(key(a,b)))queue.push([a,b]);}return !rest.size;}
 for(const level of LEVELS){assert(connected(level.cells));assert.equal(level.cells.length,new Set(level.cells.map(c=>key(...c))).size);assert.equal(level.cells.length,level.pieces.reduce((a,p)=>a+p.cells.length,0));assert(level.cells.every(([x,y])=>x>=0&&y>=0&&x<level.width&&y<level.height));for(const p of level.pieces){assert(connected(p.cells));assert(p.cells.length>=4&&p.cells.length<=5);}masks.add(JSON.stringify(level.cells));}assert.equal(masks.size,6);
});
test('rotations are four quarter turns, normalized and area preserving',()=>{for(const l of LEVELS)for(const p of l.pieces){assert.deepEqual(rotate(p.cells,4),normalize(p.cells));assert.deepEqual(rotate(rotate(p.cells),3),normalize(p.cells));assert.equal(absolute(p,{x:2,y:2,r:1}).length,p.cells.length);}});
for(const [index,level] of LEVELS.entries()){
 test(`constructive fixture and independent exact-cover solver: ${level.name}`,()=>{
  assert(isComplete(level,fixtures[index]));const {solutions}=solve(level);assert.equal(solutions.length,1);assert(isComplete(level,solutions[0]));
  let state=initialState();for(let i=0;i<index;i++)state.completed[i]={bestMoves:1};state=reduce(state,{type:'NAVIGATE',index});
  for(const [id,p] of Object.entries(solutions[0]))state=tile(state,id,p);
  assert(isComplete(level,state.boards[index].placements),'solution reachable through player actions');assert.equal(state.completed[index].bestMoves,level.pieces.length);assert.equal(unlocked(state),Math.min(index+1,5));
  const restored=fromProgress(toProgress(state));assert.deepEqual(restored.boards,state.boards);assert.deepEqual(restored.completed,state.completed);
 });
}
test('collision, bounds, invalid identity and rotation leave placement unchanged',()=>{
 const l=LEVELS[0],s=fixtures[0];assert(!canPlace(l,{},'A',{x:-20,y:0,r:0}).ok);assert(!canPlace(l,{},'X',s.A).ok);assert(!canPlace(l,{},'A',{...s.A,r:4}).ok);assert(!canPlace(l,{},'A',{...s.A,x:0.1}).ok);
 const overlap=Object.fromEntries(l.pieces.map(p=>[p.id,s.A]));assert(!validPlacements(l,overlap));assert(!validPlacements(l,[]));assert(!isComplete(l,{}));
 let state=tile(initialState(),'A',s.A);state=reduce(state,{type:'SELECT',id:'B'});state=reduce(state,{type:'CURSOR',x:s.A.x,y:s.A.y});const before=structuredClone(state.boards);state=reduce(state,{type:'ACTIVATE'});assert.deepEqual(state.boards,before);assert(state.selected);
});
test('repeated select, rotation, Escape, invalid placements, cancellation, undo and reload',()=>{
 let s=initialState();for(let i=0;i<20;i++){s=reduce(s,{type:'SELECT',id:'A'});s=reduce(s,{type:'SELECT',id:'A'});assert.equal(s.selected,null);s=reduce(s,{type:'SELECT',id:'A'});s=reduce(s,{type:'ROTATE'});s=reduce(s,{type:'ESCAPE'});assert.equal(s.selected,null);assert.equal(s.boards[0].moves,0);}
 s=tile(s,'A',fixtures[0].A);const snapshot=structuredClone(s.boards);s=reduce(s,{type:'REQUEST_RESET'});s=reduce(s,{type:'ROTATE'});assert.deepEqual(s.boards,snapshot);s=reduce(s,{type:'CANCEL_RESET'});assert.deepEqual(s.boards,snapshot);
 s=reduce(s,{type:'REQUEST_RESET'});s=reduce(s,{type:'ESCAPE'});assert.equal(s.modal,null);assert.deepEqual(s.boards,snapshot);
 s=fromProgress(toProgress(reduce(s,{type:'REQUEST_RESET'})));assert.equal(s.modal,null);assert.equal(s.selected,null);assert.deepEqual(s.boards,snapshot);
 s=reduce(s,{type:'UNDO'});assert.deepEqual(s.boards[0].placements,{});assert.equal(s.boards[0].moves,0);s=reduce(s,{type:'UNDO'});assert.equal(s.boards[0].moves,0);
});
test('remove, move, same-place no-op and best score survive reset/undo',()=>{
 let s=tile(initialState(),'A',fixtures[0].A);s=reduce(s,{type:'SELECT',id:'A'});s=reduce(s,{type:'ACTIVATE'});assert.equal(s.boards[0].moves,1);
 s=reduce(s,{type:'REMOVE'});assert.equal(s.boards[0].moves,2);assert.deepEqual(s.boards[0].placements,{});s=reduce(s,{type:'UNDO'});assert(s.boards[0].placements.A);
 for(const id of ['B','C'])s=tile(s,id,fixtures[0][id]);assert.equal(s.completed[0].bestMoves,3);s=reduce(s,{type:'UNDO'});assert.equal(s.completed[0].bestMoves,3);
 s=reduce(s,{type:'NAVIGATE',index:1});s=tile(s,'A',fixtures[1].A);const other=structuredClone(s.boards[1]);s=reduce(s,{type:'NAVIGATE',index:0});s=reduce(s,{type:'REQUEST_RESET'});s=reduce(s,{type:'CONFIRM_RESET'});assert.equal(s.boards[0].moves,0);assert.deepEqual(s.boards[1],other);assert.equal(s.completed[0].bestMoves,3);
});
test('locked levels, malformed saves, invalid histories and capped undo recover safely',()=>{
 let s=reduce(initialState(),{type:'NAVIGATE',index:5});assert.equal(s.currentLevel,0);const bad={version:1,currentLevel:99,completed:{0:{bestMoves:-1}},run:{boards:[{placements:{A:{x:99,y:99,r:0}},moves:2,history:[]}]}};assert.deepEqual(fromProgress(bad).boards[0].placements,{});assert.equal(fromProgress(bad).currentLevel,0);
 const p=toProgress(tile(initialState(),'A',fixtures[0].A));p.run.boards[0].history=[{placements:[],moves:1},null,{placements:{},moves:0}];assert.equal(fromProgress(p).boards[0].history.length,1);
 s=tile(initialState(),'A',fixtures[0].A);for(let i=0;i<220;i++){s=reduce(s,{type:'SELECT',id:'A'});s=reduce(s,{type:'REMOVE'});s=tile(s,'A',fixtures[0].A);}assert.equal(s.boards[0].history.length,200);assert.equal(fromProgress(toProgress(s)).boards[0].history.length,200);
});
