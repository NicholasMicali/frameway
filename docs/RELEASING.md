# Release preparation

The first beta is 0.1.0. Source is published at [NicholasMicali/frameway](https://github.com/NicholasMicali/frameway). Publishing a packaged release is a separate step; track validation in [TODO.md](../TODO.md).

1. The repository is public and the source uses Apache-2.0; `private: true` prevents npm publication, not GitHub visibility.
2. Review the prospective commit files (`git ls-files --cached --others --exclude-standard`). Keep recordings, private research captures, profiles, `.env` files, dependencies, and build artifacts out of Git.
3. On Node 24, run `npm ci`, `npm run build`, `npm test`, install Playwright Chromium, and run `npm run test:browser`.
4. Run `npm run package:extension`. Unzip the artifact and load it unpacked in Chrome for a real-tab smoke test. Export a project backup before changing an existing extension installation.
5. Commit reviewed source and docs, configure the chosen remote, and push. These actions are not performed by local packaging scripts.
6. Prepare a draft prerelease tagged `v0.1.0` using `docs/releases/v0.1.0.md`, the extension ZIP, and its SHA-256 checksum. Keep it unpublished until the release PRs are merged and checks pass. Set the draft target to the merged `main` commit before publishing.
7. Publish the draft as a prerelease. The release workflow verifies the tag, builds, tests, and replaces the draft ZIP/checksum with artifacts built from the tagged source. Verify that workflow and download the published ZIP for a final installation check.

For later versions, update `package.json`, the root and root-package versions in `package-lock.json`, and `extension/manifest.json` together. Update release documentation. The UI uses the package version, and the build rejects a package/manifest mismatch.

GitHub-hosted CI execution and real installation of a release artifact must be verified after publication; local tests do not establish those outcomes. Browser tests use synthetic content. The headed extension capture test needs a native action and is intentionally not automated in CI.

## README demo

`scripts/record-demo.mjs` records the real editor in a fresh Playwright profile using only generated sample content. It writes source videos and screenshots to ignored `test-results/readme-demo/`. Run it with the installed Playwright Chromium; its Vite server uses port 4184. The reviewed GIF is committed at `docs/assets/frameway-demo.gif`; source recordings remain ignored. The demo illustrates editing, preview, and HTML export, not native recording-picker interactions.
