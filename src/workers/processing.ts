import type { Raster, Settings } from '../types/index.ts';
import { process } from '../imaging/pipeline.ts';
import { sampleRegion } from '../imaging/segmentation/mask.ts';
let original:Raster|null=null;
self.onmessage = (event:MessageEvent) => {
  const {id,type,...payload}=event.data;
  try {
    if(type==='load') {original=payload.image; self.postMessage({id,type,ok:true});return;}
    if(!original) throw new Error('Open an image first.');
    if(type==='sample') {self.postMessage({id,type,...sampleRegion(original,payload.region)});return;}
    const s=payload.settings as Settings;
    const result=process(original,s,payload.kind,type==='preview'?1200:undefined);
    (self as unknown as Worker).postMessage({id,type,...result},[result.image.data.buffer]);
  } catch(error) {self.postMessage({id,type,error:error instanceof Error?error.message:String(error)});}
};
