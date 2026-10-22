import type {Project} from './model';
let connection:Promise<IDBDatabase>;
function db(){return connection??=new Promise((resolve,reject)=>{const r=indexedDB.open('frameway',1);r.onupgradeneeded=()=>{r.result.createObjectStore('projects',{keyPath:'id'});r.result.createObjectStore('chunks');r.result.createObjectStore('sessions',{keyPath:'id'});};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
export async function put(store:string,value:unknown,key?:IDBValidKey){const d=await db();return new Promise<void>((res,rej)=>{const t=d.transaction(store,'readwrite');const s=t.objectStore(store);key===undefined?s.put(value):s.put(value,key);t.oncomplete=()=>res();t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error??Error('Storage transaction aborted'));});}
export async function get<T>(store:string,key:IDBValidKey):Promise<T|undefined>{const d=await db();return new Promise((res,rej)=>{const q=d.transaction(store).objectStore(store).get(key);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error);});}
export async function all<T>(store:string):Promise<T[]>{const d=await db();return new Promise((res,rej)=>{const q=d.transaction(store).objectStore(store).getAll();q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error);});}
export async function remove(store:string,key:IDBValidKey){const d=await db();return new Promise<void>((res,rej)=>{const t=d.transaction(store,'readwrite');t.objectStore(store).delete(key);t.oncomplete=()=>res();t.onerror=()=>rej(t.error);});}
export const saveProject=(p:Project)=>put('projects',p);
