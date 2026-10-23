# Frameway — 0.1.0 beta

Record a workflow, edit screenshot and video steps, and send or embed an interactive walkthrough. Frameway is a local-first Chrome extension and editor built with original code. It does not require a Frameway account or backend.

![Frameway demo: edit a callout, preview a highlighted step, and export an interactive walkthrough](docs/assets/frameway-demo.gif)

_Recorded in Frameway using the built-in sample project. The GIF shows editing, preview, and export; the downloadable HTML remains interactive._

## Install the packaged extension

No Node.js or build tools are needed for the packaged version.

1. Open [Releases](https://github.com/NicholasMicali/frameway/releases) and download **frameway-extension-v0.1.0.zip** from **Assets** (not the source-code archive).
2. Unzip it into a permanent folder. On Windows, use **Extract All**.
3. Open `chrome://extensions`, enable **Developer mode**, and choose **Load unpacked**.
4. Select the extracted folder containing `manifest.json`, then pin Frameway in Chrome.
5. Open a page, click Frameway, wait for **REC**, and click it again when finished. The editor opens automatically.

Keep the extracted folder in place. Back up editable work with **Export project** before replacing or removing an installation; restore the `.frameway.zip` with **Import**. **Download HTML** creates the file to send to viewers.

## Project direction and contributions

Frameway is a local tool: no accounts, application backend, managed hosting, cloud sync, or telemetry. Users may host their own exported walkthroughs. See [project policy](docs/PROJECT-POLICY.md), [privacy](PRIVACY.md), and [architecture](docs/ARCHITECTURE.md).

Contributions are welcome under [Apache-2.0](LICENSE). Start with [CONTRIBUTING.md](CONTRIBUTING.md), the [code of conduct](CODE_OF_CONDUCT.md), and the issue forms. Report vulnerabilities through [SECURITY.md](SECURITY.md). Your recordings and branding remain your content.

## Start from a fresh clone

Use **Node.js 24** and npm. From this repository:

```sh
npm ci
npm run build
```

The build creates `dist/`. Generated files and dependencies are intentionally not committed.

The same npm commands work on macOS and Windows (including PowerShell). Install Node.js 24 first; the optional `.sh` helper scripts are for Unix shells and are not required. The owner has confirmed Windows use, HTML delivery to recipients, and export → reinstall → import recovery. Specific managed-browser policies and display configurations still need broader testing.

Your projects and recordings are saved in your own browser's IndexedDB, outside the Git repository. Cloning this source does not include the author's projects. The sample walkthrough uses generated demo content. If saving personal exports inside the repository, use `exports/` or `recordings/`; both are ignored, along with video files and the default walkthrough export filenames. Renamed HTML exports or extracted project folders should also stay in those ignored directories.

### Recommended: Chrome extension

The extension records a tab's video and clicks, then creates screenshot/video steps automatically.

1. Open `chrome://extensions` in Chrome (116 or newer).
2. Enable **Developer mode**, click **Load unpacked**, and select this repository's `dist` folder.
3. Pin **Frameway · Walkthrough recorder** in Chrome's Extensions menu.
4. Open the page you want to demonstrate. Click Frameway and wait for the **REC** badge.
5. Perform your workflow; click Frameway again to stop. Its editor opens automatically.

Shortcut: **Command+Shift+Y** on macOS; **Ctrl+Shift+Y** elsewhere. Reopen the editor through the extension's **Options** page. After updating the source, rebuild, click **Reload** on the extension's Chrome card, and reopen the editor. Export important projects before replacing or removing an extension installation.

Alternatively, unzip a built `frameway-extension-v0.1.0.zip` release artifact and load the extracted folder containing `manifest.json`. There is no Chrome Web Store listing. Use the Releases page for packaged builds; developers can create one locally with `npm run package:extension`.

### Website and manual screen recording

```sh
npm run dev
```

Open `http://127.0.0.1:5173/`. Home includes the installation guide, saved projects, business use cases, and a sample walkthrough. The practice app is at `/demo.html`.

**Record my screen** uses the browser picker for a tab, window, or whole screen. It records silent video; mark screenshot moments while recording or insert them later. It cannot automatically detect clicks in other applications. Keep the recorder page open until saving finishes. Recording stops at ten minutes or approximately 90 MB.

The website and extension have separate browser storage. Use **Export project → Import** to move walkthroughs between them.

## Edit a walkthrough

- New recordings begin with an editable title slide, using the opening frame cropped into its lower-right corner. Existing projects have **Add title slide**.
- Image steps support point hotspots, callout cards, and outlined area spotlights. Move and size overlays, edit text, and select navigation targets. Area highlights offer gentle automatic zoom based on their size, an on/off switch, and a custom percentage (100% = original size). The screenshot zooms toward the highlight in preview and exports while the callout stays its normal size. Leaving a zoomed slide smoothly returns to the full screenshot before navigating; step controls briefly lock during this matching zoom-out. Editing stays unzoomed for accurate placement. Existing area slides keep zoom off until enabled; newly selected area styles enable it. Large custom percentages can crop the highlight. Reduced-motion viewers see the final view without animation.
- Themes apply to walkthrough overlays and title slides; the studio stays white/light blue. Open **Project settings** to choose a theme or **Custom color…** for your own accent. Card descriptions stay neutral black. Upload a company logo in title-slide settings (PNG/JPEG/WebP up to 5 MB); it appears only on title slides and travels with project backups and exports.
- Video steps have draggable trim handles, 1×–16× timeline zoom with horizontal scrolling, a scrubber, split actions, and autoplay settings. Insert a screenshot at a moment to split the video around it.
- Use each slide’s three-dot menu to duplicate, reorder, or delete it. Undo/redo keeps up to 80 snapshots during the current editing session; it resets on reload or project opening.
- Preview starts at the selected step; returning to Edit restores the originating step. Restart begins at the title slide. Click the step dots to jump between slides in preview or exported walkthroughs; dots, Back/Next, and Restart are disabled during video playback. In exported players, pausing unlocks navigation.

## Send or embed

Open **Export / Download**:

| Action         | Result                                                                                                                                                               |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Download HTML  | One self-contained interactive file, including media. Download and open in a modern browser; works offline.                                                          |
| Export embed   | ZIP with a standalone player, media, an HTML iframe example, and a React iframe wrapper. Host the extracted folder on an existing website or internal static server. |
| Export project | Editable ZIP backup for importing into Frameway later.                                                                                                               |

No managed hosting service is included. A localhost URL only works on your computer. Email/file-sharing previews may block scripts; recipients should download the HTML and open it in a browser. The React wrapper uses the same standalone player, not the editor. Playback exports cannot be imported as editable projects.

**Trimming changes playback ranges, not the underlying media. Exports retain the complete original recording.**

## Beta limitations

- Automatic screenshots use an approximate 120 ms pre-click offset. Review timing and boundaries.
- Extension click capture covers one HTTP(S) tab's top frame. Cross-origin navigation stops recording. Cross-origin iframes and automatic desktop click detection are not supported.
- No microphone/system audio, multi-tab recording, managed hosting, analytics, or multitrack editing.
- Recordings are local browser data, not a backup. Export important work. Storage quota exhaustion, browser crashes, and interrupted-recording recovery need more hardening.
- Interactive exports accept up to 100 MB of source media. Project imports are limited to 150 MB compressed and 200 MB decoded. Export/import runs in memory.
- Automated browser verification uses Chromium; broader browser/OS compatibility has not been established. Direct screen-recording tests use a synthetic stream, not an automated OS picker.

## Develop and test

Run `npm run format:check` and `npm run lint` before submitting a PR (`npm run format` applies formatting). CI checks builds/model tests on Windows, macOS, and Linux, plus Chromium workflows and an offline core-flow check on Linux.

Trying the beta? Follow the [tester guide and feedback template](docs/BETA-TESTING.md). The [TODO list](TODO.md) tracks release readiness, Windows enterprise validation, reliability work, and candidate features.

```sh
npm run build
npm test
npx playwright install chromium
npm run test:browser
```

The browser runner executes editor, recording, standalone export, and title-slide suites serially. The optional headed `node tests/capture.mjs` requires a real extension toolbar action; it is excluded from CI. Tests use generated content and save ignored outputs under `test-results/`.

On the original development machine, `./scripts/dev.sh` can use the ignored project-local Node runtime. That runtime is not needed on a fresh clone with Node 24.

## Package and release

```sh
npm run package:extension
```

Creates `release/frameway-extension-v0.1.0.zip`, with `manifest.json` at its root. Source maps are excluded. `release/` and `dist/` stay ignored.

GitHub Actions checks builds and tests on pushes/PRs and uploads the extension ZIP as a workflow artifact. Publishing a GitHub release tagged `v0.1.0` runs checks again and attaches the ZIP. The tag must match `package.json`; the build checks the source extension manifest version. The UI reads its version from the package.

Source repository: [NicholasMicali/frameway](https://github.com/NicholasMicali/frameway). See [release preparation](docs/RELEASING.md). Source is licensed under Apache-2.0. A packaged beta release remains pending maintainer testing.

## Research notes

REA is optional research tooling, not a runtime dependency. Historical observations and setup notes are in [docs/SOURCES.md](docs/SOURCES.md), [docs/OBSERVED-BEHAVIOR.md](docs/OBSERVED-BEHAVIOR.md), and [docs/SETUP.md](docs/SETUP.md). These describe the original development environment and earlier milestones; this README describes the current beta. Raw private captures, browser profiles, and upstream tooling are ignored.
