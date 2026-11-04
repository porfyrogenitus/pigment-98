import type { Mat3, Vec3 } from '../../types/index.ts';
export const identity = (): Mat3 => [[1,0,0],[0,1,0],[0,0,1]];
export const zeros = (): Mat3 => [[0,0,0],[0,0,0],[0,0,0]];
export const mulVec = (m: Mat3,v: Vec3): Vec3 => m.map(row=>row[0]*v[0]+row[1]*v[1]+row[2]*v[2]) as Vec3;
/** Online Welford covariance, unbiased sample denominator n-1. */
export class Covariance {
  count=0; mean: Vec3=[0,0,0]; m2=zeros();
  add(v: Vec3) {
    this.count++; const d=v.map((x,i)=>x-this.mean[i]);
    for(let i=0;i<3;i++) this.mean[i]+=d[i]/this.count;
    for(let i=0;i<3;i++) for(let j=0;j<3;j++) this.m2[i][j]+=d[i]*(v[j]-this.mean[j]);
  }
  matrix(): Mat3 { return this.m2.map((row,i)=>row.map((v,j)=>this.count<2?0:(v+this.m2[j][i])/(2*(this.count-1)))) as Mat3; }
}
/** Symmetric Jacobi eigensolver; columns of vectors are orthonormal eigenvectors. */
export function eigenSymmetric(input: Mat3): { values: Vec3; vectors: Mat3 } {
  const a=input.map(row=>[...row]) as Mat3, v=identity();
  for(let iteration=0;iteration<64;iteration++) {
    let p=0,q=1;
    for(const [i,j] of [[0,2],[1,2]]) if(Math.abs(a[i][j])>Math.abs(a[p][q])) {p=i;q=j;}
    if(Math.abs(a[p][q])<=1e-13*Math.max(1,Math.abs(a[0][0])+Math.abs(a[1][1])+Math.abs(a[2][2]))) break;
    const angle=.5*Math.atan2(2*a[p][q],a[q][q]-a[p][p]);
    const c=Math.cos(angle),s=Math.sin(angle),pp=a[p][p],qq=a[q][q],pq=a[p][q];
    a[p][p]=c*c*pp-2*s*c*pq+s*s*qq; a[q][q]=s*s*pp+2*s*c*pq+c*c*qq; a[p][q]=a[q][p]=0;
    for(let k=0;k<3;k++) {
      if(k!==p && k!==q) {const kp=a[k][p],kq=a[k][q]; a[k][p]=a[p][k]=c*kp-s*kq; a[k][q]=a[q][k]=s*kp+c*kq;}
      const vp=v[k][p],vq=v[k][q]; v[k][p]=c*vp-s*vq; v[k][q]=s*vp+c*vq;
    }
  }
  const order=[0,1,2].sort((i,j)=>a[j][j]-a[i][i]);
  return {values:order.map(i=>a[i][i]) as Vec3,vectors:v.map(row=>order.map(i=>row[i])) as Mat3};
}
