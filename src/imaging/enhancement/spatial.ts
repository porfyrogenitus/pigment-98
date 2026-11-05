import type {Raster,Settings,Vec3} from '../../types/index.ts';
import {inObject} from '../segmentation/object.ts';
/** Source-resolution luminance integral images: identical neighbourhoods for preview/export. */
export function spatialTransform(image:Raster,s:Settings) {
  const {width:w,height:h,data}=image, pitch=w+1;
  const sum=new Float64Array((w+1)*(h+1)),count=new Uint32Array(sum.length);
  const luminance=(x:number,y:number)=>{const i=(Math.max(0,Math.min(h-1,y))*w+Math.max(0,Math.min(w-1,x)))*4;return .2126*data[i]+.7152*data[i+1]+.0722*data[i+2];};
  for(let y=0;y<h;y++){let row=0,n=0;for(let x=0;x<w;x++){
    if(data[(y*w+x)*4+3]===255&&(!s.useObject||inObject(x,y,s.objectPolygon))){row+=luminance(x,y);n++;}
    const j=(y+1)*pitch+x+1;sum[j]=sum[j-pitch]+row;count[j]=count[j-pitch]+n;
  }}
  const global=sum[sum.length-1]/Math.max(1,count[count.length-1]);
  return (x:number,y:number,rgb:Vec3):Vec3=>{
    const r=s.radius,x0=Math.max(0,x-r),x1=Math.min(w,x+r+1),y0=Math.max(0,y-r),y1=Math.min(h,y+r+1);
    const a=y0*pitch+x0,b=y0*pitch+x1,c=y1*pitch+x0,d=y1*pitch+x1;
    const n=count[d]-count[b]-count[c]+count[a],l=luminance(x,y),mean=n?(sum[d]-sum[b]-sum[c]+sum[a])/n:l;
    const high=l-mean;
    if(s.surface==='highpass')return [128+high*(1+s.detail),128+high*(1+s.detail),128+high*(1+s.detail)];
    if(s.surface==='edges'||s.surface==='directional'){
      const dx=(luminance(x+1,y)-luminance(x-1,y))/2,dy=(luminance(x,y+1)-luminance(x,y-1))/2;
      const angle=s.direction*Math.PI/180,v=s.surface==='edges'?Math.hypot(dx,dy)*(1+s.detail):128+(dx*Math.cos(angle)+dy*Math.sin(angle))*(1+s.detail);
      return [v,v,v];
    }
    const delta=s.illumination*(global-mean)+s.detail*high;
    return s.surface==='luminance'?[l+delta,l+delta,l+delta]:rgb.map(v=>v+delta) as Vec3;
  };
}
