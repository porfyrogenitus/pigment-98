import '../styles/win98/main.css';
import {layout} from '../components/layout.ts';
import {Viewer} from '../components/viewer.ts';
import type {ViewMode,Tool} from '../components/viewer.ts';
import {defaults,VERSION} from '../types/index.ts';
import type {Settings,Model,Rect} from '../types/index.ts';
import type {ProcessingResult,OutputKind} from '../imaging/pipeline.ts';
import {History} from '../state/history.ts';
import {preset} from '../state/presets.ts';
import {decode,rasterCanvas} from '../imaging/import.ts';
import {metadata,parseRecipe,download,pngBlob} from '../imaging/export/metadata.ts';
import type {Source} from '../imaging/export/metadata.ts';
import {labToRgb,clamp} from '../imaging/colour/lab.ts';
import {demoFile} from './demo.ts';
import methods from '../../docs/SCIENTIFIC_METHODS.md?raw';
import roadmap from '../../docs/ROADMAP.md?raw';

document.querySelector<HTMLDivElement>('#app')!.innerHTML=layout();
const el=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
const viewer=new Viewer(el<HTMLCanvasElement>('viewer'));
let settings=defaults(),history=new History(settings),source:Source|null=null,model:Model|null=null;
let revision=0,loaded=false,exporting=false,loading=false,timer:ReturnType<typeof setTimeout>|undefined,previewRunning=false,previewNeeded=false;
let rpcId=0;const pending=new Map<number,{resolve:(v:any)=>void;reject:(e:Error)=>void}>();
const worker=new Worker(new URL('../workers/processing.ts',import.meta.url),{type:'module'});
worker.onmessage=e=>{const p=pending.get(e.data.id);if(!p)return;pending.delete(e.data.id);e.data.error?p.reject(new Error(e.data.error)):p.resolve(e.data);};
worker.onerror=e=>{for(const p of pending.values())p.reject(new Error(e.message||'Processing worker failed. Reload the application.'));pending.clear();notice('The processing worker failed. Reload the application and use a smaller image if memory is limited.');};
function rpc(type:string,payload:Record<string,unknown>,transfer:Transferable[]=[]):Promise<any>{return new Promise((resolve,reject)=>{const id=++rpcId;pending.set(id,{resolve,reject});worker.postMessage({id,type,...payload},transfer);});}
function notice(text:string){el('notification').textContent=text;el('notification').hidden=false;}
function clearNotice(){el('notification').hidden=true;}
function status(text:string){el('processing-status').textContent=text;}
function showDialog(title:string,text:string){el('dialog-title').textContent=title;el('dialog-body').textContent=text;el<HTMLDialogElement>('dialog').showModal();}
function sync(){
 document.querySelectorAll<HTMLInputElement|HTMLSelectElement>('[data-setting]').forEach(input=>{
   const k=input.dataset.setting!;const v=k.startsWith('weight')?settings.weights[Number(k.slice(-1))]:settings[k as keyof Settings];
   if(input instanceof HTMLInputElement&&input.type==='checkbox')input.checked=Boolean(v);else input.value=String(v);
   const output=document.getElementById(`value-${k}`);if(output)output.textContent=typeof v==='number'?String(Math.round(v*1000)/1000):String(v);
 });
 viewer.roi=settings.roi;viewer.draw();
 el('roi-values').textContent=settings.roi?`x ${settings.roi.x}, y ${settings.roi.y} · ${settings.roi.width} × ${settings.roi.height} px`:'Entire image';
 for(const k of ['useROI','applyROI']) (document.querySelector(`[data-setting="${k}"]`) as HTMLInputElement).disabled=!settings.roi;
 if(settings.reference){const rgb=labToRgb(settings.reference).map(v=>Math.round(clamp(v)));el('swatch').style.background=`rgb(${rgb.join(',')})`;el('sample-values').textContent=`Lab: ${settings.reference.map(x=>x.toFixed(2)).join(', ')}\nRGB ≈ ${rgb.join(', ')} · D65/2°`;}
 else {el('swatch').style.background='transparent';el('sample-values').textContent='Select a reference on the image.\nSamples always use the original.';}
 document.querySelectorAll<HTMLButtonElement>('[data-action="undo"]').forEach(b=>b.disabled=!history.canUndo);
 document.querySelectorAll<HTMLButtonElement>('[data-action="redo"]').forEach(b=>b.disabled=!history.canRedo);
}
function changed(commit=true){revision++;if(commit)history.set(settings);sync();schedule();}
function schedule(){if(!loaded)return;previewNeeded=true;status('Preview pending…');clearTimeout(timer);timer=setTimeout(()=>void preview(),120);}
async function preview(){
 if(!loaded||previewRunning||exporting||loading)return;
 previewRunning=true;previewNeeded=false;const rev=revision;status('Processing preview…');
 try {const result=await rpc('preview',{settings:structuredClone(settings),kind:settings.maskView==='off'?'enhanced':settings.maskView}) as ProcessingResult;
   if(rev===revision){applyResult(result,false);}
 }catch(e){notice((e as Error).message);status('Processing failed');}
 finally {previewRunning=false;if(previewNeeded)void preview();}
}
function applyResult(result:ProcessingResult,full:boolean){
 model=result.model;viewer.enhanced=rasterCanvas(result.image);viewer.draw();
 el('preview-note').textContent=`${full?'Full-resolution view':'Interactive preview'} · ${result.image.width} × ${result.image.height}`;
 const denom=result.evaluatedPixels;
 el('mask-stat').textContent=settings.reference?`${result.selectedPixels.toLocaleString()} / ${denom.toLocaleString()} opaque ${full?'image':'preview'} pixels selected (${denom?(100*result.selectedPixels/denom).toFixed(1):0}%).`:'';
 el('diagnostics').textContent=`Samples: ${model.count.toLocaleString()}\nGrid stride: ${model.stride} source px\nMean: ${model.mean.map(v=>v.toFixed(3)).join(', ')}\nEigenvalues: ${model.eigenvalues.map(v=>v.toPrecision(5)).join(', ')}\nClipped output pixels: ${result.clippedPixels.toLocaleString()}\n${model.warnings.join('\n')}`;
 status(`Ready · ${settings.algorithm==='none'?'Adjustments':settings.space.toUpperCase()+' PCA'} · ${result.clippedPixels.toLocaleString()} clipped`);
}
async function openFile(file:File){
 if(exporting||loading){notice('Please wait for the current image operation to finish.');return;}
 loading=true;status('Decoding image…');clearNotice();
 try {
  const decoded=await decode(file);revision++;loaded=false;
  await rpc('load',{image:decoded.image},[decoded.image.data.buffer]);
  source={filename:file.name,width:decoded.canvas.width,height:decoded.canvas.height,sha256:decoded.hash};
  settings=defaults();history=new History(settings);model=null;
  viewer.setImage(decoded.canvas);el('empty').hidden=true;
  el('preview-note').textContent='Preparing preview…';el('mask-stat').textContent='';el('diagnostics').textContent='Calculating original-image statistics…';
  el('file-status').textContent=`${file.name} · ${source.width} × ${source.height} px`;
  loaded=true;sync();
 }catch(e){notice((e as Error).message);status('Open failed');}
 finally{loading=false;if(loaded)schedule();}
}
function tool(t:Tool){viewer.tool=t;el('viewer').style.cursor=t==='pan'?'grab':'crosshair';el('tool-hint').textContent={pan:'Pan: drag image · Zoom: mouse wheel · Split: drag centre handle',roi:'Drag a rectangle; then choose statistics and/or application scope.',pick:'Click to sample one original pixel.',average:'Click to average a 5 × 5 region of original pixels.',sample:'Drag a rectangle to average its original CIELAB colours.'}[t];document.querySelectorAll('[data-action]').forEach(b=>b.classList.toggle('pressed',b.getAttribute('data-action')===t));}
viewer.onStatus=(x,y)=>{el('coordinate-status').textContent=`x: ${x??'—'} y: ${y??'—'}`;el('zoom-status').textContent=`${(viewer.zoom*100).toFixed(1)}%`;};
async function sample(r:Rect){if(!loaded||loading||exporting)return;const rev=revision;
 try{const result=await rpc('sample',{region:r});if(rev!==revision)return;settings={...settings,reference:result.lab,referenceRegion:r,maskView:'overlay'};changed();tool('pan');status(`Sampled ${result.count.toLocaleString()} opaque pixels`);}catch(e){notice((e as Error).message);}
}
viewer.onPick=(x,y,average)=>{if(!source)return;const r=average?{x:Math.max(0,x-2),y:Math.max(0,y-2),width:Math.min(source.width-1,x+2)-Math.max(0,x-2)+1,height:Math.min(source.height-1,y+2)-Math.max(0,y-2)+1}:{x,y,width:1,height:1};void sample(r);};
viewer.onRegion=(r,isSample)=>{if(exporting||loading)return;if(isSample)void sample(r);else{settings={...settings,roi:r};changed();tool('pan');}};
function view(m:ViewMode){viewer.setMode(m);el<HTMLSelectElement>('view-mode').value=m;}
function needsImage(){if(!loaded||!source){notice('Open a photograph or synthetic target first.');return false;}if(loading||exporting){notice('Please wait for the current image operation.');return false;}return true;}
async function exportImage(kind:OutputKind|'metadata'|'full'){
 if(!needsImage())return;
 if(['mask','overlay'].includes(kind)&&!settings.reference){notice('Select an original reference colour before exporting a colour-similarity mask.');return;}
 exporting=true;clearTimeout(timer);previewNeeded=false;status(kind==='full'?'Rendering full-resolution view…':'Preparing export…');clearNotice();
 const snapshot=structuredClone(settings),savedSource={...source!},rev=revision;
 const name=savedSource.filename.replace(/\.[^.]+$/,'').replace(/[^\p{L}\p{N}_-]/gu,'_');
 try {
  const result=await rpc(kind==='metadata'?'preview':'export',{settings:snapshot,kind:kind==='full'?(snapshot.maskView==='off'?'enhanced':snapshot.maskView):kind==='metadata'?'enhanced':kind}) as ProcessingResult;
  if(kind==='metadata')download(new Blob([JSON.stringify(metadata(savedSource,snapshot,result.model),null,2)],{type:'application/json'}),`${name}_pigment98_recipe.json`);
  else if(kind==='full'){if(rev===revision)applyResult(result,true);}
  else {const canvas=rasterCanvas(result.image);download(await pngBlob(canvas),`${name}_pigment98_${kind}.png`);canvas.width=canvas.height=1;}
  if(kind!=='full')status(`Exported ${kind==='metadata'?'processing recipe':savedSource.width+' × '+savedSource.height+' PNG'}`);
 }catch(e){notice((e as Error).message);status('Export failed');}
 finally{exporting=false;if(previewNeeded)void preview();}
}
async function importRecipe(file:File){
 if(!needsImage())return;
 try{if(file.size>1_000_000)throw new Error('Recipe is too large.');const recipe=parseRecipe(await file.text());
  if(recipe.source.width!==source!.width||recipe.source.height!==source!.height)throw new Error('Recipe dimensions do not match the open image.');
  if(recipe.source.sha256&&source!.sha256&&recipe.source.sha256!==source!.sha256)throw new Error('Source SHA-256 does not match. Open the exact original image used for this recipe.');
  settings=recipe.settings;changed();if(!recipe.source.sha256||!source!.sha256)notice('Recipe loaded, but source identity could not be verified because a SHA-256 hash is unavailable.');
 }catch(e){notice((e as Error).message);}
}
async function action(a:string){
 document.querySelectorAll<HTMLDetailsElement>('.menu[open]').forEach(m=>m.open=false);
 const localActions=['close-dialog','help','methods','about','roadmap','advanced','open','demo','recipe'];
 if(!localActions.includes(a)&&!needsImage())return;
 if((exporting||loading)&&!['close-dialog','help','methods','about','roadmap'].includes(a)){notice('Please wait for the current image operation.');return;}
 switch(a){
  case 'open':el<HTMLInputElement>('image-file').click();break;
  case 'demo':await openFile(await demoFile());break;
  case 'recipe':if(needsImage())el<HTMLInputElement>('recipe-file').click();break;
  case 'undo':settings=structuredClone(history.undo());changed(false);break;
  case 'redo':settings=structuredClone(history.redo());changed(false);break;
  case 'reset':settings=defaults();changed();break;
  case 'reset-enhancement':settings={...settings,algorithm:'decorrelation',strength:0,targetSD:settings.space==='lab'?18:35,weights:[1,1,1],regularisation:.001,maxGain:8};changed();break;
  case 'clear-roi':settings={...settings,roi:null,useROI:false,applyROI:false};changed();break;
  case 'zoom-in':viewer.scale(1.25);break;case 'zoom-out':viewer.scale(.8);break;
  case 'fit':viewer.fit();break;case 'actual':viewer.actual();break;
  case 'original':case 'enhanced':case 'side':case 'split':view(a);break;
  case 'toggle':view(viewer.mode==='original'?'enhanced':'original');break;
  case 'roi':case 'pick':case 'average':case 'sample':case 'pan':tool(a);break;
  case 'neutral':settings=preset('Neutral Decorrelation',settings);changed();break;
  case 'faint':settings=preset('Faint Colour Enhancement',settings);changed();break;
  case 'export':await exportImage('enhanced');break;
  case 'mask':case 'overlay':case 'metadata':case 'full':await exportImage(a);break;
  case 'advanced':el<HTMLInputElement>('advanced').checked=!el<HTMLInputElement>('advanced').checked;document.body.classList.toggle('advanced',el<HTMLInputElement>('advanced').checked);break;
  case 'close-dialog':el<HTMLDialogElement>('dialog').close();break;
  case 'help':showDialog('PIGMENT 98 — Quick start',`1. Open a JPEG, PNG, or WebP photograph. Files remain in browser memory.\n2. Choose a starting preset or increase enhancement strength. Zero strength disables decorrelation; image adjustments remain independent.\n3. Compare original and enhanced views. Wheel to zoom; Pan tool to drag. In Split view drag the centre handle.\n4. Sample one pixel, 5 × 5 pixels, or a rectangle to build an original-image CIELAB colour-similarity mask.\n5. A region can constrain statistics, processing, both, or neither. Its coordinates use the oriented original image.\n6. Export the full-resolution PNG and Settings JSON together. Reopen the original and Load JSON to repeat processing.\n\nKeyboard: Ctrl+O open; Ctrl+E export; Ctrl+Z undo; Ctrl+Shift+Z redo; + / − zoom; F fit; O toggle original; Escape pan/close menus.\n\nInteractive preview uses at most 1,200 pixels on its longest side. Choose Full-resolution view for detail inspection. Every PNG export is full resolution.\n\nWarnings: false-colour enhancement can amplify noise, stains, and compression artefacts. A colour-similarity mask is not pigment chemistry, cultural attribution, or proof of decoration. No radiometric calibration is performed. Browser decoding produces 8-bit sRGB; EXIF/ICC metadata is not retained in exports.\n\nFor privacy, no photograph is saved automatically. Closing or reloading loses the image and unsaved settings. No telemetry, account, network image processing, or cloud storage is used.`);break;
  case 'methods':showDialog('Scientific methods',methods);break;
  case 'roadmap':showDialog('Workstation roadmap',roadmap);break;
  case 'about':showDialog('About PIGMENT 98',`PIGMENT 98 ${VERSION}\nArchaeological Ceramic & Pigment Analysis Workstation\n\nPrivate experimental research software. Independently implemented covariance-based decorrelation and ΔE76 segmentation. No DStretch source or branding is included; no equivalence is claimed.\n\nThe synthetic target is generated locally and depicts no archaeological object.\n\nRuntime: TypeScript compiled to JavaScript, Canvas, and a Web Worker. No runtime third-party dependencies. Future workstations are documented under Window → Workstation roadmap.`);break;
 }
}
document.addEventListener('click',e=>{const b=(e.target as HTMLElement).closest<HTMLElement>('[data-action]');if(b)void action(b.dataset.action!);if(!(e.target as HTMLElement).closest('.menu'))document.querySelectorAll<HTMLDetailsElement>('.menu[open]').forEach(m=>m.open=false);});
document.querySelectorAll<HTMLDetailsElement>('.menu').forEach(m=>m.addEventListener('toggle',()=>{if(m.open)document.querySelectorAll<HTMLDetailsElement>('.menu').forEach(other=>{if(other!==m)other.open=false;});}));
function updateInput(input:HTMLInputElement|HTMLSelectElement,commit:boolean){
 if(exporting||loading){sync();return;}
 const key=input.dataset.setting!;
 if(key==='maskView'&&input.value!=='off'&&!settings.reference){notice('Select an original reference colour first.');sync();return;}
 let value:unknown=input instanceof HTMLInputElement&&input.type==='checkbox'?input.checked:input.value;
 if(key.startsWith('weight')){const weights=[...settings.weights] as Settings['weights'];weights[Number(key.slice(-1))]=Number(value);settings={...settings,weights};}
 else {if(typeof settings[key as keyof Settings]==='number')value=Number(value);settings={...settings,[key]:value};}
 if(key==='space')settings.targetSD=settings.space==='lab'?18:35;
 if(settings.white<=settings.black){if(key==='white')settings.black=settings.white-1;else settings.white=settings.black+1;}
 el<HTMLSelectElement>('preset').value='';changed(commit);
}
document.querySelectorAll<HTMLInputElement|HTMLSelectElement>('[data-setting]').forEach(input=>{
 if(input instanceof HTMLInputElement&&input.type==='range')input.addEventListener('input',()=>updateInput(input,false));
 input.addEventListener('change',()=>updateInput(input,true));
});
el('advanced').addEventListener('change',()=>document.body.classList.toggle('advanced',el<HTMLInputElement>('advanced').checked));
el('preset').addEventListener('change',()=>{if(exporting||loading)return;const name=el<HTMLSelectElement>('preset').value;if(name){settings=preset(name,settings);changed();}});
el('view-mode').addEventListener('change',()=>view(el<HTMLSelectElement>('view-mode').value as ViewMode));
el('image-file').addEventListener('change',()=>{const input=el<HTMLInputElement>('image-file'),file=input.files?.[0];input.value='';if(file)void openFile(file);});
el('recipe-file').addEventListener('change',()=>{const input=el<HTMLInputElement>('recipe-file'),file=input.files?.[0];input.value='';if(file)void importRecipe(file);});
const drop=el('drop-target');drop.addEventListener('dragover',e=>{e.preventDefault();drop.classList.add('dragover');});drop.addEventListener('dragleave',()=>drop.classList.remove('dragover'));drop.addEventListener('drop',e=>{e.preventDefault();drop.classList.remove('dragover');const file=e.dataTransfer?.files[0];if(file)void openFile(file);});
document.addEventListener('keydown',e=>{
 const editing=(e.target as HTMLElement).matches('input,select,textarea');
 if(e.key==='Escape'){tool('pan');document.querySelectorAll<HTMLDetailsElement>('.menu').forEach(m=>m.open=false);clearNotice();}
 if(e.ctrlKey||e.metaKey){const a=({o:'open',e:'export',z:e.shiftKey?'redo':'undo',y:'redo'} as Record<string,string>)[e.key.toLowerCase()];if(a){e.preventDefault();void action(a);}return;}
 if(editing||el<HTMLDialogElement>('dialog').open)return;
 const a=({'+':'zoom-in','=':'zoom-in','-':'zoom-out',f:'fit',o:'toggle'} as Record<string,string>)[e.key.toLowerCase()];if(a){e.preventDefault();void action(a);}
});
window.addEventListener('beforeunload',()=>worker.terminate());
sync();tool('pan');
