import type { Raster,Rect,Vec3,Settings } from '../../types/index.ts';
import { rgbToLab,deltaE76,labToRgb,clamp } from '../colour/lab.ts';
import { bounds } from '../decorrelation/model.ts';
export function sampleRegion(image:Raster,region:Rect): {lab:Vec3; rgb:Vec3; count:number} {
  const r=bounds(image,region),lab:Vec3=[0,0,0];let count=0;
  for(let y=r.y;y<r.y+r.height;y++) for(let x=r.x;x<r.x+r.width;x++) {
    const i=(y*image.width+x)*4;if(image.data[i+3]!==255) continue;
    const l=rgbToLab([image.data[i],image.data[i+1],image.data[i+2]]);count++;
    for(let c=0;c<3;c++) lab[c]+=(l[c]-lab[c])/count;
  }
  if(!count) throw new Error('The sampling region contains no fully opaque pixels.');
  return {lab,rgb:labToRgb(lab).map(v=>Math.round(clamp(v))) as Vec3,count};
}
export function similarity(rgb:Vec3,alpha:number,s:Settings) {
  if(!s.reference || alpha!==255) return {selected:false,distance:Infinity};
  const distance=deltaE76(rgbToLab(rgb),s.reference),match=distance<=s.threshold;
  return {selected:s.invert?!match:match,distance};
}
