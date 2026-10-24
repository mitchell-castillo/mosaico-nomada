import {readdirSync,readFileSync} from 'node:fs';import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('..',import.meta.url));process.chdir(root);
function run(args){const result=spawnSync(process.execPath,args,{stdio:'inherit'});if(result.status!==0)process.exit(result.status??1);}
function walk(path){return readdirSync(path,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${path}/${e.name}`):[`${path}/${e.name}`]);}
const files=walk('.');for(const f of files.filter(f=>/\.(m?js)$/.test(f)))run(['--check',f]);
const html=readFileSync('index.html','utf8');for(const match of html.matchAll(/(?:src|href)="(\.\/[^"?#]+)"/g))readFileSync(match[1]);
for(const f of ['src/app.js','src/storage.js','src/model.js']){const source=readFileSync(f,'utf8');if(/\b(fetch|XMLHttpRequest|WebSocket|sendBeacon)\s*\(/.test(source))throw Error(`Unexpected network in ${f}`);}
if(!html.includes('lang="es"')||!html.includes('<dialog')||!html.includes('aria-live="polite"'))throw Error('Missing accessibility foundation');
const pkg=JSON.parse(readFileSync('package.json'));if(pkg.dependencies)throw Error('Unexpected runtime dependency');
run(['--test',...files.filter(f=>f.endsWith('.test.mjs'))]);console.log('CHECK OK: syntax, local assets, no gameplay network, accessibility foundation and all tests.');
