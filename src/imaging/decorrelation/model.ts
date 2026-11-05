import type { Raster, Rect, Settings, Vec3, Model } from '../../types/index.ts';
import { Covariance,eigenSymmetric,identity,zeros } from './matrix.ts';
import { rgbToLab } from '../colour/lab.ts';
import { inObject } from '../segmentation/object.ts';
export function bounds(image: Raster,roi: Rect|null): Rect {
  if(!roi) return {x:0,y:0,width:image.width,height:image.height};
  const x=Math.max(0,Math.min(image.width-1,Math.floor(roi.x))),y=Math.max(0,Math.min(image.height-1,Math.floor(roi.y)));
  return {x,y,width:Math.max(1,Math.min(image.width-x,Math.floor(roi.width))),height:Math.max(1,Math.min(image.height-y,Math.floor(roi.height)))};
}
export const inside = (x:number,y:number,r:Rect) => x>=r.x && y>=r.y && x<r.x+r.width && y<r.y+r.height;
/** Full-resolution original; deterministic 2D grid capped at about 250,000 samples. */
export function fitModel(image: Raster,s: Settings,window?:Rect): Model {
  const r=bounds(image,window??(s.useROI?s.roi:null)),stride=Math.max(1,Math.ceil(Math.sqrt(r.width*r.height/(window?4096:250000)))),cov=new Covariance();
  for(let y=r.y;y<r.y+r.height;y+=stride) for(let x=r.x;x<r.x+r.width;x+=stride) {
    const i=(y*image.width+x)*4;
    if(image.data[i+3]!==255) continue;
    if(s.useObject&&!inObject(x,y,s.objectPolygon))continue;
    if(window&&s.useROI&&s.roi&&!inside(x,y,bounds(image,s.roi)))continue;
    const rgb: Vec3=[image.data[i],image.data[i+1],image.data[i+2]];
    cov.add(s.space==='lab'?rgbToLab(rgb):rgb);
  }
  const covariance=cov.matrix(),{values,vectors}=eigenSymmetric(covariance),warnings:string[]=[];
  let matrix=identity();
  const total=values.reduce((a,b)=>a+b,0);
  if(cov.count<2 || total<1e-10) warnings.push('Insufficient opaque colour variance: decorrelation is the identity.');
  else {
    const floor=Math.max(1e-6,Math.max(0,values[0])*s.regularisation);
    const gains=values.map(v=>Math.min(s.maxGain,s.targetSD/Math.sqrt(Math.max(v,floor))));
    if(values.some(v=>v<floor)) warnings.push('Near-singular covariance: eigenvalue floor applied.');
    if(gains.some(v=>v===s.maxGain)) warnings.push('Component gain reached the configured safety cap.');
    matrix=zeros();
    for(let i=0;i<3;i++) for(let j=0;j<3;j++) for(let k=0;k<3;k++) matrix[i][j]+=vectors[i][k]*gains[k]*vectors[j][k];
  }
  return {mean:cov.mean,covariance,matrix,eigenvalues:values,count:cov.count,stride,warnings};
}
