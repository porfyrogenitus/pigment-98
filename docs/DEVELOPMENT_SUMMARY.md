> Historical v0.1.0 development record. Subsequent public GitHub upload and browser hosting preparation were authorised by the owner. Earlier repository-access limitations below describe the original development session.

# Development summary — PIGMENT 98 v0.1.0

## Delivered

A runnable browser workstation with independent regularised covariance/PCA decorrelation in RGB and CIELAB(D65); strength and output-axis weighting; brightness, contrast, gamma, saturation, exposure, and levels; original-image pixel/neighbourhood/rectangle sampling; ΔE76 masks, overlays, selected-only views, and heatmaps; image-wide or ROI-derived statistics; independent ROI-only processing; zoom/pan, original toggle, split and synchronised side-by-side comparisons; explicit full-resolution view; full-resolution PNG exports; JSON recipe export/import; undo/redo; menus, shortcuts, and Simple/Advanced controls.

The software is non-destructive, local, dependency-free at runtime, and worker-based. All presets use the documented independent engine. Source code, prebuilt release, launchers, scientific methods, architecture, dependency notices, roadmap, tests, and local commits are included.

## Acceptance status

| Criterion | Status |
|---|---|
| 1. Launch locally in a modern browser | Built bundle served and tested in Chrome; local launch instructions supplied |
| 2. Windows 98-style interface | Implemented; screenshot-inspected |
| 3. Photograph upload | JPEG/PNG/WebP fixture imports through real Open dialogue verified |
| 4. Original unchanged | Separate immutable source; numerical immutability tested |
| 5–6. RGB and CIELAB decorrelation | Implemented; mathematical tests pass |
| 7–8. Strength and image adjustments | Implemented; numerical and selected UI paths verified |
| 9. Colour selection and similarity mask | Implemented; numerical/UI/export checks pass |
| 10–11. Comparison, zoom, pan | Implemented; split, side-by-side, zoom buttons, and pan checked |
| 12. Full-resolution PNG | Enhanced/mask/overlay downloads decoded and dimension-checked |
| 13. Processing metadata | Export/import checked; replayed PNG pixels identical |
| 14. Automated maths tests | 39 passed, zero failed |
| 15. Build | Strict TypeScript and Vite production build passed |
| 16. Organisation/documentation | Included |
| 17. Private GitHub repository | **Incomplete: creation capability unavailable; browser requires separate sign-in.** No remote repository was created or exposed |
| 18. Known limitations | Recorded in README, methods, and validation documents |

## Scope and recommended next work

First connect this source to an empty private GitHub repository, preserving local history. Then run cross-browser tests and a controlled archaeological photo evaluation with preserved acquisition masters and manually reviewed reference regions. Prioritise cancellable/tiled processing, more flexible sampling, ΔE2000 and mask cleanup before adding workstations. See ROADMAP.md for staged development.

This release does not include validated pigment/material identification, DStretch equivalence, calibrated reflectance, RAW/16-bit processing, CLAHE, multiple reference regions, morphology, measurements, tracing, RTI, or spectral analysis. Browsers decode to 8-bit sRGB. Preview sampling and grid statistics can alias fine/repetitive detail. Full-resolution export is slower but does not silently reduce resolution. Windows/macOS launchers and Firefox/Safari remain unverified on those platforms.

## Repository handoff

The connector authenticated as porfyrogenitus. Its lookup of porfyrogenitus/pigment-98 returned 404, and no repository-creation operation was available. The browser route opened GitHub's sign-in page. No credentials were entered, and no public repository, hosted deployment, telemetry, or photograph upload was made. The README provides the private repository connection commands. This is an explicit incomplete external deliverable, not a claimed successful push.
