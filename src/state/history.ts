export class History<T> {
  private past:T[]=[];private future:T[]=[];
  current:T;
  constructor(current:T){this.current=structuredClone(current);}
  set(value:T) {if(JSON.stringify(value)===JSON.stringify(this.current)) return; this.past.push(structuredClone(this.current));if(this.past.length>80)this.past.shift();this.current=structuredClone(value);this.future=[];}
  undo() {const v=this.past.pop();if(v){this.future.push(this.current);this.current=v;}return this.current;}
  redo() {const v=this.future.pop();if(v){this.past.push(this.current);this.current=v;}return this.current;}
  get canUndo(){return this.past.length>0;} get canRedo(){return this.future.length>0;}
}
