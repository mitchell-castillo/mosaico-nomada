import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {boot,memoryStorage} from './dom-harness.js';import {STORAGE_KEY} from '../src/storage.js';import {LEVELS} from '../src/levels.js';
const solutions=JSON.parse(readFileSync(new URL('./solutions.json',import.meta.url)));
// First solution is also documented for the parent's browser review.
solutions[0]={A:{x:0,y:0,r:3},B:{x:1,y:0,r:3},C:{x:2,y:1,r:0}};
function put(ui,id,p){ui.piece(id).click();for(let i=0;i<p.r;i++)ui.key('r');ui.cell(p.x,p.y).click();}
test('actual interface handlers: all six boards, next, reload and progress summary',async()=>{
 const storage=memoryStorage();let ui=await boot(storage);
 assert.equal(ui.elements.levels.children.filter(b=>!b.disabled).length,1);
 for(let index=0;index<6;index++){
  assert.equal(ui.elements['level-title'].textContent,LEVELS[index].name);
  for(const [id,p] of Object.entries(solutions[index]))put(ui,id,p);
  assert.equal(ui.elements.success.hidden,false);assert.equal(ui.elements.next.hidden,index===5);
  assert.equal(Object.keys(JSON.parse(storage.values.get(STORAGE_KEY)).completed).length,index+1);
  ui=await boot(storage);assert.equal(ui.elements.success.hidden,false);
  if(index<5)ui.click('next');
 }
 assert.equal(ui.elements.levels.children.filter(b=>!b.disabled).length,6);
 ui.elements.levels.children[0].click();assert.equal(ui.elements.success.hidden,false);
});
test('actual interface handlers: repeated cancel/Escape, reset controls, undo after reload',async()=>{
 const storage=memoryStorage();let ui=await boot(storage);
 for(let i=0;i<4;i++){ui.piece('A').click();ui.key('r');ui.key('Escape');assert(ui.elements.rotate.disabled);assert(ui.elements.cancel.disabled);}
 put(ui,'A',solutions[0].A);const placed=storage.values.get(STORAGE_KEY);
 ui.click('reset');assert(ui.elements['reset-dialog'].open);assert.equal(ui.doc.activeElement.id,'keep');ui.key('z');assert.equal(storage.values.get(STORAGE_KEY),placed);ui.click('keep');assert.equal(ui.elements['reset-dialog'].open,false);assert.equal(ui.doc.activeElement.id,'reset');
 ui.click('reset');ui.key('Escape');assert.equal(ui.elements['reset-dialog'].open,false);assert.equal(storage.values.get(STORAGE_KEY),placed);
 ui.click('reset');ui=await boot(storage);assert(!ui.elements['reset-dialog'].open);assert(!ui.elements.undo.disabled);ui.click('undo');assert.equal(ui.elements.filled.textContent,'0 / 12 casillas cubiertas');
 put(ui,'A',solutions[0].A);ui.click('reset');ui.click('confirm');assert.equal(ui.elements.filled.textContent,'0 / 12 casillas cubiertas');assert(ui.elements.undo.disabled);assert.equal(JSON.parse(storage.values.get(STORAGE_KEY)).run.boards[0].history.length,0);
});
test('actual interface handlers: arrows, rotation in both directions, collision, remove and keyboard shortcuts',async()=>{
 const ui=await boot(memoryStorage());ui.cell(0,0).focus();ui.key('ArrowRight');assert.equal(ui.doc.activeElement.dataset.x,1);assert.equal(ui.doc.activeElement.tabIndex,0);
 ui.piece('A').click();ui.key('q');assert(ui.elements.selection.textContent.includes('270°'));ui.key('r');assert(ui.elements.selection.textContent.includes('0°'));ui.click('cancel');
 put(ui,'A',solutions[0].A);ui.piece('B').click();ui.cell(solutions[0].A.x,solutions[0].A.y).click();assert(ui.elements.status.textContent.includes('cruza')||ui.elements.status.textContent.includes('sale'));
 ui.key('Escape');ui.piece('A').click();ui.key('Delete');assert.equal(ui.elements.filled.textContent,'0 / 12 casillas cubiertas');ui.key('z');assert.equal(ui.elements.filled.textContent,'4 / 12 casillas cubiertas');
 assert(ui.piece('A').attributes['aria-label'].includes('Forma: fila'));
});
test('actual interface: storage failure remains visible and playing still works',async()=>{
 const ui=await boot({getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}});assert.equal(ui.elements['storage-warning'].hidden,false);put(ui,'A',solutions[0].A);assert.equal(ui.elements.filled.textContent,'4 / 12 casillas cubiertas');
});
