# PIGMENT 98 · v0.2.0

New: polygon object selection, blended local PCA, illumination flattening, surface-detail views and multiple colour references. See [release details and limitations](docs/RELEASE_0.2.md) and [GitHub Pages upgrade instructions](docs/UPGRADING.md). The original installation and v0.1 validation information below remains useful; current validation is recorded in the release notes. The GitHub integration rejected write access, so this release is supplied as a ready-built upload package.

**Archaeological Ceramic & Pigment Analysis Workstation**

A working, local browser application for independent RGB/CIELAB decorrelation enhancement and original-image colour-similarity masking. Windows 98-style controls, Canvas viewing, and a Web Worker. Experimental research software; no telemetry, remote processing, accounts, or runtime CDN dependencies.

## Run the supplied release (no dependency installation needed)

The release ZIP contains a prebuilt `dist/`, source, documentation, tests, and local Git history.

1. Extract the whole ZIP to a folder.
2. Have **Node.js 22.18 or later** available (Node 24 was used for validation).
3. On Windows, double-click **START-WINDOWS.cmd**. Otherwise open a terminal in the extracted `pigment-98` folder and run:

```sh
node scripts/serve.mjs
```

4. Open **http://127.0.0.1:4173** in a current Chromium browser or Firefox. Keep the terminal open. Press Ctrl+C to stop.

The launcher binds to 127.0.0.1 only and makes no outbound requests. After obtaining Node and this release, it works without internet access. Opening `index.html` directly with `file://` is not supported because module workers require HTTP. This is local software, not a publicly hosted service or an installed PWA.

If Python is already installed, another option is:

```sh
python -m http.server 4173 --bind 127.0.0.1 --directory dist
```

The Python option does not use the additional response headers in the supplied Node launcher. Never serve the project root with a general-purpose server; serve only `dist/`.

## Develop, test, and rebuild

```sh
npm ci
npm test
npm run build
npm start
```

`npm ci` is the only step that needs the dependency registry. `npm start` serves `dist/` using the dependency-free local launcher. `npm run dev` runs Vite with hot reload, bound to 127.0.0.1. The release launcher is also local-only by default. No hosting or public deployment is configured.

`npm run check` runs strict TypeScript checks. `npm test` runs 39 numerical/state tests using Node's built-in runner. See [validation results](docs/VALIDATION.md) for the exact tests and browser checks performed. `node --experimental-strip-types scripts/benchmark.ts` runs the optional 24-megapixel numerical benchmark; it is not part of routine tests.

## First examination

1. Choose **Open** or drop a JPEG, PNG, or WebP onto the viewer. Alternatively, choose **Image → Open synthetic target**. The target is generated locally, is not an archaeological photograph, and is safe for learning the controls.
2. Increase **Enhancement strength**, or choose a preset. **CIELAB (D65)** and **sRGB** use genuine covariance/eigenvector decorrelation. Strength zero bypasses decorrelation; other image adjustments remain independent. **Reset** restores every processing parameter to the original appearance.
3. Use Split or Side-by-side to compare registered original/processed images. Drag with Pan, use the mouse wheel, or choose Fit/1:1. In Split view, drag the divider with the Pan tool. Switching between original, enhanced, and split retains zoom/pan; switching side-by-side fits the new pane dimensions.
4. Choose **1 pixel**, **5 × 5**, or **Rectangle**, then select the reference on the image. Sampling ALWAYS reads original opaque pixels, even if you click the enhanced pane. Adjust **Tolerance (ΔE76)** and choose Overlay, Mask, Selected-only, or Heatmap.
5. Draw a region if needed. **Derive statistics from region** changes the fitted transformation. **Apply processing only within region** restricts enhancement and image adjustments. These options are independent; the mask remains image-wide.
6. Export **Enhanced PNG**, **Mask PNG**, or **Overlay PNG**, then **Settings JSON**. PNGs preserve full decoded source dimensions. JSON records parameters, fitted statistics, warnings, and source SHA-256 when the browser makes hashing available.
7. To repeat an examination, reopen the exact source photograph and use **Load JSON**. Mismatched dimensions/hashes and unsupported recipes are rejected.

The mask detects colour similarity, **not chemically identified pigment**. Interpret colour variation alongside the original image and the object. Lighting, firing, stains, slips, conservation treatments, and JPEG artefacts can all affect results.

## Controls and shortcuts

| Action | Control |
|---|---|
| Open image | Ctrl+O / Command+O |
| Export enhanced PNG | Ctrl+E / Command+E |
| Undo / redo | Ctrl+Z / Ctrl+Shift+Z (Command on macOS); Ctrl+Y also supported |
| Zoom | + / −, mouse wheel |
| Fit | F |
| Original / enhanced toggle | O |
| Return to Pan / dismiss notification | Escape |
| Scientific description | Help → Scientific methods |
| Future modules | Window → Workstation roadmap |

