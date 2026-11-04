# PIGMENT 98 roadmap

v0.1 — implemented foundation
Independent RGB/Lab decorrelation, local image adjustments, ΔE76 colour-similarity masks, original-image sampling, rectangular statistical/application scopes, synchronised comparison, full-resolution PNG, recipe export/import, and numerical tests.

v0.2 — reliability and colour measurement
Cross-browser fixtures and colour-managed camera references; cancellable/tiled large-image jobs; ΔE2000; multiple reference regions; mask morphology with explicit scale; exhaustive or stratified statistics options; documented uncertainty; histogram and clipping visualisations; automated end-to-end browser tests. Consider 16-bit input and output only with a pipeline that preserves the precision.

v0.3 — Measurement and Decoration Labs
Scale calibration, distances, angles, areas, manual tracing and SVG export. Record uncertainty and annotations separately from enhanced imagery. User-configurable decoration terminology and ceramic typologies; no automated cultural attribution.

v0.4 — Surface Lab
Raking-light comparison and genuine RTI/photometric-stereo datasets, directional analysis of incised lines and impressed marks. Evaluate OpenLIME for tiled RTI presentation at this stage; assess exact version/licence before incorporation.

v0.5 — Fabric Lab
Calibrated cross-section workflows, inclusion/void masks, particle sizes and orientations, core/margin colour profiles. Validate against manually measured reference specimens and petrographic observations.

v0.6 — Comparison Lab
Registration, four synchronised views, annotated comparative references, and assemblage-level records. Preserve original images and explicit registration transforms.

Later — Spectral Lab
Requires genuine wavelength-resolved data, with acquisition calibration and band metadata. False-colour composites and spectral PCA must not invent bands from ordinary RGB photographs.

Later — assisted workflows
Validated background segmentation, tracing assistance, and similarity retrieval. No unvalidated chemical pigment identification or automatic cultural attribution. AI services are not a dependency of the core application.

Architecture
The pure TypeScript imaging modules accept Raster and Settings and do not depend on the DOM. Worker orchestration, UI/history, viewer, and export/import adapters are separate. Add new workstation-specific state types and processing entry points when implemented; do not pre-create empty labs or present inactive functions as working tools.
