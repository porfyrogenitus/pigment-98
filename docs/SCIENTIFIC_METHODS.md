# Scientific methods — PIGMENT 98 v0.1.0

PIGMENT 98 is an independent experimental implementation of established colour mathematics. It does not reproduce DStretch's proprietary presets or claim pixel-identical outputs. Enhanced colours and colour-similarity masks are interpretative aids, not evidence of chemical pigment identity or the antiquity of a marking.

## Input and colour assumptions

The browser decodes JPEG, PNG, or WebP, applies its image orientation and colour-management behaviour, and draws into a Canvas explicitly requested as sRGB. The engine receives 8-bit, unassociated RGBA. Coordinates refer to this oriented image, starting at the upper left. Embedded profiles, EXIF, DPI, and provenance metadata are not copied to exports. RAW, 16-bit analytical processing, calibrated reflectance, and spectral imaging are not supported.

CIELAB is calculated with a D65 reference white and CIE 1931 2° observer: Xn=0.95047, Yn=1, Zn=1.08883. This is intentionally Lab(D65), NOT CSS lab(), which uses D50. No chromatic adaptation is performed. sRGB channels c=byte/255 are linearised by c/12.92 for c≤0.04045 and ((c+0.055)/1.055)^2.4 otherwise. The linear RGB-to-XYZ matrix is:

[0.4124564 0.3575761 0.1804375]
[0.2126729 0.7151522 0.0721750]
[0.0193339 0.1191920 0.9503041]

For t=X/Xn, Y/Yn, or Z/Zn, f(t)=cuberoot(t) when t>(6/29)^3, otherwise t/[3(6/29)^2]+4/29. L*=116f(Y/Yn)−16, a*=500[f(X/Xn)−f(Y/Yn)], b*=200[f(Y/Yn)−f(Z/Zn)]. The inverse uses the corresponding piecewise inverse and the inverse matrix, followed by the sRGB encoding transfer function. The implementation returns unbounded RGB from the inverse until the pipeline handles clipping. Matrix coefficients are rounded to seven decimal places; tests permit the resulting sub-byte error.

## Decorrelation stretch

Each opaque pixel is a three-vector x in encoded sRGB [0,255] or CIELAB(D65) units. Statistics use the original image, never a processed preview. A deterministic rectangular grid is sampled with stride ceil(sqrt(region area/250000)), with a minimum of one pixel. Its origin is the upper-left corner of the selected statistical rectangle. Actual counts and stride are recorded. Grid sampling may alias repetitive textures; it is not a random or exhaustive survey for large images. The selected region is used only when 'Derive statistics from region' is enabled.

The mean μ and unbiased sample covariance C=sum((x−μ)(x−μ)ᵀ)/(n−1) are accumulated with Welford's online method in JavaScript double precision. A symmetric Jacobi eigensolver decomposes C=VΛVᵀ; eigenvectors are the columns of V. Up to 64 rotations are allowed, with an off-diagonal convergence tolerance of 1e-13 times max(1,sum(abs(diagonal))). Eigenvalues are ordered descending.

Define the variance floor ε=max(1e-6, largest eigenvalue × regularisation). Gains g_i=min(maximum gain, target SD/sqrt(max(λ_i,ε))). The default relative floor is 0.001; the default gain cap is 8. The whitening/rescaling matrix is T=V diag(g_i) Vᵀ. These stabilisers are implementation choices. They constrain amplification of noise in low-variance directions and intentionally prevent exact whitening when active. Target SD is in the selected space's units (default 35 RGB or 18 Lab). It is not a measured uncertainty.

The output in working space is x'=x+s W[T(x−μ)−(x−μ)], where s is strength in [0,1] and W is a diagonal matrix of axis weights. At s=1 and W=I this is μ+T(x−μ). At s=0 the engine bypasses colour conversion and returns the original to the image-adjustment stage. Weights act on output-axis deviations (L*/a*/b* or R/G/B), NOT eigenvector indices. Setting the L* weight to zero retains input L* before conversion and subsequent adjustments. Weights other than unity intentionally alter ideal decorrelation.

There is no data-dependent min/max remapping, percentile stretch, histogram equalisation, or hidden auto-normalisation. Retaining the original mean and using a fixed target SD prevents preview-size-dependent output. Mean preservation is before clipping and later adjustments; the final displayed mean can differ.

If fewer than two opaque samples are available, or total variance is below 1e-10, T is identity and a warning is recorded. Rank-deficient images (including greyscale) use the floor. Negative eigenvalues at round-off scale are floored. Fully transparent pixels retain their RGBA values within the numerical engine and are excluded from fitting; partially transparent pixels are also excluded from fitting and segmentation but receive enhancement with their original alpha. Browser premultiplication may already have discarded hidden RGB values during decoding.

## Image-adjustment order

Every run starts from original data. After decorrelation and conversion back to encoded RGB:

1. Exposure multiplies linear-light RGB by 2^EV. Before linearisation, RGB is clamped to [0,255] only if exposure is non-zero.
2. Levels map (v−black)×255/(white−black), with white>black.
3. Contrast and brightness: (v−127.5)×contrast+127.5+brightness.
4. Gamma: 255×(clamp(v)/255)^(1/gamma); a value of one bypasses this stage.
5. Saturation: y+(v−y)×saturation, where y=0.2126R+0.7152G+0.0722B in encoded RGB. This is a display-referred saturation control, not physical luminance or a CIELAB chroma adjustment.
6. Each channel is hard-clipped to [0,255], rounded, and written to 8-bit output.

