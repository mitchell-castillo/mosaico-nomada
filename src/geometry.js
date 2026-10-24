export const key = (x, y) => `${x},${y}`;
export function normalize(cells) {
  const left = Math.min(...cells.map(c => c[0]));
  const top = Math.min(...cells.map(c => c[1]));
  return cells.map(([x,y]) => [x-left,y-top]).sort((a,b) => a[1]-b[1] || a[0]-b[0]);
}
export function rotate(cells, turns = 1) {
  let result = cells;
  for (let i = 0; i < ((turns % 4)+4)%4; i++) result = result.map(([x,y]) => [-y,x]);
  return normalize(result);
}
export function orientations(cells) {
  return [...new Map([0,1,2,3].map(r => [JSON.stringify(rotate(cells,r)),r])).values()];
}
export function absolute(piece, placement) {
  const cells=rotate(piece.cells, placement.r),[ax,ay]=cells[0];
  return cells.map(([x,y]) => [x-ax+placement.x,y-ay+placement.y]);
}
export function ownerAt(level, placements, x, y) {
  for (const piece of level.pieces) {
    if (placements[piece.id] && absolute(piece,placements[piece.id]).some(c => c[0]===x && c[1]===y)) return piece.id;
  }
  return null;
}
export function canPlace(level, placements, id, placement) {
  const piece = level.pieces.find(p => p.id===id);
  if (!piece || !placement || !['x','y','r'].every(k => Number.isInteger(placement[k])) || placement.r<0 || placement.r>3) return { ok:false, reason:'Posición no válida.' };
  const mask = new Set(level.cells.map(c => key(...c)));
  for (const [x,y] of absolute(piece,placement)) {
    if (!mask.has(key(x,y))) return { ok:false, reason:'La pieza sale de la silueta. Mueve su ancla o gírala.' };
    const owner = ownerAt(level,placements,x,y);
    if (owner && owner!==id) return { ok:false, reason:`La pieza se cruza con ${owner}. Prueba otra posición.` };
  }
  return { ok:true, reason:'Encaja aquí.' };
}
export function validPlacements(level, placements) {
  if (!placements || typeof placements!=='object' || Array.isArray(placements)) return false;
  if (Object.keys(placements).some(id => !level.pieces.some(p => p.id===id))) return false;
  return Object.entries(placements).every(([id,p]) => canPlace(level,placements,id,p).ok);
}
export function isComplete(level, placements) {
  return validPlacements(level,placements) && Object.keys(placements).length===level.pieces.length &&
    level.cells.every(([x,y]) => ownerAt(level,placements,x,y));
}