Advanced mode adds target component SD, eigenvalue regularisation, maximum gain, output-axis weights, exposure, and black/white levels. Their precise mathematical effects are documented in [SCIENTIFIC_METHODS.md](docs/SCIENTIFIC_METHODS.md). All presets are experimental starting points; none claims DStretch equivalence or material identification.

## Performance and quality

Interactive previews have a maximum side of 1,200 pixels, with explicitly labelled preview dimensions. Statistics are derived from a deterministic grid of ORIGINAL full-resolution pixels. Full-resolution view and all PNG exports process every original pixel using the same fitted transformation. Changing a control returns to interactive preview.

The current guard is **32 megapixels**, **16,384 pixels per side**, and **100 MiB input size**. Memory use depends on browser and available RAM. Large-image export may take tens of seconds; the worker keeps computation off the UI thread. It cannot currently cancel a running job. A 24 MP engine-only benchmark is reported in VALIDATION.md; it is not a guarantee of browser throughput.

## Limitations and troubleshooting

- **No image after Open:** check the notification. Unsupported and damaged files are rejected. Convert camera RAW/TIFF or very large images to a separate sRGB JPEG/PNG working copy; retain the acquisition master.
- **Port busy:** close the other server, or set `PIGMENT_PORT` to a different port (PowerShell: `$env:PIGMENT_PORT=4174`; macOS/Linux: `PIGMENT_PORT=4174 node scripts/serve.mjs`). Open the address printed by the launcher.
- **No source hash:** SHA-256 needs a secure context. Use the supplied 127.0.0.1 launcher, not an arbitrary HTTP network hostname. When hashing is unavailable, the recipe explicitly uses null and import warns that source identity is unverified.
- **Download not visible:** inspect your browser's Downloads and permission settings. Export status means the browser was handed a download; the app cannot confirm its final disk destination. Keep the source and JSON alongside the PNG yourself.
- **Unexpected colours:** decorrelation is deliberately false-colour enhancement. Lower strength/gain, choose a representative statistical region, and inspect clipping diagnostics. Regions with insufficient variance use an identity transform with a warning.
- **Misleading fine texture in preview:** inspect Full-resolution view at 1:1. The nearest-source preview can alias fine lines; it does not smooth or fabricate source pixels.
- Input/output processing is 8-bit, browser-decoded sRGB. No RAW, 16-bit scientific pipeline, physical colour calibration, or retained EXIF/ICC metadata. Animated images are treated as a browser-decoded still, not analysed as sequences.
- Only fully opaque pixels enter statistics, reference averaging, or masks. Partially transparent pixels retain alpha in enhanced outputs. Mask PNGs keep fully transparent pixels transparent; other mask pixels are opaque black/white.
- No CLAHE, ΔE2000, morphology/noise removal, multiple references, spectral analysis, measurement, motif tracing, or RTI in v0.1. They are documented future work, not inactive 'working' screens.
- Original files are never overwritten. Photographs and state are not automatically stored; reloading loses the session. Save a recipe before closing.
- Chromium was exercised interactively. Firefox and Safari remain unverified; modern APIs were selected for reasonable compatibility, not certified compatibility.

## Project organisation

- `src/imaging/`: pure numerical colour conversion, covariance/PCA, adjustments, masking, and import/export adapters.
- `src/workers/`: heavy image processing isolated from the UI.
- `src/components/`: viewer and interface layout.
- `src/app/`: event handling, worker scheduling, and synthetic demonstration.
- `src/state/`: undo/redo and presets.
- `src/styles/win98/`: original CSS retro interface.
- `tests/`: synthetic numerical/state regression tests; no user photographs.
- `scripts/`: local release server and optional performance benchmark.
- `docs/`: methods, architecture, validation, dependency notices, and roadmap.

## Public browser hosting

The source and browser application are public with the owner's authorisation. Photographs selected in the application stay in browser memory and are not uploaded to GitHub or another processing service.

GitHub Pages serves the prebuilt application from `docs/`. In the repository's **Settings → Pages**, choose **Deploy from a branch**, then **main** and **/docs**, and save. No Node installation is needed to use the hosted application.

To update the hosted build after source changes, run `npm ci`, `npm test`, and `npm run build:pages`, then commit the updated source and `docs/index.html` / `docs/assets/`. Do not commit photographs or analysis exports. Public access does not grant permission to reuse or redistribute the software; see LICENSE.
