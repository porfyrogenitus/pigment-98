# Dependency and asset inventory

Runtime application: no third-party JavaScript packages. The algorithms, UI, Canvas viewer, and CSS are independently written. The system uses locally available Tahoma/Arial/sans-serif; no fonts are distributed. Toolbar symbols are ordinary Unicode, not copied Microsoft assets. The synthetic image is generated from source code.

Development versions resolved in package-lock.json:

| Package | Version | Declared licence |
|---|---|---|
| Vite | 7.3.7 | MIT |
| TypeScript | 5.9.3 | Apache-2.0 |
| @types/node | 24.19.2 | MIT |
| Rollup | 4.67.4 | MIT |
| esbuild | 0.28.2 | MIT |
| PostCSS | 8.5.32 | MIT |
| nanoid | 3.3.20 | MIT |
| picocolors | 1.1.1 | ISC |
| source-map-js | 1.2.2 | BSD-3-Clause |
| fdir | 6.5.0 | MIT |
| tinyglobby | 0.2.17 | MIT |
| picomatch | 4.0.7 | MIT |
| undici-types | 7.24.6 | MIT |

Versions/licences were read from installed package manifests, and installed licence/notice files are collected in THIRD_PARTY_NOTICES.txt. The lockfile includes platform-specific optional toolchain packages. The release does not redistribute node_modules or Node itself. Retain required notices if redistributing toolchain code; TypeScript includes Apache-2.0 terms and applicable notices. The project is not granted an open-source licence simply because its build tools have permissive licences.

OpenLIME: considered, not incorporated; official repository metadata reports GPL-3.0. OpenCV.js: not incorporated. DStretch: no code or preset coefficients copied. No GPL component is included in the application. No claim of legal certification is made; review any future dependencies before adoption and review terms before changing distribution.
