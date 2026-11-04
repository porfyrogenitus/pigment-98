import type { Vec3, Settings } from '../../types/index.ts';
import { clamp,linearise,encode } from '../colour/lab.ts';
export function adjust(rgb: Vec3,s: Settings): Vec3 {
  let out=rgb.map(v=>{
    // Exposure is linear light; subsequent controls are display-referred.
    if(s.exposure!==0) v=encode(linearise(clamp(v)/255)*2**s.exposure)*255;
    v=(v-s.black)*255/(s.white-s.black);
    v=(v-127.5)*s.contrast+127.5+s.brightness;
    return s.gamma===1?v:255*(clamp(v)/255)**(1/s.gamma);
  }) as Vec3;
  const y=.2126*out[0]+.7152*out[1]+.0722*out[2];
  out=out.map(v=>y+(v-y)*s.saturation) as Vec3;
  return out;
}
