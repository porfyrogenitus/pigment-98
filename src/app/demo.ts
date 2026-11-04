/** Original synthetic calibration scene, no archaeological photograph or inferred motif. */
export async function demoFile():Promise<File> {
 const c=document.createElement('canvas');c.width=1600;c.height=1100;const ctx=c.getContext('2d')!;
 const image=ctx.createImageData(c.width,c.height);
 for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){
   const i=(y*c.width+x)*4,t=.65+.35*x/c.width,noise=((x*17+y*31)%23-11)*.45;
   const band=(x>400&&x<460&&y>150&&y<900)||(y>420&&y<480&&x>230&&x<1320)||(Math.abs(Math.hypot(x-1000,y-650)-200)<18);
   const red=band?9:0;
   image.data.set([166*t+noise+red,135*t+noise-red*.35,105*t+noise-red*.2,255],i);
 }
 ctx.putImageData(image,0,0);ctx.fillStyle='#fff';ctx.font='24px monospace';ctx.fillText('SYNTHETIC COLOUR TARGET • NOT AN ARTEFACT',40,60);
 return new File([await new Promise<Blob>(r=>c.toBlob(b=>r(b!),'image/png'))],'synthetic-colour-target.png',{type:'image/png'});
}
