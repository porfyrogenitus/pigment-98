import {defaults} from '../types/index.ts';
import type {Settings} from '../types/index.ts';
export const presets:Record<string,Partial<Settings>>={
 'Neutral Decorrelation':{space:'rgb',strength:.65,targetSD:35},
 'Red Decoration':{space:'lab',strength:.65,targetSD:18,weights:[.25,1.5,.8]},
 'Dark Decoration':{space:'lab',strength:.45,targetSD:20,weights:[1.4,.4,.4],contrast:1.2},
 'Faint Colour Enhancement':{space:'lab',strength:.8,targetSD:20,weights:[.3,1.2,1.2]},
 'Surface Colour Separation':{space:'lab',strength:.65,targetSD:24,weights:[.5,1,1]},
 'High-Contrast Examination':{algorithm:'none',contrast:1.7,gamma:1.1}
};
export function preset(name:string,current:Settings):Settings {const fresh=defaults();return {...fresh,...presets[name],roi:current.roi,useROI:current.useROI,applyROI:current.applyROI,reference:current.reference,referenceRegion:current.referenceRegion,threshold:current.threshold,maskView:current.maskView,opacity:current.opacity,invert:current.invert};}
