import { LEVELS } from './levels.js';
import { canPlace, validPlacements, isComplete, ownerAt } from './geometry.js';
const copy = value => structuredClone(value);
const blankBoard = () => ({ placements:{}, moves:0, history:[] });
export function initialState() {
  return {currentLevel:0,completed:{},boards:LEVELS.map(blankBoard),selected:null,rotation:0,cursor:LEVELS[0].cells[0],modal:null,status:'Selecciona una pieza para empezar.'};
}
export function unlocked(state) {
  for(let i=0;i<LEVELS.length;i++)if(!state.completed[i])return i;
  return LEVELS.length-1;
}
export function reduce(state, action) {
  const next=copy(state),level=LEVELS[next.currentLevel],board=next.boards[next.currentLevel];
  if(action.type==='ESCAPE') {
    if(next.modal){next.modal=null;next.status='Reinicio cancelado. Tu mosaico sigue igual.';}
    else {next.selected=null;next.rotation=0;next.status='Selección cancelada.';}return next;
  }
  if(next.modal) {
    if(action.type==='CANCEL_RESET'){next.modal=null;next.status='Reinicio cancelado. Tu mosaico sigue igual.';}
    if(action.type==='CONFIRM_RESET'){
      next.boards[next.currentLevel]=blankBoard();next.modal=null;next.selected=null;next.rotation=0;
      next.status='Tablero reiniciado. Tus mosaicos completados se conservan.';
    }return next;
  }
  function remember(){board.history.push({placements:copy(board.placements),moves:board.moves});if(board.history.length>200)board.history.shift();}
  function finish(){
    if(isComplete(level,board.placements)) {
      const previous=next.completed[next.currentLevel]?.bestMoves ?? Infinity;
      next.completed[next.currentLevel]={bestMoves:Math.min(previous,Math.max(1,board.moves))};
      next.status=next.currentLevel===5?'¡Colección completa! Has tejido los seis paisajes.':'¡Mosaico completo! Ya puedes viajar al siguiente tablero.';
    }
  }
  switch(action.type) {
    case 'SELECT': {
      if(!level.pieces.some(p=>p.id===action.id))break;
      next.selected=next.selected===action.id?null:action.id;
      next.rotation=board.placements[action.id]?.r??0;
      next.status=next.selected?`Pieza ${action.id} seleccionada. El punto marca su ancla. Gira y pulsa una casilla.`:'Selección cancelada.';break;
    }
    case 'ROTATE':
      if(next.selected){next.rotation=(next.rotation+(action.direction===-1?3:1))%4;next.status=`Pieza ${next.selected}: giro ${next.rotation*90}°. El punto marca la primera casilla de la fila superior.`;}break;
    case 'CURSOR':
      if(level.cells.some(([x,y])=>x===action.x&&y===action.y))next.cursor=[action.x,action.y];break;
    case 'ACTIVATE': {
      const [x,y]=next.cursor;
      if(!next.selected){const id=ownerAt(level,board.placements,x,y);if(id)return reduce(next,{type:'SELECT',id});next.status='Elige primero una pieza de la bandeja.';break;}
      const placement={x,y,r:next.rotation};
      const check=canPlace(level,board.placements,next.selected,placement);
      if(!check.ok){next.status=check.reason;break;}
      if(JSON.stringify(board.placements[next.selected])===JSON.stringify(placement)){next.status='La pieza ya está aquí.';break;}
      remember();board.placements[next.selected]=placement;board.moves++;
      next.status=`Pieza ${next.selected} colocada. ${Object.keys(board.placements).length} de ${level.pieces.length} piezas.`;
      next.selected=null;next.rotation=0;finish();break;
    }
    case 'REMOVE': {
      const id=next.selected??ownerAt(level,board.placements,...next.cursor);
      if(id&&board.placements[id]){remember();delete board.placements[id];board.moves++;next.selected=null;next.rotation=0;next.status=`Pieza ${id} devuelta a la bandeja.`;}
      else next.status='Selecciona una pieza colocada para retirarla.';break;
    }
    case 'UNDO': {
      const last=board.history.pop();if(last){board.placements=last.placements;board.moves=last.moves;next.selected=null;next.rotation=0;next.status='Última colocación o retirada deshecha.';}else next.status='Aún no hay cambios que deshacer.';break;
    }
    case 'REQUEST_RESET':next.modal='reset';break;
    case 'NAVIGATE': {
      if(!Number.isInteger(action.index)||action.index<0||action.index>unlocked(next))break;
      next.currentLevel=action.index;next.selected=null;next.rotation=0;next.cursor=LEVELS[action.index].cells[0];
      next.status='Tu avance de cada tablero se conserva. Elige una pieza.';break;
    }
  }
  return next;
}
export function toProgress(state,now=new Date().toISOString()) {
  return {version:1,currentLevel:state.currentLevel,completed:copy(state.completed),run:{boards:copy(state.boards)},updatedAt:now};
}
function safeSnapshot(value,level) {
  return value && validPlacements(level,value.placements) && Number.isInteger(value.moves) && value.moves>=0 && value.moves<100000;
}
export function fromProgress(value) {
  const state=initialState();
  if(!value||value.version!==1)return state;
  for(let i=0;i<6;i++){
    const best=value.completed?.[i]?.bestMoves;
    if(Number.isInteger(best)&&best>0&&best<100000)state.completed[i]={bestMoves:best};
    const candidate=value.run?.boards?.[i];
    if(safeSnapshot(candidate,LEVELS[i])) {
      state.boards[i]={placements:copy(candidate.placements),moves:candidate.moves,history:Array.isArray(candidate.history)?candidate.history.slice(-200).filter(h=>safeSnapshot(h,LEVELS[i])).map(h=>({placements:copy(h.placements),moves:h.moves})):[]};
    }
  }
  if(Number.isInteger(value.currentLevel))state.currentLevel=Math.max(0,Math.min(unlocked(state),value.currentLevel));
  state.cursor=LEVELS[state.currentLevel].cells[0];state.status='Avance recuperado. Continúa tu mosaico.';
  return state;
}
