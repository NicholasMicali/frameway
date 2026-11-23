# Frameway

Record a workflow, edit screenshot and video steps, and send or embed an interactive walkthrough. Frameway is a local-first Chrome extension and editor built with original code. It does not require a Frameway account or backend.

![Frameway demo: edit a callout, preview a highlighted step, and export an interactive walkthrough](docs/assets/frameway-demo.gif)

_Recorded in Frameway using generated demo content. The GIF shows editing, preview, and export; the downloadable HTML remains interactive._

## Install Frameway

**[Add Frameway to Chrome](https://chromewebstore.google.com/detail/dpfkfbpolahiofedbdebdjmpjfphkjge)** — the recommended way to install and stay up to date. No Node.js, build tools, or Developer mode required.

1. Open the Store listing and choose **Add to Chrome**.
2. Pin Frameway from Chrome's Extensions menu.
3. Open a page, click Frameway → **Record this tab**, and wait for **REC**.
4. Perform your workflow, then choose **Finish**. The editor opens automatically.

Choose **Open library** from the extension menu to return to existing projects without recording. Use **Record my screen** in the Library to capture desktop apps or a whole screen and add screenshot steps manually.

The Store version receives updates through Chrome. We keep it aligned with the latest release after Store review. The published release is **v0.4.0 beta**. Source on this branch prepares **v0.5.0**; see [GitHub Releases](https://github.com/NicholasMicali/frameway/releases) for release notes and alternative packaged downloads.

### Sharing, backups, and moving to the Store version

**Share → Download HTML** creates an interactive file for viewers who do not need Frameway installed. **Download project** creates an editable `.frameway.zip` to back up your work or send to a teammate; restore it with **Options → Import projects**.

Projects stay in your browser profile. Before switching from an unpacked extension or localhost to the Store version, export important project backups from the old installation and import them into the new one. Verify them before removing the old installation. Ordinary updates to the same Store installation retain its library; keep backups for recovery.

### Alternative: install a release ZIP

For manual testing, download the extension ZIP from [Releases](https://github.com/NicholasMicali/frameway/releases/latest), extract it to a permanent folder, and use **Load unpacked** in `chrome://extensions` with **Developer mode** enabled. Select the folder containing `manifest.json`. This installation does not receive Store updates; back up projects before replacing its files or removing it.

## Project direction and contributions

Frameway is a local tool: no accounts, application backend, managed hosting, cloud sync, or telemetry. Users may host their own exported walkthroughs. See [project policy](docs/PROJECT-POLICY.md), [privacy](PRIVACY.md), and [architecture](docs/ARCHITECTURE.md).

Contributions are welcome under [Apache-2.0](LICENSE). Start with [CONTRIBUTING.md](CONTRIBUTING.md), the [code of conduct](CODE_OF_CONDUCT.md), and the issue forms. Report vulnerabilities through [SECURITY.md](SECURITY.md). Your recordings and branding remain your content.

## Build from source (contributors)

Use **Node.js 24** and npm. From this repository:

```sh
npm ci
npm run build
```

The build creates `dist/`. Generated files and dependencies are intentionally not committed.

The same npm commands work on macOS and Windows (including PowerShell). Install Node.js 24 first; the optional `.sh` helper scripts are for Unix shells and are not required. The owner has confirmed Windows use, HTML delivery to recipients, and export → reinstall → import recovery. Specific managed-browser policies and display configurations still need broader testing.

Your projects and recordings are saved in your own browser's IndexedDB, outside the Git repository. Cloning this source does not include the author's projects. Automated tests use generated demo content. If saving personal exports inside the repository, use `exports/` or `recordings/`; both are ignored, along with video files and the default walkthrough export filenames. Renamed HTML exports or extracted project folders should also stay in those ignored directories.

### Load your development build

The extension records a tab's video and clicks, then creates screenshot/video steps automatically.

1. Open `chrome://extensions` in Chrome (116 or newer).
2. Enable **Developer mode**, click **Load unpacked**, and select this repository's `dist` folder.
3. Pin **Frameway · Walkthrough recorder** in Chrome's Extensions menu.
4. Open the page you want to demonstrate. Click Frameway → **Record this tab** and wait for the **REC** badge.
5. Perform your workflow; click Frameway → **Finish**. Its editor opens automatically.

Open the toolbar menu with **Command+Shift+Y** on macOS or **Ctrl+Shift+Y** elsewhere. Choose **Open library** to access saved projects without recording. The extension's **Options** page also opens the editor. After updating the source, rebuild, click **Reload** on the extension's Chrome card, and reopen the editor. Export important projects before replacing or removing an extension installation.

Developers can create an installable ZIP locally with `npm run package:extension`. For everyday use, install from the Chrome Web Store above.

### Website and manual screen recording

```sh
npm run dev
```

Open `http://127.0.0.1:5173/`. The Library includes tab and screen recording guidance, searchable saved projects with backup/delete options, and visible sharing and backup help. The practice app is at `/demo.html`.

**Record my screen** uses the browser picker for a tab, window, or whole screen. It records silent video; mark screenshot moments while recording or insert them later. It cannot automatically detect clicks in other applications. Keep the recorder page open until saving finishes. Recording stops at ten minutes or approximately 90 MB.

The website and extension have separate browser storage. Use **Download project → Options → Import projects** to move walkthroughs between them.

In the library, open a project’s three-dot menu and choose **Make a copy** to create a separately saved version. The copy opens with a “(copy)” name you can edit. Changes or deletion of either project do not affect the other; export a new backup for the copy. Copies include the media and may use additional browser storage.

## Edit a walkthrough

- New recordings begin with an editable title slide, using the opening frame cropped into its lower-right corner. Existing projects have **Add title slide**.
- Image steps support point hotspots, callout cards, and outlined area spotlights. Move and size overlays, edit text, and select navigation targets. Area highlights offer gentle automatic zoom based on their size, an on/off switch, and a custom percentage (100% = original size). The screenshot zooms toward the highlight in preview and exports while the callout stays its normal size. Leaving a zoomed slide smoothly returns to the full screenshot before navigating; step controls briefly lock during this matching zoom-out. Editing stays unzoomed for accurate placement. Existing area slides keep zoom off until enabled; newly selected area styles enable it. Large custom percentages can crop the highlight. Reduced-motion viewers see the final view without animation.
- Themes apply to walkthrough overlays and title slides; the studio stays white/light blue. Open **Project settings** to choose a theme or **Custom color…** for your own accent. Card descriptions stay neutral black. Upload a company logo in Project settings (PNG/JPEG/WebP up to 5 MB), choose bundled fonts, and add an optional presentation frame. Branding travels with project files and exports.
- Add arrows, cards, tips, information, and warnings to explain details alongside the primary next-step action. Hotspots and optional elements have subtle motion, with reduced-motion support.
- Add background music in Project settings: choose from eleven bundled tracks or upload MP3/WAV/OGG audio. Viewers can mute it; music and required credits travel with supported exports. See [music options and limits](docs/BACKGROUND-MUSIC.md).
- Video steps have draggable trim handles, 1×–16× timeline zoom with horizontal scrolling, a scrubber, split actions, and autoplay settings. Insert a screenshot at a moment to split the video around it.
- Use each slide’s three-dot menu to duplicate, reorder, or delete it. Undo/redo keeps up to 80 snapshots during the current editing session; it resets on reload or project opening.
- Preview starts at the selected step; returning to Edit restores the originating step. Restart begins at the title slide. Click the step dots to jump between slides in preview or exported walkthroughs; dots, Back/Next, and Restart are disabled during video playback. In exported players, pausing unlocks navigation.

## Send or embed

Open **Share**:

| Action           | Result                                                                                                                                                               |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Download HTML    | One self-contained interactive file, including media. Download and open in a modern browser; works offline.                                                          |
| Export embed     | ZIP with a standalone player, media, an HTML iframe example, and a React iframe wrapper. Host the extracted folder on an existing website or internal static server. |
| Download project | Editable project file for a teammate to import and change, or to keep as your own backup.                                                                            |

The **Video** section exports a linear recording of the walkthrough as MP4 when supported, otherwise WebM. Choose still-slide timing and output size; keep the export tab visible until it finishes. See [video export](docs/VIDEO-EXPORT-PROTOTYPE.md).

Share also shows the generated filename and size and offers recipient instructions. Editable project handoffs are independent copies, not live synchronization.

No managed hosting service is included. A localhost URL only works on your computer. Email/file-sharing previews may block scripts; recipients should download the HTML and open it in a browser. The React wrapper uses the same standalone player, not the editor. Playback exports cannot be imported as editable projects.

**Trimming changes playback ranges, not source media. HTML, embed packages, and editable projects retain the complete original recording.** Video exports contain the rendered playback sequence; review every output before sharing.

## Local storage and backups

Open **Options → Storage & backups** to see approximate browser usage and project media sizes, export editable backups, or delete an unneeded project after confirmation. The open project cannot be deleted until you return to Library. Extension and localhost storage are separate.

Projects show whether a backup export is recorded for the current edits. This records a download being started, not proof that the file was kept. **Download project** creates the editable ZIP; HTML/embed downloads do not count as editable backups. Imported projects start with no local backup-export record.

If saving fails, keep the tab open: current edits remain available for **Export backup** and **Retry saving**. The previous saved copy is retained when a storage transaction fails. Export an editable backup before removing other projects to free space. Storage figures are estimates, not a guarantee of free disk space. This does not recover recordings lost in a browser crash.

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

Creates `release/frameway-extension-v0.5.0.zip`, with `manifest.json` at its root. Source maps are excluded. `release/` and `dist/` stay ignored.

GitHub Actions checks builds and tests on pushes/PRs and uploads the extension ZIP as a workflow artifact. Publishing a GitHub release tagged `vX.Y.Z` runs checks again and attaches the ZIP. The tag must match `package.json`; the build checks the source extension manifest version. The UI reads its version from the package.

Source repository: [NicholasMicali/frameway](https://github.com/NicholasMicali/frameway). See [release preparation](docs/RELEASING.md). Source is licensed under Apache-2.0. Install from the [Chrome Web Store](https://chromewebstore.google.com/detail/dpfkfbpolahiofedbdebdjmpjfphkjge) or find packaged builds in [Releases](https://github.com/NicholasMicali/frameway/releases). See [open issues](https://github.com/NicholasMicali/frameway/issues) for planned improvements.

## Research notes

REA is optional research tooling, not a runtime dependency. Historical observations and setup notes are in [docs/SOURCES.md](docs/SOURCES.md), [docs/OBSERVED-BEHAVIOR.md](docs/OBSERVED-BEHAVIOR.md), and [docs/SETUP.md](docs/SETUP.md). These describe the original development environment and earlier milestones; this README describes the current beta. Raw private captures, browser profiles, and upstream tooling are ignored.

## Library organization and keyboard help

Use a project's ⋯ menu to rename it without opening the editor. Downloaded files use the project name. **Last edited** sorting uses local content edits (including rename, undo, and redo); opening, previewing, and exporting do not update it. Projects without a known edit date show **Created** and sort using that date. Copies and imported backups start with a new creation date and no local edit history. This local bookkeeping is omitted from portable backups.

Choose **Options → Keyboard shortcuts** for the current editor and timeline controls on Mac, Windows, and Linux. Frameway focuses on individual walkthroughs; combine exported walkthroughs into larger training modules using your existing tools.

## Chapters and appearance

Use a step's **Behavior → Start a chapter** setting to add a named section to the preview and exported Contents menu. See [chapter behavior](docs/CHAPTERS.md). **Project settings** previews shared card/title colors, title layouts, logo sizing, typography, and button shapes before applying them. See [appearance settings](docs/APPEARANCE.md) for compatibility and the separate reusable-kit follow-up.

## Completion screens

Add an optional [closing slide](docs/CLOSING-SLIDE.md) with your project branding, a completion message, and Replay walkthrough. Existing walkthroughs keep their current ending until you add one.
