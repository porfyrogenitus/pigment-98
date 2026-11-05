# PIGMENT 98 0.2.0 — ceramic enhancement release

## Included

- Polygon object outline with independent statistics and processing/segmentation scope, visual cyan boundary, undo/redo and recipe persistence.
- Local PCA in overlapping windows, with bilinear blending of transformed colour changes. RGB and Lab remain available.
- Luminance background flattening and unsharp detail enhancement with an explicit source-pixel radius.
- Luminance, neutral-centred high-pass, edge magnitude and directional-gradient displays.
- Up to 16 retained Lab reference colours plus the current sample; masks use the minimum ΔE76 distance to the reference set.
- v0.1 recipe migration, complete new-setting validation, full-resolution export and Windows 95/98 styling retained.

## Suggested use

For faint colour: draw a polygon around the ceramic and finish it; choose a moderate decorrelation preset; compare global and local PCA; keep illumination/detail at zero initially. For inscriptions or scratches: use Luminance, High-pass detail or Directional gradient and compare with the original. For colour groups: sample → Keep current sample → sample another → adjust tolerance. Object masking is manual and supports one polygon without holes.

## Scientific implementation

Polygon membership uses an even–odd test at source pixel centres. Only opaque pixels enter statistics. ROI and polygon statistics are intersected when both are enabled. Processing restrictions also intersect; segmentation is restricted by the object checkbox, not by the statistical ROI.

Local PCA fits full-resolution original-image grid samples in windows centred on a regular lattice. Nominal spacing is half the chosen window size; it is increased to at least ceil(max(width,height)/32) to bound computation. Each window uses up to approximately 4,096 samples, regularisation and gain limits from the original engine. Fewer than eight eligible samples falls back to the global model. The four surrounding transformed colour changes are bilinearly blended. This independently implemented variant is inspired by local decorrelation methods, not claimed equivalent to any published implementation. Adjacent window bases are never interpolated directly. Local colours cannot serve as common colour labels across space. Global diagnostics describe the fallback model, not every local fit.

Spatial processing derives display-referred luminance Y=0.2126R+0.7152G+0.0722B from original 8-bit sRGB values. This is a contrast proxy, not radiometric luminance. An integral image computes the valid-pixel box mean M within radius r and the global valid mean G. Flattening adds a(G−M); detail adds b(Y−M) to each transformed colour channel. These controls follow decorrelation and precede ordinary adjustments. This additive background correction is not Retinex, CLAHE, or calibrated flat-field correction. Broad genuine marks can be suppressed and halos may appear near edges.

Luminance mode replaces colour with Y plus those adjustments. High-pass displays 128+(1+b)(Y−M). Edges show (1+b)sqrt(dx²+dy²); directional view shows 128+(1+b)(dx cos θ+dy sin θ). Derivatives use centred differences with clamped image borders. These diagnostic modes replace PCA colour output and do not use the illumination slider. Their contrast can include shading, pigment, compression and reflection; they are not surface-normal or height measurements. Derivatives can respond to background at the object boundary.

Preview and export evaluate the same source-coordinate windows and spatial neighbourhoods. Spatial integral buffers cost approximately 12 bytes per source pixel in addition to existing image buffers; large images may be slow or exceed browser memory. Full-resolution rendering and exports remain explicit, and failures are reported. Processing is in a worker but is not cancellable.

## Validation and remaining scope

50 automated tests passed, including the original 39 numerical/state tests plus polygon/background exclusion, exterior preservation, local determinism/identity, preview/export agreement, constant-image spatial behaviour, multiple reference selection, illumination-ramp correction, alpha preservation, recipe migration/replay and preset preservation. TypeScript checks and production Pages build passed. See QA_0.2.md for browser checks and their limits.

Not implemented: CLAHE, Retinex, automatic background removal, brush masks/holes, CIEDE2000, named colour classes, clustering/scatterplots, morphology, PCA-component views, measured roughness, RTI, spectral imaging and photometric stereo. These remain later releases. No claim of archaeological ground-truth validation, chemical identification or DStretch equivalence is made.

Research context: Localised decorrelation stretch (L-DCS), Digital Applications in Archaeology and Cultural Heritage, https://www.sciencedirect.com/science/article/pii/S2212054826000299 ; ImageJ intensity processing, https://imagej.net/imaging/image-intensity-processing ; Historic England multi-light guidance, https://historicengland.org.uk/images-books/publications/multi-light-imaging-heritage-applications/ . These motivate future work; none of their source code is incorporated.
