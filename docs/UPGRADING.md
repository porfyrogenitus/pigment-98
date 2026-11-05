# Upgrade to PIGMENT 98 0.2.0

The release was developed against GitHub main commit d3ee9d1c9b8bd824581df1f2930c356a2c12fccc. The repository contains source plus a prebuilt website in `docs/`. No photographs are included. The connector could read this repository but returned HTTP 403 when asked to create the release branch; no remote changes were made by this build.

## Browser-only upgrade (no Node required)

1. Save Settings JSON and image exports from any open analysis before refreshing the site.
2. Download and extract `PIGMENT_98_v0.2.0_Pages.zip`.
3. In the GitHub repository, create a branch named `upgrade-v0.2.0` from `main` using the branch selector.
4. On that branch choose **Add file → Upload files**. Drag the extracted contents (not the ZIP and not its containing folder) into the upload area. Include `src`, `tests`, `scripts`, `docs`, package files and README. Commit the upload.
5. Open a pull request from `upgrade-v0.2.0` to `main`. Check that `docs/index.html` and its referenced new assets appear together. Merge it when ready to upgrade the live site.
6. Under **Settings → Pages**, retain **Deploy from a branch → main → /docs** if that is your current setting. The source layout was inspected; the administrative Pages setting could not be read through the connector.
7. Wait for the Pages deployment in Actions to succeed. Open your existing website and refresh. The title bar must say **v0.2.0**. If needed use Ctrl+F5. Load the synthetic target, draw an outline, and try a Surface view.

GitHub's browser upload may omit hidden files. This package does not require `.nojekyll` to resolve its ordinary `assets/` filenames, but include that file and `.gitignore` when using GitHub Desktop/Git. Old hashed JavaScript files may remain after a browser upload; they are harmless because the new index references new filenames. Do not remove existing custom-domain/CNAME or other user-added configuration.

GitHub documentation: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Recommended ongoing workflow

Keep `main` as the deployed release. Develop and test on a branch, run `npm ci`, `npm test`, and `npm run build:pages`, then commit source and generated `docs/` assets together. Review via a pull request and merge. Node is needed only on the developer's machine; people using Pages do not need it. GitHub Desktop on the personal computer is convenient for reviewing all changed and removed files before pushing.

For now keep branch-based Pages publishing: it matches the existing project and needs no new workflow permissions. A later GitHub Actions pipeline can run the tests/build and deploy `dist/` automatically, but switch Pages to Actions only when that workflow is installed and verified.

To roll back, revert the upgrade pull request on GitHub; that restores the previous index and asset references and triggers another deployment. Retain exported original images and recipes locally. v0.1 recipes are accepted with all new controls disabled; v0.2 recipes are not supported by the old application.
