import {useEffect,useRef,useState} from 'react';
import type {Marker} from './model';

type Props={onClose:()=>void;onComplete:(blob:Blob,duration:number,markers:Marker[])=>Promise<void>};
export function ScreenRecorder({onClose,onComplete}:Props){
 const [state,setState]=useState<'idle'|'choosing'|'recording'|'saving'>('idle'),[error,setError]=useState(''),[elapsed,setElapsed]=useState(0),[count,setCount]=useState(0);
 const preview=useRef<HTMLVideoElement>(null),stream=useRef<MediaStream|undefined>(undefined),recorder=useRef<MediaRecorder|undefined>(undefined),started=useRef(0),markers=useRef<Marker[]>([]),disposed=useRef(false);
 useEffect(()=>{disposed.current=false;return()=>{disposed.current=true;stream.current?.getTracks().forEach(t=>t.stop());};},[]);
 useEffect(()=>{if(state!=='recording')return;const timer=setInterval(()=>{const seconds=(performance.now()-started.current)/1000;setElapsed(seconds);if(seconds>=600)stop();},250);const before=(e:BeforeUnloadEvent)=>{e.preventDefault();};window.addEventListener('beforeunload',before);return()=>{clearInterval(timer);window.removeEventListener('beforeunload',before);};},[state]);
 function stop(){if(recorder.current?.state==='recording'){setState('saving');recorder.current.stop();}}
 async function start(){
  setError('');setState('choosing');
  try{
   if(!navigator.mediaDevices?.getDisplayMedia)throw Error('Screen sharing is unavailable in this browser. Open the studio in Chrome at localhost.');
   const capture=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:30},audio:false});stream.current=capture;
   if(disposed.current){capture.getTracks().forEach(t=>t.stop());return;}
   const v=preview.current!;v.srcObject=capture;await v.play();
   const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));if(!mime)throw Error('This browser cannot record WebM. Try Chrome.');
   const r=new MediaRecorder(capture,{mimeType:mime});recorder.current=r;const chunks:Blob[]=[];let size=0,failed=false;
   markers.current=[];setCount(0);setElapsed(0);
   r.ondataavailable=e=>{if(e.data.size){chunks.push(e.data);size+=e.data.size;if(size>=90*1024*1024)stop();}};
   r.onerror=()=>{failed=true;setError('Recording failed. Please try again.');stop();};
   r.onstop=async()=>{const duration=(performance.now()-started.current)/1000;capture.getTracks().forEach(t=>t.stop());if(disposed.current)return;setState('saving');try{if(failed)throw Error('Recording failed. Please try again.');if(duration<.3||!size)throw Error('The recording was too short. Record at least a second.');await onComplete(new Blob(chunks,{type:mime}),duration,markers.current);}catch(e){setError(String(e));setState('idle');}};
   capture.getVideoTracks()[0].addEventListener('ended',stop,{once:true});
   started.current=performance.now();r.start(500);setState('recording');
  }catch(e){stream.current?.getTracks().forEach(t=>t.stop());setState('idle');setError(e instanceof DOMException&&e.name==='NotAllowedError'?'Screen selection was canceled or permission was denied. Choose a screen when you’re ready.':String(e));}
 }
 function mark(){if(state!=='recording')return;markers.current.push({id:crypto.randomUUID(),time:(performance.now()-started.current)/1000,x:.5,y:.5,label:`Step ${markers.current.length+1}`,viewportWidth:preview.current?.videoWidth||1,viewportHeight:preview.current?.videoHeight||1,lagMs:0});setCount(markers.current.length);}
 return <div className="recorder-backdrop"><section className="recorder-panel" role="dialog" aria-modal="true" aria-label="Record your screen"><h2>Record your screen</h2><p>Choose a tab, window, or entire screen in your browser’s picker. Return here to stop, or use the browser’s Stop sharing button.</p><p className="capture-note">This mode records video without sound. Add screenshot steps while recording or from the timeline afterward. Automatic click detection requires the Chrome extension.</p><video ref={preview} autoPlay muted playsInline className="capture-preview" hidden={state==='idle'||state==='choosing'}/>{error&&<p role="alert">{error}</p>}<div className="capture-controls">{state==='idle'&&<button className="primary" onClick={()=>void start()}>Choose screen to record</button>}{state==='choosing'&&<span>Choose a source in the browser picker…</span>}{state==='recording'&&<><strong>● Recording · {Math.floor(elapsed/60)}:{String(Math.floor(elapsed%60)).padStart(2,'0')}</strong><button onClick={mark}>Mark screenshot step ({count})</button><button className="primary" onClick={stop}>Stop and edit</button></>}{state==='saving'&&<span role="status">Preparing your recording…</span>}<button disabled={state!=='idle'} onClick={onClose}>Cancel</button></div><details><summary>Want automatic click-by-click steps?</summary><p>Load the built <code>dist</code> folder using Load unpacked in Chrome’s extensions page. Open the tab you want to capture, then click the Frameway extension icon to start and again to finish. Its editor opens with screenshots and video steps.</p></details></section></div>;
}
