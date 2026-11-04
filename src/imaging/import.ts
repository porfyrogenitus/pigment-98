import type { Raster } from '../types/index.ts';
export const MAX_PIXELS=32_000_000;
export function validateSignature(bytes:Uint8Array):'png'|'jpeg'|'webp' {
  if(bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71&&bytes[4]===13&&bytes[5]===10&&bytes[6]===26&&bytes[7]===10)return 'png';
  if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'jpeg';
  if(String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP')return 'webp';
  throw new Error('Unsupported file. Choose a JPEG, PNG, or WebP image.');
}
export async function decode(file:File) {
  if(file.size>100*1024*1024)throw new Error('File exceeds 100 MiB. Make a smaller working copy.');
  const bytes=await file.arrayBuffer();validateSignature(new Uint8Array(bytes));
  let bitmap:ImageBitmap;
  try {bitmap=await createImageBitmap(file,{imageOrientation:'from-image',colorSpaceConversion:'default'});}catch {throw new Error('The image cannot be decoded. It may be damaged or unsupported by this browser.');}
  if(bitmap.width*bitmap.height>MAX_PIXELS||Math.max(bitmap.width,bitmap.height)>16384){bitmap.close();throw new Error('Image exceeds the v0.1 limit of 32 megapixels or 16,384 pixels per side. Make a smaller working copy; export is never silently reduced.');}
  const canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;
  const ctx=canvas.getContext('2d',{willReadFrequently:true,colorSpace:'srgb'});if(!ctx){bitmap.close();throw new Error('Could not allocate an sRGB image canvas.');}
  ctx.drawImage(bitmap,0,0);bitmap.close();
  const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;
  let hash:string|null=null;
  if(globalThis.crypto?.subtle)hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
  return {canvas,image:{width:canvas.width,height:canvas.height,data} as Raster,hash};
}
export function rasterCanvas(image:Raster):HTMLCanvasElement {
  const c=document.createElement('canvas');c.width=image.width;c.height=image.height;
  const ctx=c.getContext('2d');if(!ctx)throw new Error('Could not allocate output canvas.');
  ctx.putImageData(new ImageData(new Uint8ClampedArray(image.data),image.width,image.height),0,0);return c;
}
