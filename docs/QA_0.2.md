# v0.2 validation, 04/11/2026

Automated: 50/50 Node tests passed. Strict TypeScript check and Vite production build passed. Synthetic numerical tests include exact preview/full-output sample agreement with local PCA and spatial correction active.

Chrome browser: opened the compiled `docs/index.html` through the preview server; loaded the 1600 × 1100 synthetic target; selected a preset and local PCA; drew and finished a four-vertex polygon; confirmed both object-scope checkboxes; rendered a high-pass image; sampled original colour; retained a colour sample; enabled a binary mask; rendered a full-resolution 1600 × 1100 view. Inspected screenshots: square bevelled controls, grey panels and navy title bars preserved; the processing panel scrolls. Development-mode sliders for illumination, detail and direction were also exercised. Browser console inspection showed unrelated extension errors, no application error in the inspected logs.

PNG/JSON export controls exercised; final outcome recorded in the handoff. Browser-generated files were not independently decoded in this v0.2 run. Engine dimensions and recipe replay are tested automatically. Source-image file chooser validation remains covered by the v0.1 browser record and signature unit tests; new archaeological photographs were not uploaded during this run.

Not tested in v0.2: Firefox, Safari, native Windows launcher, mobile/touch use, maximum-resolution memory limits or live GitHub Pages deployment. Synthetic success does not validate archaeological interpretations. The benchmark in BENCHMARK.json and older TEST_RESULTS/VALIDATION documents belong to v0.1 and do not measure the new spatial/local algorithms.
