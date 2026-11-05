import type { Rect } from '../types/index.ts';
export type ViewMode='enhanced'|'original'|'side'|'split';
export type Tool='pan'|'roi'|'pick'|'average'|'sample'|'object';
export class Viewer {
  polygon:[number,number][]=[];
  onVertex:(x:number,y:number)=>void=()=>{};
  original:HTMLCanvasElement|null=null; enhanced:HTMLCanvasElement|null=null;
  mode:ViewMode='split';tool:Tool='pan';zoom=1;panX=0;panY=0;split=.5;roi:Rect|null=null;
  onRegion:(r:Rect,sample:boolean)=>void=()=>{};onPick:(x:number,y:number,average:boolean)=>void=()=>{};onStatus:(x:number|null,y:number|null)=>void=()=>{};
  private down:{x:number;y:number;px:number;py:number;ix:number;iy:number;divider:boolean}|null=null;
  private draft:Rect|null=null;
  constructor(public canvas:HTMLCanvasElement) {
    new ResizeObserver(()=>this.draw()).observe(canvas);
    canvas.addEventListener('wheel',e=>{e.preventDefault();this.scale(e.deltaY<0?1.15:1/1.15,e.offsetX,e.offsetY);},{passive:false});
    canvas.addEventListener('pointerdown',e=>{
      if(!this.original)return;canvas.setPointerCapture(e.pointerId);
      const p=this.point(e.offsetX,e.offsetY);
      const divider=this.mode==='split'&&this.tool==='pan'&&Math.abs(e.offsetX-this.canvas.clientWidth*this.split)<12;
      this.down={x:e.offsetX,y:e.offsetY,px:this.panX,py:this.panY,ix:p.x,iy:p.y,divider};
      if(!p.inside&&this.tool!=='pan'){this.down=null;return;}
      if(this.tool==='object'){this.onVertex(p.x,p.y);this.down=null;return;}
      if(this.tool==='pick'||this.tool==='average'){this.onPick(p.x,p.y,this.tool==='average');this.down=null;}
    });
    canvas.addEventListener('pointermove',e=>{
      const p=this.point(e.offsetX,e.offsetY);this.onStatus(p.inside?p.x:null,p.inside?p.y:null);
      if(!this.down)return;
      if(this.down.divider)this.split=Math.max(.03,Math.min(.97,e.offsetX/canvas.clientWidth));
      else if(this.tool==='pan'){this.panX=this.down.px+e.offsetX-this.down.x;this.panY=this.down.py+e.offsetY-this.down.y;}
      else this.draft=this.rect(this.down.ix,this.down.iy,p.x,p.y);
      this.draw();
    });
    canvas.addEventListener('pointerup',e=>{
      if(this.down&&!this.down.divider&&(this.tool==='roi'||this.tool==='sample')){
        const p=this.point(e.offsetX,e.offsetY),r=this.rect(this.down.ix,this.down.iy,p.x,p.y);this.onRegion(r,this.tool==='sample');
      }
      this.down=null;this.draft=null;this.draw();
    });
    canvas.addEventListener('pointercancel',()=>{this.down=null;this.draft=null;this.draw();});
  }
  private rect(x:number,y:number,x2:number,y2:number):Rect {return {x:Math.min(x,x2),y:Math.min(y,y2),width:Math.abs(x2-x)+1,height:Math.abs(y2-y)+1};}
  setImage(c:HTMLCanvasElement){this.original=c;this.enhanced=c;this.fit();}
  setMode(m:ViewMode){const layoutChanges=(this.mode==='side')!==(m==='side');this.mode=m;if(layoutChanges)this.fit();else this.draw();}
  fit(){if(!this.original)return;this.zoom=Math.min((this.canvas.clientWidth/(this.mode==='side'?2:1)-32)/this.original.width,(this.canvas.clientHeight-32)/this.original.height);this.zoom=Math.min(16,Math.max(.01,this.zoom));this.panX=this.panY=0;this.draw();this.onStatus(null,null);}
  actual(){this.zoom=1;this.panX=this.panY=0;this.draw();this.onStatus(null,null);}
  scale(factor:number,x=this.canvas.clientWidth/2,y=this.canvas.clientHeight/2){
    const pw=this.canvas.clientWidth/(this.mode==='side'?2:1),localX=x%pw-pw/2,localY=y-this.canvas.clientHeight/2;
    const z=Math.min(16,Math.max(.01,this.zoom*factor)),r=z/this.zoom;
    this.panX=localX-(localX-this.panX)*r;this.panY=localY-(localY-this.panY)*r;this.zoom=z;this.draw();this.onStatus(null,null);
  }
  private point(x:number,y:number){
    if(!this.original)return {x:0,y:0,inside:false};
    const pw=this.canvas.clientWidth/(this.mode==='side'?2:1),localX=x%pw;
    const ix=Math.floor((localX-(pw-this.original.width*this.zoom)/2-this.panX)/this.zoom),iy=Math.floor((y-(this.canvas.clientHeight-this.original.height*this.zoom)/2-this.panY)/this.zoom);
    return {x:Math.max(0,Math.min(this.original.width-1,ix)),y:Math.max(0,Math.min(this.original.height-1,iy)),inside:ix>=0&&iy>=0&&ix<this.original.width&&iy<this.original.height};
  }
  draw(){
    const c=this.canvas,w=c.clientWidth,h=c.clientHeight,dpr=devicePixelRatio||1;
    c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);const ctx=c.getContext('2d');if(!ctx)return;ctx.scale(dpr,dpr);ctx.fillStyle='#747777';ctx.fillRect(0,0,w,h);
    if(!this.original)return;
    const original=this.original,output=this.enhanced??original,pw=w/(this.mode==='side'?2:1),x=(pw-original.width*this.zoom)/2+this.panX,y=(h-original.height*this.zoom)/2+this.panY,iw=original.width*this.zoom,ih=original.height*this.zoom;
    const paint=(img:HTMLCanvasElement,offset=0)=>{ctx.imageSmoothingEnabled=this.zoom<3;ctx.drawImage(img,x+offset,y,iw,ih);};
    const pane=(offset:number,img:HTMLCanvasElement)=>{ctx.save();ctx.beginPath();ctx.rect(offset,0,pw,h);ctx.clip();paint(img,offset);this.drawRect(ctx,this.draft??this.roi,x+offset,y);ctx.restore();};
    if(this.mode==='side'){pane(0,original);pane(pw,output);ctx.fillStyle='#c0c0c0';ctx.fillRect(pw-2,0,4,h);}
    else if(this.mode==='split'){
      paint(output);ctx.save();ctx.beginPath();ctx.rect(0,0,w*this.split,h);ctx.clip();paint(original);ctx.restore();this.drawRect(ctx,this.draft??this.roi,x,y);
      ctx.fillStyle='#fff';ctx.fillRect(w*this.split-1,0,2,h);ctx.fillStyle='#000080';ctx.fillRect(w*this.split-11,h/2-17,22,34);ctx.fillStyle='#fff';ctx.font='14px monospace';ctx.fillText('↔',w*this.split-8,h/2+5);
    }else pane(0,this.mode==='original'?original:output);
    ctx.font='11px Tahoma, sans-serif';
    const label=(text:string,x:number)=>{ctx.fillStyle='#000080';ctx.fillRect(x,8,ctx.measureText(text).width+16,21);ctx.fillStyle='#fff';ctx.fillText(text,x+8,22);};
    if(this.mode==='side'){label('ORIGINAL',8);label('PROCESSED',pw+8);}else if(this.mode==='split'){label('ORIGINAL',8);label('PROCESSED',w-98);}else label(this.mode.toUpperCase(),8);
  }
  private drawRect(ctx:CanvasRenderingContext2D,r:Rect|null,x:number,y:number){
    if(this.polygon.length){ctx.beginPath();this.polygon.forEach(([px,py],i)=>{if(i)ctx.lineTo(x+px*this.zoom,y+py*this.zoom);else ctx.moveTo(x+px*this.zoom,y+py*this.zoom);});ctx.closePath();ctx.strokeStyle='#00ffff';ctx.lineWidth=2;ctx.stroke();}
    if(!r)return;ctx.strokeStyle='#ffff00';ctx.lineWidth=1;ctx.setLineDash([5,3]);ctx.strokeRect(x+r.x*this.zoom,y+r.y*this.zoom,r.width*this.zoom,r.height*this.zoom);ctx.setLineDash([]);
  }
}
