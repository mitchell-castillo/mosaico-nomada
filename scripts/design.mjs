// Authoring tool, deterministic. Produces fixed content, never runs in the game.
import { writeFileSync, mkdirSync } from 'node:fs';
import { rotate, orientations, key } from '../src/geometry.js';
const shapes={L:[[0,0],[0,1],[0,2],[1,2]],T:[[0,0],[1,0],[2,0],[1,1]],O:[[0,0],[1,0],[0,1],[1,1]],S:[[1,0],[2,0],[0,1],[1,1]],I:[[0,0],[0,1],[0,2],[0,3]],P:[[0,0],[1,0],[0,1],[1,1],[0,2]],V:[[0,0],[0,1],[0,2],[1,2],[2,2]],U:[[0,0],[2,0],[0,1],[1,1],[2,1]]};
const designs=[
 ['patio','Patio de arcilla','Toda aventura empieza por una esquina.','Tres piezas para conocer el ancla y el giro.', ['####','####','####'],['L','L','O']],
 ['arco','Arco de sal','Un hueco también forma parte del paisaje.','El hueco del borde no se puede cubrir.', ['#####','#####','##.##','##.##'],['L','P','V','T']],
 ['duna','Duna escalonada','Busca primero las puntas del horizonte.','Los extremos estrechos dan buenas pistas.', ['..###','.####','#####','####.','###..'],['P','V','P','L']],
 ['ventana','Ventana azul','Deja que el centro respire.','La isla vacía del centro queda descubierta.', ['#####','#####','##.##','#####','#####'],['T','L','L','S','O','O']],
 ['caravana','Caravana','Cada recodo tiene una pieza esperando.','Gira sin reflejar: una pieza siempre conserva su cara.', ['.####.','######','######','######','.####.'],['P','V','L','L','T','S']],
 ['atlas','Atlas de retazos','Tu última parada reúne todo el viaje.','Ocho piezas, una sola silueta por completar.', ['.####.','######','######','######','######','.####.'],['L','L','T','T','O','S','S','I']]
];
// Try shape inventories of the required area until a compact exact tiling exists.
function partition(rows, inventory) {
 const cells=rows.flatMap((row,y)=>[...row].flatMap((v,x)=>v==='#'?[[x,y]]:[]));
 const empty=new Set(cells.map(c=>key(...c))); const used=[];
 function visit(rest) {
  if(!rest.size)return [...used];
  const [x,y]=[...rest][0].split(',').map(Number);
  const options=inventory.filter((_,i)=>!used.some(o=>o.i===i));
  for(const name of [...new Set(options)]) for(const r of orientations(shapes[name])) for(const [dx,dy] of rotate(shapes[name],r)) {
    const ox=x-dx,oy=y-dy;const tile=rotate(shapes[name],r).map(([a,b])=>key(a+ox,b+oy));
    if(tile.every(c=>rest.has(c))) {
      const i=inventory.findIndex((s,j)=>s===name&&!used.some(o=>o.i===j));
      used.push({i,name,r,x:ox,y:oy});
      const found=visit(new Set([...rest].filter(c=>!tile.includes(c))));if(found)return found;used.pop();
    }
  }
  return null;
 }
 return {cells,result:visit(empty)};
}
const levels=[],solutions=[];
for(const [id,name,subtitle,hint,rows,preferred] of designs) {
 let inventory=preferred;
 const area=rows.join('').replaceAll('.','').length;
 if(inventory.reduce((a,s)=>a+shapes[s].length,0)!==area) throw Error(`${id}: inventory area ${inventory.reduce((a,s)=>a+shapes[s].length,0)} != ${area}`);
 let {cells,result}=partition(rows,inventory);
 if(!result) {
   const names=Object.keys(shapes); let found=false;
   function choose(list,start,total) {
     if(found || total>area)return;
     if(list.length===preferred.length) {
       if(total!==area || new Set(list).size<3)return;
       const attempt=partition(rows,list);
       if(attempt.result){inventory=list;result=attempt.result;found=true;}return;
     }
     for(let i=start;i<names.length;i++)choose([...list,names[i]],i,total+shapes[names[i]].length);
   }
   choose([],0,0);
 }
 if(!result)throw Error(`No tiling: ${id}`);
 const pieces=inventory.map((s,i)=>({id:String.fromCharCode(65+i),cells:rotate(shapes[s],(i+1)%4)}));
 const solution=Object.fromEntries(result.map(o=>[pieces[o.i].id,{x:o.x+rotate(shapes[o.name],o.r)[0][0],y:o.y+rotate(shapes[o.name],o.r)[0][1],r:(o.r-(o.i+1)%4+4)%4}]));
 levels.push({id,name,subtitle,hint,width:rows[0].length,height:rows.length,cells,pieces});solutions.push(solution);
 console.log(id,area,pieces.length);
}
writeFileSync(new URL('../src/levels.js',import.meta.url),`// Original fixed boards for the 2026-10-24 edition. Generated once by scripts/design.mjs.\nexport const LEVELS = ${JSON.stringify(levels,null,2)};\n`);
mkdirSync(new URL('../tests',import.meta.url),{recursive:true});
writeFileSync(new URL('../tests/solutions.json',import.meta.url),JSON.stringify(solutions,null,2)+'\n');
