import { absolute, orientations, key } from '../src/geometry.js';
// Exact cover: branch on the uncovered cell with the fewest available placements.
// Independent from the gameplay reducer and its collision check.
export function solve(level, limit=1) {
  const mask = new Set(level.cells.map(c=>key(...c)));
  const options = new Map([...mask].map(c=>[c,[]]));
  for (const piece of level.pieces) for (const r of orientations(piece.cells)) {
    for (let y=0;y<level.height;y++) for(let x=0;x<level.width;x++) {
      const cells=absolute(piece,{x,y,r}).map(c=>key(...c));
      if(cells.every(c=>mask.has(c))) {
        const option={id:piece.id,x,y,r,cells};
        cells.forEach(c=>options.get(c).push(option));
      }
    }
  }
  const solutions=[]; let nodes=0;
  function visit(used,occupied,placements) {
    nodes++;
    if(occupied.size===mask.size) { solutions.push(placements); return; }
    let candidates=null;
    for (const cell of mask) if(!occupied.has(cell)) {
      const available=options.get(cell).filter(o=>!used.has(o.id) && o.cells.every(c=>!occupied.has(c)));
      if (!available.length) return;
      if(!candidates || available.length<candidates.length) candidates=available;
    }
    for(const o of candidates??[]) {
      visit(new Set([...used,o.id]),new Set([...occupied,...o.cells]),{...placements,[o.id]:{x:o.x,y:o.y,r:o.r}});
      if(solutions.length>=limit) return;
    }
  }
  visit(new Set(),new Set(),{});
  return {solutions,nodes};
}
