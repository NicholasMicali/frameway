import {clamp,type Step} from './model';
export function automaticZoom(step:Step){
 const w=step.areaWidth??.25,h=step.areaHeight??.2;
 return Math.max(100,Math.min(Math.round(105+15*(1-Math.sqrt(w*h))),Math.floor(100/Math.max(w,h))));
}
export function areaZoom(step:Step){
 const w=step.areaWidth??.25,h=step.areaHeight??.2;
 const x=clamp(step.x,w/2,1-w/2),y=clamp(step.y,h/2,1-h/2);
 const scale=step.kind==='image'&&step.style==='area'&&step.zoomEnabled?(step.zoomPercent??automaticZoom(step))/100:1;
 const tx=clamp(.5-x*scale,1-scale,0),ty=clamp(.5-y*scale,1-scale,0);
 return {scale,tx,ty,x,y};
}
export function areaZoomVars(step:Step){
 const {scale,tx,ty,x,y}=areaZoom(step);
 return {'--zoom-transform':`translate(${tx*100}%,${ty*100}%) scale(${scale})`,'--zoom-left':`${(x*scale+tx)*100}%`,'--zoom-top':`${(y*scale+ty)*100}%`,'--zoom-scale':scale};
}
