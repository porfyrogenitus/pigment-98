import { VERSION,defaults } from '../../types/index.ts';
import type { Settings,Model } from '../../types/index.ts';
export interface Source { filename:string; width:number; height:number; sha256:string|null; }
export function metadata(source:Source,settings:Settings,model:Model|null) {
  return {format:'pigment98-recipe',schemaVersion:1,software:{name:'PIGMENT 98',version:VERSION},createdAt:new Date().toISOString(),source,settings,model,
    processingOrder:['browser decode and orientation to 8-bit sRGB','original-image statistics restricted by optional object polygon and ROI','global or blended local regularised PCA stretch and strength interpolation','optional original-luminance illumination flattening, detail or surface view','linear-light exposure','display-referred levels','contrast and brightness','gamma','saturation','sRGB clipping and 8-bit quantisation','optional original-image multi-reference ΔE76 mask and display overlay'],
    normalisation:{method:'preserve original mean; fixed target component standard deviation',eigenvalueFloor:'max(1e-6, largest eigenvalue × regularisation)',gamut:'per-channel hard clip to [0,255]',alpha:'only fully opaque pixels contribute to statistics and masks; original alpha retained for enhanced output'},
    preview:{maxSide:1200,sampling:'nearest original pixel; statistics from full-resolution original grid'},
    warnings:['Enhancement is false colour, not evidence of pigment chemistry.','CIELAB D65/2°; uncalibrated camera colour, lighting, compression, and browser decoding influence results.','EXIF and ICC metadata are not retained in PNG exports.','Source hash identifies original file bytes, not a colour-calibrated acquisition.',...(model?.warnings??[])]};
}
export function parseRecipe(text:string):{settings:Settings;source:Source} {
  const v=JSON.parse(text);if(v.format!=='pigment98-recipe'||v.schemaVersion!==1||!['0.1.0',VERSION].includes(v.software?.version))throw new Error('Not a supported PIGMENT 98 recipe.');
  if(v.software.version==='0.1.0')v.settings={...defaults(),...v.settings};
  const s=v.settings as Settings;if(!s||!v.source||typeof v.source.filename!=='string'||!Number.isInteger(v.source.width)||v.source.width<1||!Number.isInteger(v.source.height)||v.source.height<1||(v.source.sha256!==null&&typeof v.source.sha256!=='string'))throw new Error('Recipe is missing valid source information.');
  const ranges:Record<string,[number,number]>={strength:[0,1],targetSD:[1,80],regularisation:[.000001,.1],maxGain:[1,32],brightness:[-100,100],contrast:[0,3],gamma:[.2,3],saturation:[0,3],exposure:[-3,3],black:[0,254],white:[1,255],threshold:[0,150],opacity:[0,1]};
  for(const [k,[lo,hi]] of Object.entries(ranges)){const n=(s as unknown as Record<string,unknown>)[k];if(typeof n!=='number'||!Number.isFinite(n)||n<lo||n>hi)throw new Error(`Invalid recipe setting: ${k}`);}
  if(s.white<=s.black||!['rgb','lab'].includes(s.space)||!['none','decorrelation'].includes(s.algorithm)||!['off','overlay','mask','only','heatmap'].includes(s.maskView))throw new Error('Invalid recipe algorithm, levels, or display mode.');
  const vector=(a:unknown,min:number,max:number)=>Array.isArray(a)&&a.length===3&&a.every(x=>typeof x==='number'&&Number.isFinite(x)&&x>=min&&x<=max);
  if(!vector(s.weights,0,2)||(s.reference!==null&&!vector(s.reference,-150,150)))throw new Error('Invalid recipe colour vector.');
  for(const k of ['useROI','applyROI','invert'] as const)if(typeof s[k]!=='boolean')throw new Error(`Invalid recipe flag: ${k}`);
  for(const r of [s.roi,s.referenceRegion])if(r!==null&&(!r||![r.x,r.y,r.width,r.height].every(Number.isInteger)||r.x<0||r.y<0||r.width<1||r.height<1||r.x+r.width>v.source.width||r.y+r.height>v.source.height))throw new Error('Invalid recipe region.');
  if((s.useROI||s.applyROI)&&!s.roi)throw new Error('Recipe needs a region of interest.');
  for(const k of ['useObject','applyObject','localStretch'] as const)if(typeof s[k]!=='boolean')throw new Error(`Invalid recipe flag: ${k}`);
  for(const [k,lo,hi] of [['localSize',64,2048],['radius',1,128],['direction',0,180]] as const)if(!Number.isInteger(s[k])||s[k]<lo||s[k]>hi)throw new Error(`Invalid spatial setting: ${k}`);
  for(const [k,hi] of [['illumination',1],['detail',4]] as const)if(!Number.isFinite(s[k])||s[k]<0||s[k]>hi)throw new Error(`Invalid spatial setting: ${k}`);
  if(!['off','luminance','highpass','edges','directional'].includes(s.surface))throw new Error('Invalid surface view.');
  if(!Array.isArray(s.references)||s.references.length>16||s.references.some(r=>!vector(r,-150,150)))throw new Error('Invalid reference samples.');
  if(!Array.isArray(s.objectPolygon)||s.objectPolygon.length>256||s.objectPolygon.some(p=>!Array.isArray(p)||p.length!==2||!p.every(Number.isInteger)||p[0]<0||p[1]<0||p[0]>=v.source.width||p[1]>=v.source.height))throw new Error('Invalid object polygon.');
  if((s.useObject||s.applyObject)&&s.objectPolygon.length<3)throw new Error('Object selection needs at least three vertices.');
  // Copy only the supported schema, never merge arbitrary imported keys into live state.
  const clean=defaults();for(const k of Object.keys(clean) as (keyof Settings)[])(clean as unknown as Record<string,unknown>)[k]=s[k];
  return {settings:clean,source:v.source};
}
export function download(blob:Blob,name:string){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
export const pngBlob=(canvas:HTMLCanvasElement)=>new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('PNG encoding failed; try a smaller image.')),'image/png'));
