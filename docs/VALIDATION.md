> Historical v0.1.0 development record. Subsequent public GitHub upload and browser hosting preparation were authorised by the owner. Earlier repository-access limitations below describe the original development session.

# Validation record — 04/11/2026

## Automated numerical and state tests

Command: `npm test` using Node v24.22.1. **39 tests passed; 0 failed.** The complete runner output is in TEST_RESULTS.txt. Tests cover:

- sRGB→Lab and Lab→sRGB black/white/primary reference triplets; sampled RGB cube round trips.
- Known eigenvalues and eigenvectors, orthonormality, dense matrix residuals, and reconstruction.
- Hand-calculated unbiased covariance and numerical stability under a large offset.
- Independent T C Tᵀ check against target variance × identity when regularisation/caps are inactive.
- RGB and Lab zero-strength identity, constant-colour identity, greyscale/rank-one behaviour, near-singular/extreme controls, and actual enhancement of correlated data.
- Input immutability, alpha preservation, exclusion of non-opaque samples, and single-sample/all-transparent inputs.
- ΔE76 distances and exact threshold inclusion; inversion and alpha eligibility; mean Lab reference sampling.
- Binary mask, magenta overlay, selected-only transparency, and heatmap outputs.
- Every implemented image adjustment, including a known brightness result.
- Independent statistical/application region semantics.
- Full dimensions preserved; preview pixels exactly match corresponding full-resolution output pixels, with the same fitted model.
- Adjacent-strength stability, recipe round-trip pixel equality and invalid-recipe rejection.
- PNG/JPEG/WebP signature recognition, unsupported data rejection, history snapshots, and preset state preservation.

Reference matrix/formula outputs are not DStretch reference outputs. Tests do not establish field detection sensitivity, chemical identification, or cross-camera colour accuracy.

## Build and source checks

`npm run build`: strict TypeScript check and Vite production build passed. Vite 7.3.7, TypeScript 5.9.3. No runtime third-party dependency or remote CDN is required. `node --check scripts/serve.mjs` passed. The served release contains bundled main-thread and worker modules and local CSS.

## Browser checks actually performed

The actual application was operated through Chrome browser automation, first with the development build, then with the production static bundle. Synthetic fixtures only; no user archaeological photographs were uploaded or committed.

Development UI checks:

- Open synthetic target (1600×1100), with original preserved and preview labelled 1200×825.
- Select Faint Colour Enhancement; visually inspect split original/enhanced results.
- Change RGB/Lab selection, brightness, contrast, gamma, and saturation.
- Pick a source pixel; observe Lab/RGB reference readout and overlay activation.
- Set ΔE76 threshold to 3; inspect black/white mask and selected count.
- Side-by-side comparison; zoom button, image panning, and rectangular ROI drawing.
- Enable statistical ROI and application-only ROI independently.
- Export settings JSON, enhanced PNG, mask PNG, and overlay PNG through real browser downloads.
- Reset; import the exported recipe through the file dialogue; export the replayed enhanced PNG.
- Decode downloaded PNGs independently with Python/Pillow; verify all are 1600×1100 RGBA. Replayed enhanced pixels are **exactly identical** to the earlier export. The mask has only 0/255 RGB values; overlay output differs from enhanced output.
- Render Full-resolution view; observe 1600×1100 in the UI.
- Import separate JPEG, WebP, and PNG fixtures through Open Image; observe 64×48 decoded image dimensions and successful processing.
- Reject unsupported text and a PNG-signature file with corrupted content. Previous image remained open.
- Enable Advanced mode and inspect exposed controls.

Production checks:

The compiled bundle was served through the supported static preview, loaded successfully. A synthetic-image action was initiated, but the browser session ended before the remaining production interactions were verified. The full interaction and export checks above were completed in the development build. See DEVELOPMENT_SUMMARY.md for any final limitations. The release's localhost-only server could not be used as the remote browser preview backend; this was a preview-routing limitation. The production bundle itself was tested through the static backend. The launcher received a JavaScript syntax check; Windows double-click launch and macOS/Linux desktop launch were not exercised on those operating systems.

The preview uses a non-secure HTTP hostname, so Web Crypto SHA-256 was unavailable there. JSON truthfully recorded null and import displayed a source-identity warning. The localhost/secure-context SHA-256 path is implemented using Web Crypto but was not exercised in that preview. Pixel replay was still verified on the same source image.

Application-origin browser console checks found no JavaScript exceptions during the completed interactions. The environment's browser extension emitted unrelated errors; these are not application test results. Screenshot inspection confirmed the dense grey/bevelled interface, split and side-by-side images, and visible mask. A temporary preview host-allowlist issue was corrected before interaction testing.

## Performance observation (engine only)

The repeatable `scripts/benchmark.ts` creates a 6000×4000 synthetic raster, fits Lab statistics, and processes preview/full output. One run in the development container yielded:

| Measurement | Observed |
|---|---:|
| Input | 24,000,000 pixels |
| Preview | 1200×800 |
| Preview + fitting | 1,055.9 ms |
| Full output + fitting | 20,898.1 ms |
| Statistical samples | 240,000 |
| Source grid stride | 10 pixels |
| Process maximum resident memory | 271.3 MiB |

This measures the numerical engine in Node, not browser decode, Canvas memory, worker transfers, PNG encoding, or real-camera image variability. Browser memory will be higher. It is one observation, not a throughput guarantee. The raw result is BENCHMARK.json.

## Remaining verification

Firefox and Safari were not available for interactive testing. Touch/small-screen layouts, keyboard-only image sampling, drag/drop import, mouse-wheel zoom, every advanced control's UI path, and a representative corpus of archaeological photographs were not comprehensively exercised. The relevant maths and shared processing paths are tested, but this is not a substitute for cross-browser/user acceptance testing. CLAHE, mask cleanup, and future labs are not implemented.

No GitHub repository was created, so remote privacy, push, and repository checks could not be completed. Local Git history is included; no repository or photograph was made public.
