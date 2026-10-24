import { LEVELS } from './levels.js';
import { key, rotate, absolute, ownerAt, canPlace, isComplete } from './geometry.js';
import { reduce, unlocked } from './model.js';
import { load, save } from './storage.js';
const $=id=>document.getElementById(id);
let loaded=load(),state=loaded.state,levelBuilt=-1,modalWasOpen=false;
const colors=['#b64b34','#397875','#976227','#686197','#2e7493','#956074','#567137','#69563c'];
const names=['arcilla','turquesa','ocre','lavanda','azul','malva','oliva','tierra'];
const cellButtons=new Map(),pieceButtons=new Map(),navButtons=[];
function button(text,handler,className='') {const b=document.createElement('button');b.type='button';b.textContent=text;b.className=className;b.addEventListener('click',handler);return b;}
LEVELS.forEach((level,i)=>{
  const b=button('',()=>dispatch({type:'NAVIGATE',index:i}),'journey-stop');
  const number=document.createElement('span');number.className='stop-number';
  const title=document.createElement('span');title.className='stop-title';title.textContent=level.name;
  b.append(number,title);$('levels').append(b);navButtons.push(b);
});
function dispatch(action) {
  state=reduce(state,action);
  if(['ACTIVATE','REMOVE','UNDO','NAVIGATE','CONFIRM_RESET'].includes(action.type)){
    if(!save(state))$('storage-warning').hidden=false;
  }
  render();
}
function mini(piece,r) {
  const cells=rotate(piece.cells,r),width=Math.max(...cells.map(c=>c[0]))+1,height=Math.max(...cells.map(c=>c[1]))+1;
  const block=document.createElement('span');block.className='mini';block.style.setProperty('--mini-w',width);block.style.setProperty('--mini-h',height);block.setAttribute('aria-hidden','true');
  cells.forEach(([x,y],i)=>{const square=document.createElement('span');square.className='mini-cell';square.style.gridColumn=x+1;square.style.gridRow=y+1;if(i===0)square.textContent='•';block.append(square);});return block;
}
function build(level) {
  $('board').replaceChildren();$('pieces').replaceChildren();cellButtons.clear();pieceButtons.clear();
  $('board').style.setProperty('--cols',level.width);$('board').style.setProperty('--rows',level.height);
  for(let y=0;y<level.height;y++)for(let x=0;x<level.width;x++){
    if(!level.cells.some(c=>c[0]===x&&c[1]===y)) {const hole=document.createElement('span');hole.className='hole';hole.setAttribute('aria-hidden','true');$('board').append(hole);continue;}
    const b=button('',()=>{dispatch({type:'CURSOR',x,y});dispatch({type:'ACTIVATE'});},'cell');b.dataset.x=x;b.dataset.y=y;
    b.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch')dispatch({type:'CURSOR',x,y});});
    b.addEventListener('focus',()=>{if(state.cursor[0]!==x||state.cursor[1]!==y)dispatch({type:'CURSOR',x,y});});
    b.addEventListener('keydown',e=>{
      const directions={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};const d=directions[e.key];if(!d)return;
      e.preventDefault();let nx=x+d[0],ny=y+d[1];
      while(nx>=0&&ny>=0&&nx<level.width&&ny<level.height){const target=cellButtons.get(key(nx,ny));if(target){target.focus();break;}nx+=d[0];ny+=d[1];}
    });
    $('board').append(b);cellButtons.set(key(x,y),b);
  }
  level.pieces.forEach((piece,i)=>{
    const b=button('',()=>dispatch({type:'SELECT',id:piece.id}),'piece');b.style.setProperty('--pigment',colors[i]);
    $('pieces').append(b);pieceButtons.set(piece.id,b);
  });
  levelBuilt=state.currentLevel;
}
function render() {
  const level=LEVELS[state.currentLevel],board=state.boards[state.currentLevel],complete=isComplete(level,board.placements);
  if(levelBuilt!==state.currentLevel)build(level);
  navButtons.forEach((b,i)=>{b.disabled=i>unlocked(state);b.classList.toggle('current',i===state.currentLevel);b.classList.toggle('done',!!state.completed[i]);b.firstChild.textContent=state.completed[i]?'✓':String(i+1).padStart(2,'0');b.setAttribute('aria-label',`${i+1}. ${LEVELS[i].name}${state.completed[i]?', completado':''}${b.disabled?', bloqueado':''}`);if(i===state.currentLevel)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
  $('chapter').textContent=`PAISAJE ${String(state.currentLevel+1).padStart(2,'0')} / 06`;
  $('level-title').textContent=level.name;$('level-subtitle').textContent=level.subtitle;
  $('area-count').textContent=`${level.cells.length} casillas`;
  const selected=level.pieces.find(p=>p.id===state.selected);
  const placement={x:state.cursor[0],y:state.cursor[1],r:state.rotation};
  const preview=selected?new Set(absolute(selected,placement).map(c=>key(...c))):new Set();
  const fits=selected?canPlace(level,board.placements,selected.id,placement):null;
  cellButtons.forEach((b,k)=>{
    const [x,y]=k.split(',').map(Number),owner=ownerAt(level,board.placements,x,y),index=level.pieces.findIndex(p=>p.id===owner);
    b.className='cell';b.textContent=owner??'';b.style.removeProperty('--pigment');
    if(owner){b.classList.add('occupied');b.style.setProperty('--pigment',colors[index]);}
    if(owner===state.selected)b.classList.add('moving');
    if(preview.has(k)){b.classList.add(fits.ok?'preview-valid':'preview-invalid');b.textContent=selected.id;}
    if(selected && x===placement.x&&y===placement.y)b.classList.add('anchor');
    b.tabIndex=x===state.cursor[0]&&y===state.cursor[1]?0:-1;
    b.setAttribute('aria-label',`Fila ${y+1}, columna ${x+1}: ${owner?`pieza ${owner}, ${names[index]}`:'vacía'}${preview.has(k)?(fits.ok?', encaja':', no encaja'):''}`);
  });
  level.pieces.forEach((piece,i)=>{
    const b=pieceButtons.get(piece.id),placed=!!board.placements[piece.id],active=state.selected===piece.id;
    b.classList.toggle('selected',active);b.classList.toggle('placed',placed);b.setAttribute('aria-pressed',String(active));
    const shape=rotate(piece.cells,active?state.rotation:(board.placements[piece.id]?.r??0));
    const rows=[...new Set(shape.map(c=>c[1]))].map(y=>`fila ${y+1}, columnas ${shape.filter(c=>c[1]===y).map(c=>c[0]+1).join(' y ')}`).join('; ');
    b.setAttribute('aria-label',`Pieza ${piece.id}, ${names[i]}, ${piece.cells.length} casillas, ${placed?'colocada':'disponible'}. Forma: ${rows}. El ancla es la primera casilla de la fila superior.`);
    const label=document.createElement('span');label.className='piece-label';label.textContent=`${piece.id}${placed?' ✓':''}`;
    b.replaceChildren(mini(piece,active?state.rotation:(board.placements[piece.id]?.r??0)),label);
  });
  const filled=level.pieces.filter(p=>board.placements[p.id]).reduce((sum,p)=>sum+p.cells.length,0);
  $('filled').textContent=`${filled} / ${level.cells.length} casillas cubiertas`;$('moves').textContent=`${board.moves} ${board.moves===1?'cambio':'cambios'}`;
  $('pieces-left').textContent=`${Object.keys(board.placements).length} / ${level.pieces.length}`;
  $('selection').textContent=selected?`Pieza ${selected.id} · ${state.rotation*90}° · ancla en fila ${placement.y+1}, columna ${placement.x+1}`:'Elige una pieza de la bandeja.';
  $('preview-status').textContent=fits?`${fits.ok?'✓':'×'} ${fits.reason}`:'Puedes probar y corregir tantas veces como quieras.';
  $('preview-status').classList.toggle('invalid',!!fits&&!fits.ok);
  $('rotate').disabled=!selected;$('cancel').disabled=!selected;$('remove').disabled=!selected||!board.placements[selected.id];$('undo').disabled=!board.history.length;
  $('status').textContent=state.status;
  $('success').hidden=!complete;$('success-text').textContent=state.currentLevel===5?'Seis paisajes, un viaje completo. Puedes volver a jugar cualquiera.':`¡${level.name} completo! El siguiente paisaje te espera.`;
  $('next').hidden=state.currentLevel===5;
  $('hint').textContent=`Pista de este paisaje: ${level.hint}`;
  if(state.modal&&!modalWasOpen){modalWasOpen=true;$('reset-dialog').showModal();$('keep').focus();}
  else if(!state.modal&&modalWasOpen){modalWasOpen=false;$('reset-dialog').close();$('reset').focus();}
}
$('rotate').addEventListener('click',()=>dispatch({type:'ROTATE'}));$('cancel').addEventListener('click',()=>dispatch({type:'ESCAPE'}));
$('remove').addEventListener('click',()=>dispatch({type:'REMOVE'}));$('undo').addEventListener('click',()=>dispatch({type:'UNDO'}));
$('reset').addEventListener('click',()=>dispatch({type:'REQUEST_RESET'}));$('keep').addEventListener('click',()=>dispatch({type:'CANCEL_RESET'}));$('confirm').addEventListener('click',()=>dispatch({type:'CONFIRM_RESET'}));
$('reset-dialog').addEventListener('cancel',e=>{e.preventDefault();dispatch({type:'ESCAPE'});});
$('next').addEventListener('click',()=>{dispatch({type:'NAVIGATE',index:state.currentLevel+1});cellButtons.get(key(...state.cursor)).focus();});
document.addEventListener('keydown',e=>{
  if(e.ctrlKey||e.metaKey||e.altKey||e.repeat)return;
  const actions={Escape:{type:'ESCAPE'},r:{type:'ROTATE'},q:{type:'ROTATE',direction:-1},z:{type:'UNDO'},Delete:{type:'REMOVE'}};
  const action=actions[e.key]??actions[e.key.toLowerCase()];
  if(action){if(state.modal&&action.type!=='ESCAPE')return;e.preventDefault();dispatch(action);}
});
$('storage-warning').hidden=loaded.available;render();
