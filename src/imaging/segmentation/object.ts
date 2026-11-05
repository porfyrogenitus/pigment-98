/** Even–odd polygon membership at source pixel centres. An empty polygon means no restriction. */
export function inObject(x:number,y:number,polygon:[number,number][]):boolean {
  if(polygon.length<3)return true;
  x+=.5;y+=.5;let inside=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++) {
    const [xi,yi]=polygon[i],[xj,yj]=polygon[j];
    if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)inside=!inside;
  }
  return inside;
}
