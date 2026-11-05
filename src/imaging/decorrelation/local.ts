import type {Raster,Settings,Model,Vec3} from '../../types/index.ts';
import {fitModel} from './model.ts';
import {mulVec} from './matrix.ts';
/** Overlapping source-coordinate windows. Blend transformed colours, not eigenvectors. */
export function localTransform(image:Raster,s:Settings,fallback:Model) {
  const step=Math.max(s.localSize/2,Math.ceil(Math.max(image.width,image.height)/32));
  const nx=Math.ceil((image.width-1)/step)+1,ny=Math.ceil((image.height-1)/step)+1;
  const models:Model[]=[];
  for(let y=0;y<ny;y++)for(let x=0;x<nx;x++) {
    const left=Math.max(0,x*step-step),top=Math.max(0,y*step-step);
    const m=fitModel(image,s,{x:left,y:top,width:Math.min(image.width,x*step+step+1)-left,height:Math.min(image.height,y*step+step+1)-top});
    models.push(m.count>=8?m:fallback);
  }
  return (x:number,y:number,colour:Vec3):Vec3=>{
    const gx=x/step,gy=y/step,ix=Math.floor(gx),iy=Math.floor(gy),fx=gx-ix,fy=gy-iy;
    const out:Vec3=[0,0,0];
    for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){
      const m=models[Math.min(ny-1,iy+dy)*nx+Math.min(nx-1,ix+dx)],w=(dx?fx:1-fx)*(dy?fy:1-fy);
      const diff=colour.map((v,c)=>v-m.mean[c]) as Vec3,t=mulVec(m.matrix,diff);
      for(let c=0;c<3;c++)out[c]+=w*(t[c]-diff[c]);
    }
    return out;
  };
}
