import {test} from 'node:test';
import assert from 'node:assert/strict';
import {defaults} from '../src/types/index.ts';
import type {Raster,Settings} from '../src/types/index.ts';
import {process} from '../src/imaging/pipeline.ts';
import {fitModel} from '../src/imaging/decorrelation/model.ts';
import {inObject} from '../src/imaging/segmentation/object.ts';
import {metadata,parseRecipe} from '../src/imaging/export/metadata.ts';
import {rgbToLab} from '../src/imaging/colour/lab.ts';
import {preset} from '../src/state/presets.ts';
function target(w=96,h=72):Raster {const data=new Uint8ClampedArray(w*h*4);for(let y=0;y<h;y++)for(let x=0;x<w;x++)data.set([60+x,70+y,90+(x*y)%60,255],(y*w+x)*4);return {width:w,height:h,data};}
test('Polygon centre membership handles concave outlines and exterior',()=>{
 const p:Settings['objectPolygon']=[[0,0],[10,0],[10,3],[3,3],[3,10],[0,10]];
 assert.ok(inObject(1,8,p));assert.ok(!inObject(8,8,p));assert.ok(!inObject(12,1,p));
});
test('Object-only statistics exclude colourful background exactly',()=>{
 const image=target(20,20),s={...defaults(),space:'rgb' as const,objectPolygon:[[0,0],[10,0],[10,20],[0,20]] as Settings['objectPolygon'],useObject:true};
 const before=fitModel(image,s);for(let y=0;y<20;y++)for(let x=10;x<20;x++)image.data.set([255,0,255,255],(y*20+x)*4);
 assert.deepEqual(fitModel(image,s),before);assert.equal(before.count,200);
});
test('Object application leaves exterior bytes unchanged, including with spatial controls',()=>{
 const image=target(),s={...defaults(),objectPolygon:[[0,0],[40,0],[40,40],[0,40]] as Settings['objectPolygon'],useObject:true,applyObject:true,strength:.7,illumination:.4,detail:1};
 const out=process(image,s).image;
 for(let y=0;y<image.height;y++)for(let x=0;x<image.width;x++)if(!inObject(x,y,s.objectPolygon)){const i=(y*image.width+x)*4;assert.deepEqual(out.data.slice(i,i+4),image.data.slice(i,i+4));}
 assert.notDeepEqual(out.data,image.data);
});
test('Local PCA is deterministic, stable on constant input and identity at zero strength',()=>{
 const image=target(),s={...defaults(),localStretch:true,localSize:64,strength:.7};
 assert.deepEqual(process(image,s).image,process(image,s).image);
 assert.deepEqual(process(image,{...s,strength:0}).image,image);
 const flat=target();for(let i=0;i<flat.data.length;i+=4)flat.data.set([110,80,70,255],i);
 assert.deepEqual(process(flat,s).image,flat);
 assert.notDeepEqual(process(image,s).image,process(image,{...s,localStretch:false}).image);
});
test('Spatial and local preview pixels exactly match corresponding full-resolution samples',()=>{
 const image=target(),s={...defaults(),localStretch:true,localSize:64,strength:.4,illumination:.5,detail:.7,radius:7};
 const full=process(image,s).image,small=process(image,s,'enhanced',48).image;
 for(let y=0;y<small.height;y++)for(let x=0;x<small.width;x++){const i=(y*small.width+x)*4,j=(Math.floor(y*image.height/small.height)*image.width+Math.floor(x*image.width/small.width))*4;assert.deepEqual(small.data.slice(i,i+4),full.data.slice(j,j+4));}
});
test('High-pass of a constant image is neutral; gradient edges are zero',()=>{
 const image=target(8,8);for(let i=0;i<image.data.length;i+=4)image.data.set([100,100,100,255],i);
 assert.equal(process(image,{...defaults(),surface:'highpass'}).image.data[0],128);
 assert.equal(process(image,{...defaults(),surface:'edges'}).image.data[0],0);
});
test('Multiple reference union and object-limited inversion',()=>{
 const image:Raster={width:3,height:1,data:new Uint8ClampedArray([255,0,0,255,0,255,0,255,0,0,255,255])};
 const s={...defaults(),reference:rgbToLab([255,0,0]),references:[rgbToLab([0,255,0])],threshold:.01};
 assert.equal(process(image,s,'mask').selectedPixels,2);
 assert.equal(process(image,{...s,invert:true},'mask').selectedPixels,1);
 const restricted={...s,invert:true,applyObject:true,objectPolygon:[[0,0],[2,0],[2,1],[0,1]] as Settings['objectPolygon']};
 assert.equal(process(image,restricted,'mask').selectedPixels,0);
});
test('Illumination flattening removes an interior linear brightness ramp',()=>{
 const image=target(96,20);for(let y=0;y<20;y++)for(let x=0;x<96;x++)image.data.set([50+x,50+x,50+x,255],(y*96+x)*4);
 const output=process(image,{...defaults(),illumination:1,radius:5}).image;
 assert.ok(Math.abs(output.data[(10*96+20)*4]-output.data[(10*96+70)*4])<=1);
});
test('New spatial operations preserve original alpha and transparent pixel bytes',()=>{
 const image=target(12,12);image.data[3]=0;image.data[7]=120;
 const output=process(image,{...defaults(),illumination:.5,detail:2,surface:'highpass'}).image;
 assert.deepEqual(output.data.slice(0,4),image.data.slice(0,4));assert.equal(output.data[7],120);
});
test('v0.2 recipe replay and malformed polygon rejection; v0.1 migration',()=>{
 const image=target(),s={...defaults(),localStretch:true,strength:.6,detail:.7};
 const recipe=metadata({filename:'synthetic.png',width:96,height:72,sha256:null},s,null);
 assert.deepEqual(process(image,parseRecipe(JSON.stringify(recipe)).settings).image,process(image,s).image);
 assert.throws(()=>parseRecipe(JSON.stringify({...recipe,settings:{...s,objectPolygon:[[Infinity,0]]}})));
 const old={...recipe,software:{name:'PIGMENT 98',version:'0.1.0'},settings:{...s}};
 for(const k of ['localStretch','localSize','illumination','detail','radius','surface','direction','references','objectPolygon','useObject','applyObject'])delete (old.settings as any)[k];
 assert.equal(parseRecipe(JSON.stringify(old)).settings.localStretch,false);
});
test('Presets preserve object selection and retained references',()=>{
 const s={...defaults(),objectPolygon:[[0,0],[10,0],[0,10]] as Settings['objectPolygon'],useObject:true,references:[rgbToLab([255,0,0])]};
 assert.deepEqual(preset('Faint Colour Enhancement',s).objectPolygon,s.objectPolygon);
 assert.deepEqual(preset('Faint Colour Enhancement',s).references,s.references);
});
