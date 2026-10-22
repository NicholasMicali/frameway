import type {Step} from './model';
export function TitleSlide({step,src,onStart,thumbnail=false}:{step:Step;src:string;onStart?:()=>void;thumbnail?:boolean}){
 if(step.kind!=='title')return null;
 return <div className={`title-slide ${thumbnail?'title-thumbnail':''}`}><img className="title-preview" src={src} alt=""/><div className="title-copy"><h2>{step.title}</h2><p>{step.body}</p>{onStart?<button className="title-start" onClick={onStart}>{step.buttonText}</button>:<span className="title-start">{step.buttonText}</span>}</div></div>;
}
