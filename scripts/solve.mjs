import { LEVELS } from '../src/levels.js';
import { solve } from './solver.js';
import { isComplete } from '../src/geometry.js';
const report=LEVELS.map(level=>{
 const result=solve(level);
 if(!result.solutions.length||!isComplete(level,result.solutions[0]))throw Error(`Sin solución válida: ${level.id}`);
 return {id:level.id,cells:level.cells.length,pieces:level.pieces.length,nodes:result.nodes,solution:result.solutions[0]};
});console.log(JSON.stringify(report,null,2));
