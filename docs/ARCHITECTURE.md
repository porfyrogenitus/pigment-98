# Architecture and engineering decisions

The application uses strict TypeScript and Vite, with no frontend framework or runtime processing dependency. A modest imperative UI is appropriate for one dense workstation; processing functions remain framework-independent and testable. CSS recreates the Win98 vocabulary without redistributing Microsoft fonts, icons, or bitmaps.

The main thread owns the source canvas, a display canvas, controls, undo history, and source identity. A dedicated module worker owns an immutable copy of decoded RGBA. The initial image buffer is transferred to the worker. Subsequent requests contain only settings; result pixel buffers transfer back. Each processing run starts with original pixels. A debounced latest-state preview scheduler prevents an unlimited queue of obsolete slider jobs; revision checks reject stale outputs. Export uses a frozen settings snapshot and blocks incompatible mutations during the job. A new image resets processing history. Main-thread PNG encoding and image decoding remain browser-managed operations and can temporarily use additional memory.

Full-resolution fitting samples a fixed original-image grid. Preview rendering directly samples original source coordinates and uses the same affine transformation as export. Intermediate Float64 images are not allocated: pixels are converted and processed on demand. This trades CPU time for manageable memory. Full-resolution inspection is an explicit operation. Pixel matching is tested between preview samples and their corresponding full-resolution outputs.

Pure modules expose Raster, Settings, Model, fitModel(), process(), rgbToLab(), labToRgb(), and sampleRegion(). The UI never implements scientific processing with CSS filters. Settings are immutable snapshots. Masks and overlays are output variants, not destructive changes to the original. JSON import accepts only v0.1.0 schema, validates bounds/types, and recomputes the model. Models are serialised as analytical diagnostics, not executable instructions.

CPU double precision and a small symmetric eigensolver were chosen over GPU kernels to make numerical validation and deterministic behaviour straightforward. WebGL/WebGPU, OpenCV.js, and large matrix libraries would add dependencies and cross-device variability without a clear advantage for the required 3×3 eigensystem. Future tiled or accelerated image kernels can retain the same fitModel contract and numerical reference tests.

OpenLIME was considered for its RTI, multispectral, and advanced viewer scope. The official repository reports GPL-3.0 (checked 04/11/2026 at https://api.github.com/repos/cnr-isti-vclab/openlime). None of its code was incorporated. A small Canvas viewer is sufficient for one image and registered comparisons, and avoids adopting an RTI framework before actual RTI support is implemented. Before a future integration, review the exact version's licence and architecture; this document does not infer obligations for hypothetical code that is not included.

## Extension boundaries

Add a colour-space adapter with explicit units, forward/inverse conversion, and test vectors before exposing another space. Add segmentation distance functions with stated assumptions before presenting them in controls. Add new workstation state and processing modules only when they perform real work. Measurements/annotations must be serialised independently of image processing. Genuine spectral stacks require band and calibration metadata; RGB is not a substitute.

## Current constraints

No automatic image persistence, cancellation, tile streaming, worker restart recovery, or browser-memory telemetry. Worker exceptions surface as user-visible messages. Allocation limits are conservative guards rather than guaranteed memory reservations. Only one analysis is active at a time. Full-resolution export CPU cost is linear in pixel count. Accessibility includes labelled inputs, keyboard shortcuts, focus styles, status announcements, and native menus/dialogues; image sampling itself is pointer-based in v0.1.
