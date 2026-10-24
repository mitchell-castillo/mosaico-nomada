// Minimal non-rendering DOM adapter. These tests exercise real app handlers,
// not browser layout, native dialog behavior or an accessibility engine.
import {readFileSync} from 'node:fs';
class Element {
 constructor(doc,tag='div'){this.doc=doc;this.tagName=tag.toUpperCase();this.children=[];this.listeners={};this.attributes={};this.dataset={};this.hidden=false;this.disabled=false;this.tabIndex=-1;this._text='';this._classes=new Set();this.style={values:{},setProperty:(k,v)=>this.style.values[k]=v,removeProperty:k=>delete this.style.values[k]};this.classList={add:(...v)=>v.forEach(c=>this._classes.add(c)),toggle:(c,value)=>{if(value??!this._classes.has(c))this._classes.add(c);else this._classes.delete(c);},contains:c=>this._classes.has(c)};}
 set className(s){this._classes=new Set(s.split(' ').filter(Boolean));}get className(){return [...this._classes].join(' ');}
 set textContent(s){this._text=String(s);this.children=[];}get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}
 get firstChild(){return this.children[0];}append(...els){this.children.push(...els);}replaceChildren(...els){this._text='';this.children=els;}
 setAttribute(k,v){this.attributes[k]=String(v);}removeAttribute(k){delete this.attributes[k];}
 addEventListener(name,fn){(this.listeners[name]??=[]).push(fn);}
 fire(name,event={}){const e={target:this,preventDefault(){this.defaultPrevented=true;},...event};for(const fn of this.listeners[name]??[])fn(e);return e;}
 click(){if(!this.disabled)this.fire('click');}
 focus(){this.doc.activeElement=this;this.fire('focus');}
 showModal(){this.open=true;}close(){this.open=false;}
}
export async function boot(storage) {
 const elements={};const doc={listeners:{},activeElement:null,getElementById:id=>elements[id],createElement:tag=>new Element(doc,tag),addEventListener(name,fn){(this.listeners[name]??=[]).push(fn);}};
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 for(const match of html.matchAll(/<([a-z]+)[^>]*\bid="([^"]+)"[^>]*>/g)){const el=new Element(doc,match[1]);el.id=match[2];el.hidden=match[0].includes(' hidden');elements[el.id]=el;}
 globalThis.document=doc;globalThis.localStorage=storage;
 await import(`../src/app.js?test=${Math.random()}`);
 return {doc,elements,click:id=>elements[id].click(),key:(key,target=doc.activeElement)=>{const e={key,target,preventDefault(){this.defaultPrevented=true;}};if(target)target.fire('keydown',e);for(const fn of doc.listeners.keydown??[])fn(e);},piece:id=>elements.pieces.children.find(b=>b.attributes['aria-label']?.startsWith(`Pieza ${id},`)),cell:(x,y)=>elements.board.children.find(b=>Number(b.dataset.x)===x&&Number(b.dataset.y)===y)};
}
export function memoryStorage(){const values=new Map();return {values,getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};}
