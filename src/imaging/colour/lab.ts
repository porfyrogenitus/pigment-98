import type { Vec3 } from '../../types/index.ts';
export const clamp = (v: number, lo=0, hi=255) => Math.min(hi, Math.max(lo, v));
export const linearise = (v: number) => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;
export const encode = (v: number) => v <= .0031308 ? 12.92 * v : 1.055 * v ** (1/2.4) - .055;
const delta = 6/29;
const f = (v: number) => v > delta**3 ? Math.cbrt(v) : v/(3*delta*delta)+4/29;
const invf = (v: number) => v > delta ? v**3 : 3*delta*delta*(v-4/29);
/** D65/2° CIELAB, XYZ white (0.95047, 1, 1.08883); no D50 adaptation. */
export function rgbToLab([r,g,b]: Vec3): Vec3 {
  r=linearise(r/255); g=linearise(g/255); b=linearise(b/255);
  const x=f((.4124564*r+.3575761*g+.1804375*b)/.95047);
  const y=f(.2126729*r+.7151522*g+.072175*b);
  const z=f((.0193339*r+.119192*g+.9503041*b)/1.08883);
  return [116*y-16,500*(x-y),200*(y-z)];
}
/** Deliberately returns unclipped encoded sRGB so clipping can be counted centrally. */
export function labToRgb([l,a,b]: Vec3): Vec3 {
  const y=(l+16)/116, x=invf(y+a/500)*.95047, yy=invf(y), z=invf(y-b/200)*1.08883;
  return [encode(3.2404542*x-1.5371385*yy-.4985314*z)*255,
    encode(-.969266*x+1.8760108*yy+.041556*z)*255,
    encode(.0556434*x-.2040259*yy+1.0572252*z)*255];
}
export const deltaE76 = (a: Vec3,b: Vec3) => Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
