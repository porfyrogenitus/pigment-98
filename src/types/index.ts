export type Vec3 = [number, number, number];
export type Mat3 = [Vec3, Vec3, Vec3];
export interface Raster { width: number; height: number; data: Uint8ClampedArray }
export interface Rect { x: number; y: number; width: number; height: number }
export interface Settings {
  algorithm: 'decorrelation' | 'none'; space: 'rgb' | 'lab'; strength: number;
  targetSD: number; regularisation: number; maxGain: number; weights: Vec3;
  brightness: number; contrast: number; gamma: number; saturation: number; exposure: number;
  black: number; white: number; roi: Rect | null; useROI: boolean; applyROI: boolean;
  reference: Vec3 | null; referenceRegion: Rect | null;
  threshold: number; opacity: number; invert: boolean; maskView: 'off' | 'overlay' | 'mask' | 'only' | 'heatmap';
}
export interface Model { mean: Vec3; covariance: Mat3; matrix: Mat3; eigenvalues: Vec3; count: number; stride: number; warnings: string[]; }
export const VERSION = '0.1.0';
export const defaults = (): Settings => ({
  algorithm: 'decorrelation', space: 'lab', strength: 0, targetSD: 18, regularisation: .001, maxGain: 8, weights: [1,1,1],
  brightness: 0, contrast: 1, gamma: 1, saturation: 1, exposure: 0, black: 0, white: 255,
  roi: null, useROI: false, applyROI: false, reference: null, referenceRegion: null, threshold: 12, opacity: .45, invert: false, maskView: 'off'
});
