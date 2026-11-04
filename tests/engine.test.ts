import test from 'node:test';
import assert from 'node:assert/strict';
import {rgbToLab,labToRgb,deltaE76} from '../src/imaging/colour/lab.ts';
import {Covariance,eigenSymmetric,mulVec} from '../src/imaging/decorrelation/matrix.ts';
import {fitModel} from '../src/imaging/decorrelation/model.ts';
import {process} from '../src/imaging/pipeline.ts';
import {sampleRegion,similarity} from '../src/imaging/segmentation/mask.ts';
import {defaults} from '../src/types/index.ts';
import type {Raster,Vec3,Mat3,Settings} from '../src/types/index.ts';
import {metadata,parseRecipe} from '../src/imaging/export/metadata.ts';
import {validateSignature} from '../src/imaging/import.ts';
import {History} from '../src/state/history.ts';
import {preset} from '../src/state/presets.ts';
const near=(a:number,b:number,tol=1e-7)=>assert.ok(Math.abs(a-b)<=tol,`${a} ≠ ${b} (tolerance ${tol})`);
const vectorNear=(a:number[],b:number[],tol=1e-7)=>a.forEach((v,i)=>near(v,b[i],tol));
function raster(pixels:number[][],width=pixels.length):Raster{return {width,height:pixels.length/width,data:new Uint8ClampedArray(pixels.flatMap(p=>p.length===3?[...p,255]:p))};}
function synthetic():Raster {const p:number[][]=[];for(let i=0;i<1024;i++){const l=80+(i%53),a=(i*7%19)-9,b=(i*11%13)-6;p.push([l+a,l*.8+b+20,l*.6-a+b+40]);}return raster(p,32);}
const src=synthetic();
// Reference triplets evaluated independently from standard D65 matrix/formula, rounded at 4 decimals.
for(const [rgb,lab] of [ [[0,0,0],[0,0,0]], [[255,255,255],[100,0,0]], [[255,0,0],[53.2408,80.0925,67.2032]], [[0,255,0],[87.7347,-86.1827,83.1793]], [[0,0,255],[32.2970,79.1875,-107.8602]] ] as [Vec3,Vec3][]){
 test(`sRGB → Lab reference ${rgb}`,()=>vectorNear(rgbToLab(rgb),lab,.0002));
 test(`Lab → sRGB reference ${rgb}`,()=>vectorNear(labToRgb(lab),rgb,.003));
}
test('Colour conversion round trips sampled sRGB cube',()=>{for(let r=0;r<=255;r+=51)for(let g=0;g<=255;g+=51)for(let b=0;b<=255;b+=51)vectorNear(labToRgb(rgbToLab([r,g,b])),[r,g,b],.001);});
test('Known symmetric matrix eigenpairs, orthonormality, and reconstruction',()=>{
 const m:Mat3=[[2,1,0],[1,2,0],[0,0,5]],{values,vectors:v}=eigenSymmetric(m);vectorNear(values,[5,3,1]);
 for(let k=0;k<3;k++){const col=v.map(row=>row[k]) as Vec3;vectorNear(mulVec(m,col),col.map(x=>x*values[k]));for(let j=0;j<3;j++)near(col.reduce((a,x,i)=>a+x*v[i][j],0),j===k?1:0);}
 for(let i=0;i<3;i++)for(let j=0;j<3;j++)near(v[i].reduce((sum,x,k)=>sum+x*values[k]*v[j][k],0),m[i][j]);
});
test('Dense symmetric matrix eigenpairs satisfy independent residual check',()=>{
 const m:Mat3=[[4,1,2],[1,3,-1],[2,-1,6]],{values,vectors:v}=eigenSymmetric(m);
 for(let k=0;k<3;k++){const col=v.map(row=>row[k]) as Vec3;vectorNear(mulVec(m,col),col.map(x=>x*values[k]),1e-10);}
});
test('Unbiased covariance matches hand-computed outer product',()=>{const c=new Covariance();[[1,2,3],[2,4,6],[3,6,9]].forEach(p=>c.add(p as Vec3));vectorNear(c.mean,[2,4,6]);assert.deepEqual(c.matrix(),[[1,2,3],[2,4,6],[3,6,9]]);});
test('Welford covariance remains stable with large offset',()=>{const c=new Covariance();[1,2,3].forEach(v=>c.add([1e9+v,1e9+2*v,1e9+3*v]));assert.deepEqual(c.matrix(),[[1,2,3],[2,4,6],[3,6,9]]);});
test('Fitted RGB transformation whitens covariance to target variance when uncapped',()=>{
 const s={...defaults(),space:'rgb' as const,strength:1,targetSD:10,maxGain:32,regularisation:.000001},m=fitModel(src,s);
 for(let i=0;i<3;i++)for(let j=0;j<3;j++){let sum=0;for(let k=0;k<3;k++)for(let l=0;l<3;l++)sum+=m.matrix[i][k]*m.covariance[k][l]*m.matrix[j][l];near(sum,i===j?100:0,1e-6);}
});
for(const space of ['rgb','lab'] as const){
 test(`${space}: zero strength is byte-identical and never mutates input`,()=>{const before=src.data.slice();const out=process(src,{...defaults(),space});assert.deepEqual(out.image.data,before);assert.deepEqual(src.data,before);});
 test(`${space}: constant-colour input remains constant at maximum strength`,()=>{const input=raster(Array.from({length:16},()=>[120,80,55]));const out=process(input,{...defaults(),space,strength:1});assert.deepEqual(out.image.data,input.data);assert.match(out.model.warnings.join(),/variance/);});
 test(`${space}: rank-one greyscale stays finite and achromatic`,()=>{const input=raster(Array.from({length:256},(_,i)=>[i,i,i]));const out=process(input,{...defaults(),space,strength:1});assert.ok(out.model.matrix.flat().every(Number.isFinite));for(let i=0;i<out.image.data.length;i+=4){near(out.image.data[i],out.image.data[i+1],1);near(out.image.data[i],out.image.data[i+2],1);}});
 test(`${space}: extreme near-singular settings remain bounded and deterministic`,()=>{const input=raster(Array.from({length:100},(_,i)=>[100+i%2,100,100]));const s={...defaults(),space,strength:1,targetSD:80,maxGain:32,regularisation:.000001};const a=process(input,s),b=process(input,s);assert.deepEqual(a,b);assert.ok(a.model.matrix.flat().every(Number.isFinite));assert.ok(a.image.data.every(v=>v>=0&&v<=255));});
 test(`${space}: real enhancement changes correlated input`,()=>{const out=process(src,{...defaults(),space,strength:.8});assert.notDeepEqual(out.image.data,src.data);});
}
test('Alpha is preserved and non-opaque samples do not influence covariance',()=>{const image=raster([[10,20,30,255],[20,30,40,255],[255,0,0,0],[0,255,0,128]]);const s={...defaults(),space:'rgb' as const,strength:1};const m=fitModel(image,s);assert.equal(m.count,2);vectorNear(m.mean,[15,25,35]);const out=process(image,s).image;assert.equal(out.data[11],0);assert.equal(out.data[15],128);assert.deepEqual([...out.data.slice(8,12)],[255,0,0,0]);});
test('All transparent or single opaque pixel input has identity model',()=>{for(const image of [raster([[1,2,3,0]]),raster([[1,2,3,255]])]){const out=process(image,{...defaults(),strength:1});assert.deepEqual(out.image.data,image.data);assert.equal(out.model.count,image.data[3]?1:0);}});
test('ΔE76 is Euclidean and includes exact threshold boundary',()=>{near(deltaE76([10,20,30],[13,24,30]),5);const lab=rgbToLab([110,90,50]);const s={...defaults(),reference:lab,threshold:0};assert.equal(similarity([110,90,50],255,s).selected,true);assert.equal(similarity([111,90,50],255,s).selected,false);assert.equal(similarity([110,90,50],128,s).selected,false);assert.equal(similarity([111,90,50],255,{...s,invert:true}).selected,true);});
test('Reference rectangle is mean of individual Lab values, with transparency excluded',()=>{const input=raster([[255,0,0],[0,255,0],[0,0,255,0]],3),ref=sampleRegion(input,{x:0,y:0,width:3,height:1});const a=rgbToLab([255,0,0]),b=rgbToLab([0,255,0]);vectorNear(ref.lab,a.map((v,i)=>(v+b[i])/2));assert.equal(ref.count,2);assert.throws(()=>sampleRegion(raster([[1,2,3,0]]),{x:0,y:0,width:1,height:1}),/opaque/);});
test('Mask, inversion, overlay, selected-only and heatmap perform distinct operations',()=>{const input=raster([[100,100,100],[200,100,100]]),s={...defaults(),reference:rgbToLab([100,100,100]),threshold:0,opacity:1};assert.deepEqual([...process(input,s,'mask').image.data],[255,255,255,255,0,0,0,255]);assert.deepEqual([...process(input,{...s,invert:true},'mask').image.data],[0,0,0,255,255,255,255,255]);assert.deepEqual([...process(input,s,'overlay').image.data.slice(0,4)],[255,0,180,255]);assert.equal(process(input,s,'only').image.data[7],0);assert.deepEqual([...process(input,s,'heatmap').image.data.slice(0,3)],[255,80,0]);});
test('Each image adjustment has a numerical effect; brightness has known output',()=>{const input=raster([[100,120,140]]);assert.deepEqual([...process(input,{...defaults(),brightness:10}).image.data],[110,130,150,255]);for(const [k,v] of Object.entries({contrast:2,gamma:2,saturation:0,exposure:1,black:30,white:200})){assert.notDeepEqual(process(input,{...defaults(),[k]:v}).image.data,input.data,k);}});
test('Region used for fitting does not silently constrain application',()=>{const input=raster([[10,20,30],[20,30,40],[150,160,170],[200,210,220]],2),roi={x:0,y:0,width:2,height:1},s={...defaults(),space:'rgb' as const,roi,useROI:true,strength:1};vectorNear(fitModel(input,s).mean,[15,25,35]);assert.notDeepEqual(process(input,s).image.data.slice(8),input.data.slice(8));assert.deepEqual(process(input,{...s,applyROI:true}).image.data.slice(8),input.data.slice(8));});
test('Full output preserves dimensions and previews share the full-resolution fitted model',()=>{const s={...defaults(),strength:.8},full=process(src,s),preview=process(src,s,'enhanced',13);assert.equal(full.image.width,32);assert.equal(full.image.height,32);assert.equal(full.image.data.length,4096);assert.deepEqual(preview.model,full.model);for(let y=0;y<preview.image.height;y++)for(let x=0;x<preview.image.width;x++){const si=(Math.floor(y*32/preview.image.height)*32+Math.floor(x*32/preview.image.width))*4,di=(y*preview.image.width+x)*4;assert.deepEqual(preview.image.data.slice(di,di+4),full.image.data.slice(si,si+4));}});
test('Strength changes continuously before quantisation, with no large adjacent jumps',()=>{const a=process(src,{...defaults(),strength:.5}),b=process(src,{...defaults(),strength:.501});let max=0;a.image.data.forEach((v,i)=>max=Math.max(max,Math.abs(v-b.image.data[i])));assert.ok(max<=2,`largest adjacent difference ${max}`);});
test('JSON recipe round-trip reproduces exact result; invalid inputs rejected',()=>{const s={...defaults(),strength:.7,roi:{x:2,y:3,width:10,height:12},useROI:true},source={filename:'fixture.png',width:32,height:32,sha256:null};const raw=metadata(source,s,fitModel(src,s)),recipe=parseRecipe(JSON.stringify(raw));assert.deepEqual(process(src,recipe.settings).image.data,process(src,s).image.data);for(const settings of [{...s,gamma:0},{...s,strength:NaN},{...s,weights:[1,Infinity,1]},{...s,white:0},{...s,roi:{x:-1,y:0,width:1,height:1}},{...s,algorithm:'fake'}])assert.throws(()=>parseRecipe(JSON.stringify({...raw,settings})));});
test('Image signature validation rejects unsupported data',()=>{assert.equal(validateSignature(Uint8Array.from([137,80,78,71,13,10,26,10])),'png');assert.equal(validateSignature(Uint8Array.from([255,216,255])),'jpeg');assert.equal(validateSignature(new TextEncoder().encode('RIFFxxxxWEBP')),'webp');assert.throws(()=>validateSignature(new TextEncoder().encode('<svg>')));});
test('Undo/redo preserves snapshots and clears redo after a divergent change',()=>{const h=new History(defaults());const s={...defaults(),strength:.5};h.set(s);s.strength=.9;assert.equal(h.current.strength,.5);assert.equal(h.undo().strength,0);assert.equal(h.redo().strength,.5);h.undo();h.set({...defaults(),gamma:2});assert.equal(h.canRedo,false);});
test('Presets retain explicit regions and references while resetting adjustment parameters',()=>{const s:Settings={...defaults(),brightness:70,roi:{x:0,y:0,width:1,height:1},reference:[50,20,10]};const p=preset('Red Decoration',s);assert.deepEqual(p.roi,s.roi);assert.deepEqual(p.reference,s.reference);assert.equal(p.brightness,0);assert.equal(p.weights[1],1.5);});