Out-of-gamut colours are therefore predictable but may lose hue or detail. The diagnostics count pixels outside gamut just before final clipping (tolerance 0.001 code values); they do not count intermediate clipping in exposure/gamma. There is no gamut compression. A default parameter set is byte-identical to original input in numerical tests. Zero decorrelation strength alone does not disable deliberately chosen image adjustments.

'Apply processing only within region' gates decorrelation AND image adjustments. Pixels outside it remain original. This is independent of the statistical region setting. Segmentation remains image-wide.

## Sampling and segmentation

A single pixel, a clipped 5×5 neighbourhood, or every opaque pixel in a drawn rectangle is converted from the ORIGINAL image to Lab(D65). The reference is the arithmetic mean of these Lab vectors, not a conversion of averaged gamma-encoded RGB. The display swatch is the reference converted back to sRGB. Rectangles use integer pixel coordinates and inclusive pointer endpoints represented as width/height.

ΔE76=sqrt((L1−L2)^2+(a1−a2)^2+(b1−b2)^2). An opaque pixel is selected if distance≤threshold; inversion reverses this comparison only for eligible opaque pixels. Transparent and partially transparent pixels are never selected. There is no spatial connectivity, morphology, automatic noise removal, or mineral classification in v0.1. The mask renderer writes white for selected pixels and black for unselected pixels; fully transparent source pixels remain transparent. Other mask pixels are opaque. Coverage percentages use opaque pixels only.

Overlay colour is original software UI magenta (255,0,180), blended with enhanced RGB using the chosen opacity. This is a display overlay, not a measured colour. Selected-only output makes unselected pixels transparent. The heatmap maps closeness t=1−clamp(distance/max(threshold,1),0,1) to (255t,80t,255(1−t)); it shows raw colour distance and is intentionally independent of mask inversion. It is not a concentration or confidence map.

## Preview, export, and repeatability

Interactive output has a maximum side of 1,200 pixels. Each preview output pixel samples floor(x×source width/preview width), likewise for y, directly from the original. This nearest-pixel preview avoids changing colours through resampling but can alias fine marks. Fitting always uses the original deterministic grid, so the affine transform is identical for preview and full export. 'Full-resolution view' computes every source pixel for detailed viewing. Further adjustments return to interactive preview.

PNG exports always contain the full oriented source width and height. The worker computes them from the unchanged original. Export Enhanced ignores display overlays; Export Mask and Export Overlay are explicit alternatives. Save Settings JSON alongside PNG: this records software version, source filename/dimensions/SHA-256 when available, full settings, fitted covariance/mean/eigenvalues/matrix, grid stride, processing order, numerical controls, and warnings. The source hash covers input FILE bytes. Load JSON requires matching dimensions and, when both hashes exist, matching source hashes; all numeric settings are range-validated. Recipes from other software versions are rejected. The model is recalculated, not trusted from an imported matrix.

Identical decoded pixels and settings yield deterministic output. Decoding, embedded colour profile treatment, browser implementations, and floating-point libraries can cause small cross-platform differences. Recipes cannot replace the original source file and a properly documented photographic acquisition. Browser download destinations and download success are managed by the browser; keep both PNG and JSON.

## Archaeological interpretation

Faint painted decoration, slips, stains, soil residues, weathering, firing variation, conservation treatments, specular highlights, shadows, compression blocks, and camera noise can all produce enhanced colour patterns. RGB imaging alone cannot separate these explanations or identify a mineral or chemical pigment. Assess potential markings against the original image, object observations, context, and independent analyses. Incised and impressed decoration often needs raking illumination or genuine surface imaging rather than chromatic enhancement. Preset names describe intended starting points, not validated material detectors or typological classifications. Record which image is original, enhanced, masked, or interpreted in any archaeological report.

## Verified methodological sources and implementation decisions

The following primary sources were checked during development. Their established methods inform this independent implementation; the sampling limit, stabilisation floor, gain cap, strength interpolation, axis weighting, and presets are PIGMENT 98 engineering choices, not numerical settings attributed to these sources.

- Jon Harman, 'Using Decorrelation Stretch to Enhance Rock Art Images', presented 2005, updated May 2008: https://www.dstretch.com/AlgorithmDescription.html . Describes the covariance/Karhunen–Loève approach and archaeological application. No proprietary code or preset constants were used.
- Alley (1996), 'Algorithm Theoretical Basis Document for Decorrelation Stretch', NASA/JPL, linked by Harman; accessible copy: https://www.dstretch.com/DecorrelationStretch.pdf . Describes rotation, component rescaling, and inverse rotation.
- W3C, CSS Color Module Level 4, colour conversions: https://www.w3.org/TR/css-color-4/ . Documents the sRGB transfer functions and RGB/XYZ/Lab conversion framework. Its CSS Lab white is D50; our D65 Lab convention is explicitly different.
- International Color Consortium, 'How to interpret the sRGB color space (specified in IEC 61966-2-1) for ICC profiles', hosted by W3C: https://www.w3.org/Graphics/Color/srgb . Reference on sRGB encoding and D65. The implementation uses the standard 12.92 inverse-transfer divisor for all three channels.

See VALIDATION.md for tests actually run and limits of verification. This release is not independently validated for archaeological detection sensitivity or specificity.
