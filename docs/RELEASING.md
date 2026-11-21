# Release preparation

The current release version is [v0.4.0 beta](https://github.com/NicholasMicali/frameway/releases/tag/v0.4.0). Source is published at [NicholasMicali/frameway](https://github.com/NicholasMicali/frameway). Each new packaged release requires a separate maintainer decision; track validation in [TODO.md](../TODO.md).

1. The repository is public and the source uses Apache-2.0; `private: true` prevents npm publication, not GitHub visibility.
2. Review the prospective commit files (`git ls-files --cached --others --exclude-standard`). Keep recordings, private research captures, profiles, `.env` files, dependencies, and build artifacts out of Git.
3. On Node 24, run `npm ci`, `npm run format:check`, `npm run lint`, `npm run build`, `npm test`, install Playwright Chromium, and run `npm run test:browser`.
4. Run `npm run package:extension`. Unzip the artifact and load it unpacked in Chrome for a real-tab smoke test. Export a project backup before changing an existing extension installation.
5. Commit reviewed source and docs, push the feature branch, and open a PR. These actions are not performed by local packaging scripts.
6. Prepare a draft prerelease tagged `vX.Y.Z` matching the new package version, using `docs/releases/vX.Y.Z.md` (see `docs/releases/v0.2.0.md` for an example), the extension ZIP, and its SHA-256 checksum. Keep it unpublished until the release PRs are merged and checks pass. Set the draft target to the merged `main` commit before publishing.
7. Publish the draft as a prerelease. The release workflow verifies the tag, builds, tests, and replaces the draft ZIP/checksum with artifacts built from the tagged source. Verify that workflow and download the published ZIP for a final installation check.

For later versions, update `package.json`, the root and root-package versions in `package-lock.json`, and `extension/manifest.json` together. Update release documentation. The UI uses the package version, and the build rejects a package/manifest mismatch.

GitHub-hosted CI execution and real installation of a release artifact must be verified after publication; local tests do not establish those outcomes. Browser tests use synthetic content. The headed extension capture test needs a native action and is intentionally not automated in CI.

## README demo

`scripts/record-demo.mjs` records the real editor in a fresh Playwright profile using only generated sample content. It writes source videos and screenshots to ignored `test-results/readme-demo/`. Run it with the installed Playwright Chromium; its Vite server uses port 4184. The reviewed GIF is committed at `docs/assets/frameway-demo.gif`; source recordings remain ignored. The demo illustrates editing, preview, and HTML export, not native recording-picker interactions.

## Chrome Web Store updates

Frameway is published in the [Chrome Web Store](https://chromewebstore.google.com/detail/dpfkfbpolahiofedbdebdjmpjfphkjge). This is the primary installation path; keep the Store package aligned with each approved GitHub release after review.

1. Increment the package, lockfile, and extension manifest versions together.
2. Complete the checks and GitHub release process above.
3. Open the existing Frameway item in the Developer Dashboard → Package → Upload New Package. Upload the complete release ZIP, not the source archive. Do not create a new Store item.
4. Update listing and privacy declarations if behavior or permissions changed; submit for review and publish after approval.
5. Verify the Store version and installation/update behavior, including existing project storage. The old version stays available during review. GitHub publication does not upload to the Store automatically.

See [Store materials](STORE-READINESS.md) for listing copy, permission explanations, and migration instructions.

The build includes Frameway LICENSE/NOTICE and generated THIRD_PARTY_NOTICES.txt. Review new dependencies and missing-license errors before packaging; do not omit notices to get a release out.
