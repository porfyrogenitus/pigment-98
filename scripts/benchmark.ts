import {performance} from 'node:perf_hooks';
import {process as run} from '../src/imaging/pipeline.ts';
import {defaults} from '../src/types/index.ts';
const width=6000,height=4000,data=new Uint8ClampedArray(width*height*4);
for(let i=0;i<width*height;i++){const l=80+i%97;data.set([l+((i*7)%13),l-20+((i*3)%9),l-35,255],i*4);}
const s={...defaults(),strength:.8};
const start=performance.now();const preview=run({width,height,data},s,'enhanced',1200);const previewMs=performance.now()-start;
const fullStart=performance.now();const full=run({width,height,data},s);const fullMs=performance.now()-fullStart;
if(full.image.width!==6000||full.image.height!==4000)throw new Error('Full dimensions lost');
console.log(JSON.stringify({pixels:width*height,previewDimensions:[preview.image.width,preview.image.height],previewMs,fullMs,fitSamples:full.model.count,stride:full.model.stride,maxRSSMiB:process.resourceUsage().maxRSS/1024,node:process.version},null,2));
