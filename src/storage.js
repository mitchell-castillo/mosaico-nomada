import { initialState, fromProgress, toProgress } from './model.js';
export const STORAGE_KEY='daily-games:mosaico-nomada:v1';
export function load(storage) {
  try {
    const raw=(storage??globalThis.localStorage).getItem(STORAGE_KEY);
    if(!raw)return {state:initialState(),available:true};
    if(raw.length>500000)throw Error('too large');
    return {state:fromProgress(JSON.parse(raw)),available:true};
  }catch {return {state:initialState(),available:false};}
}
export function save(state,storage) {
  try{(storage??globalThis.localStorage).setItem(STORAGE_KEY,JSON.stringify(toProgress(state)));return true;}
  catch{return false;}
}
