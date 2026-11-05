import type { Raster, Settings, Model, Vec3 } from '../types/index.ts';
import { rgbToLab,labToRgb,clamp } from './colour/lab.ts';
import { mulVec } from './decorrelation/matrix.ts';
import { fitModel,inside,bounds } from './decorrelation/model.ts';
import { adjust } from './enhancement/adjust.ts';
import { similarity } from './segmentation/mask.ts';
import {inObject} from './segmentation/object.ts';
import {localTransform} from './decorrelation/local.ts';
import {spatialTransform} from './enhancement/spatial.ts';
export type OutputKind = 'enhanced'|'mask'|'overlay'|'only'|'heatmap';
export interface ProcessingResult { image:Raster; model:Model; clippedPixels:number; selectedPixels:number; evaluatedPixels:number; }
/** Each output pixel is processed directly from the original; preview uses nearest source samples. */
export function process(image:Raster,s:Settings,kind:OutputKind='enhanced',maxSide?:number,model=fitModel(image,s)): ProcessingResult {
  const ratio=maxSide?Math.min(1,maxSide/Math.max(image.width,image.height)):1;
  const width=Math.max(1,Math.round(image.width*ratio)),height=Math.max(1,Math.round(image.height*ratio));
  const data=new Uint8ClampedArray(width*height*4),roi=bounds(image,s.roi);
  const local=s.localStretch&&s.algorithm==='decorrelation'&&s.strength?localTransform(image,s,model):null;
  const spatial=s.illumination||s.detail||s.surface!=='off'?spatialTransform(image,s):null;
  let clippedPixels=0,selectedPixels=0,evaluatedPixels=0;
  for(let y=0;y<height;y++) for(let x=0;x<width;x++) {
    const sx=Math.min(image.width-1,Math.floor(x*image.width/width)),sy=Math.min(image.height-1,Math.floor(y*image.height/height));
    const i=(sy*image.width+sx)*4,j=(y*width+x)*4,a=image.data[i+3];
    const original:Vec3=[image.data[i],image.data[i+1],image.data[i+2]];
    let rgb:Vec3=[...original];
    if(a===0) {data.set([original[0],original[1],original[2],0],j);continue;}
    const object=inObject(sx,sy,s.objectPolygon);
    if((!s.applyROI || inside(sx,sy,roi))&&(!s.applyObject||object)) {
      if(s.algorithm==='decorrelation' && s.strength!==0 && model.count>=2) {
        const colour=s.space==='lab'?rgbToLab(original):original;
        const diff=colour.map((v,c)=>v-model.mean[c]) as Vec3,transformed=mulVec(model.matrix,diff);
        const change=local?local(sx,sy,colour):transformed.map((v,c)=>v-diff[c]);
        const enhanced=colour.map((v,c)=>v+s.strength*s.weights[c]*change[c]) as Vec3;
        rgb=s.space==='lab'?labToRgb(enhanced):enhanced;
      }
      if(spatial)rgb=spatial(sx,sy,rgb);
      rgb=adjust(rgb,s);
    }
    if(rgb.some(v=>v<-.001||v>255.001)) clippedPixels++;
    rgb=rgb.map(v=>clamp(v)) as Vec3;
    if(kind!=='enhanced' || s.reference) {
      const eligible=!s.applyObject||object;
      const {selected,distance}=similarity(original,eligible?a:0,s);
      if(a===255&&eligible) evaluatedPixels++;
      if(selected) selectedPixels++;
      if(kind==='mask') rgb=selected?[255,255,255]:[0,0,0];
      if(kind==='overlay' && selected) rgb=rgb.map((v,c)=>v*(1-s.opacity)+[255,0,180][c]*s.opacity) as Vec3;
      if(kind==='only' && !selected) {data.set([0,0,0,0],j);continue;}
      if(kind==='heatmap') {
        const t=Number.isFinite(distance)?1-clamp(distance/Math.max(s.threshold,1),0,1):0;
        rgb=[255*t,80*t,255*(1-t)];
      }
    }
    data.set([Math.round(rgb[0]),Math.round(rgb[1]),Math.round(rgb[2]),kind==='mask'?255:a],j);
  }
  return {image:{width,height,data},model,clippedPixels,selectedPixels,evaluatedPixels};
}
