# Prototype validation — 2026-10-21

## Passed

- TypeScript checks and production extension build (Vite + esbuild).
- Four model tests: normalized coordinates, reorder/target integrity, deletion repair, and invalid import ranges/IDs/targets.
- Browser editor integration: generates real sample WebM, edits cards, persists across reload, plays still/video/still transitions, restarts, extracts a replacement frame, exports/imports binary assets, reorders/deletes, and renders at compact width without JavaScript exceptions.
- Live headed Chrome extension capture: a native Command+Shift+Y action starts recording; seven trusted clicks plus a final end screen produce eight steps from about eight seconds of video. The flow includes a modal, new project, filter, SPA route, scroll, and full same-origin navigation.
- Finalized live recording is decoded into still frames and opened in the editor; preview starts its video transition.
- First-live-still image content check rejects blank/nearly blank frames. A startup readiness guard was added after the initial screenshot inspection found a blank first still. The subsequent live test passes this check.
- Visual inspection of editor and live-capture screenshots. Local artifacts: `test-results/editor.png`, `player.png`, `editor-compact.png`, and `live-capture.png` (ignored by Git).

## Not yet established

- Exact click-to-frame timing, behavior under sustained CPU load, or arbitrary-site compatibility. The 120 ms offset is a heuristic, with manual correction in the editor.
- Automated loss/recovery of an offscreen document, browser restart mid-recording, quota exhaustion, and rapid-click stress.
- End-to-end cross-origin stop behavior, iframes, multiple tabs, desktop capture, audio, and publishing.
- Pixel/interaction parity with Arcade. Its signed-in editor has now been observed, and differences are documented in OBSERVED-BEHAVIOR.md; v0.2 implements the first subset of those findings.

## REA

Project-local Node 24.22.0 and REA 6.7.0 are installed. CLI startup/help and browser-only target discovery against the local practice page are verified. Discovery returned observed REA evidence `ev_614b1d2a647c566a8aa459c3ae02fd692dc3ad192762ae1b17bc85bbf9518b0a`; raw results are in ignored `evidence/rea-browser-targets.json`. Setup was previewed only and never applied. The native readiness portion of the preview fails on this host's Swift SDK/compiler mismatch (the first sandbox run also hit a compiler-cache permission denial; the unrestricted rerun still reports a toolchain problem). No decompiler or native tooling was installed. Raw setup diagnostics are retained in ignored `evidence/rea-setup-plan.json`.

## Next iteration

Use this prototype to capture a small real workflow. Compare it with a controlled Arcade recording, concentrating on still selection, clip boundaries, and callout positioning. The signed-in project has already been inspected. Use those observations to refine behavior. Keep desktop capture as a second adapter into the existing project/editor model.

## v0.2 follow-up

The earlier live-capture results above apply to v0.1. Capture transport was not changed or rerun for v0.2; the shared project-generation path is exercised with a real generated WebM in the browser suite.

- Seven model/archive tests cover coordinates, reordering, deletion, invalid imports, v1 migration, v2 type/settings validation, and v1 ZIP → v2 export/import with binary media preservation.
- Browser integration covers six generated image/video steps, opening autoplay, optional closed hotspots, callout style, save/reload, video-to-image advancement, Back/Restart, manual video start with autoplay disabled, frame extraction, archive roundtrip, reorder/delete, and compact layout. A seeded v1 IndexedDB project exercises migration and explicit branching in the actual player.
- Network findings and their limits are recorded in OBSERVED-BEHAVIOR.md. Exact Arcade payload schema and source sharing remain unverified.

## Standalone interactive export

`tests/export.mjs` passes with a real generated recording. It verifies a self-contained HTML file in a fresh offline browser context, an unzipped player opened from disk with relative assets, video pause/resume and clip boundaries, default-closed hotspots, video/image navigation, Back/Restart, explicit branches, mobile width, and the exported React wrapper compiled into a separate host page. A script-shaped title is rendered as text without executing. Export requires no editor storage or external service. Screenshots are saved as `test-results/export-mobile.png` and `test-results/export-embed.png`.

The HTML iframe example and React wrapper load the standalone player; they do not contain the editor. Playback exports retain the full original recording. Trims are playback ranges, not media redaction. Whole-desktop capture, a managed hosting URL, cross-browser codec verification, and an installable React package remain outside this slice.

## Home and direct screen recording

`tests/recording.mjs` passes: initial Home/library, picker cancellation and retry, MediaRecorder capture from a synthetic canvas stream, manual markers, stop/finalize into an editable project, save before Home, Home persistence across reload, reopening, video splitting with screenshot insertion, and a no-marker recording represented as video plus final screenshot. `getDisplayMedia` is stubbed in this test: actual OS source selection/permissions and capturing a real desktop were not exercised. The user completes the browser picker. The existing extension capture path remains separate.

## Editor controls follow-up

Nine model/archive tests pass, including split continuity, destination preservation, duplicate IDs/media sharing, and overlay-dimension validation. `tests/editor.mjs` passes grouped drag undo, redo, split, duplicate, deletion restoration, selected-step preview and return, card width/placement, area sizing, and area playback in the standalone HTML export. The production build passes. The inspected editor screenshot is `test-results/editor-enhanced.png`.

## Title slides and inspector polish

`tests/title.mjs` passes default title creation, title editing and save/reload, start/restart navigation, offline standalone playback, mobile layout, project archive roundtrip, title insertion into an existing project, and undo. Visual checks: `test-results/title-export.png` and `title-mobile.png`. Ten model/archive tests pass, including idempotent title insertion and validation. The supplied user screenshot was the visual reference; no Arcade project modifications were needed.

## First beta release preparation

Version 0.1.0 is consistent across the package, extension manifest, and UI. A clean temporary copy containing only prospective Git files passed `npm ci`, production build, extension packaging, and all ten model tests. npm reported zero known vulnerabilities at install time. The complete five-suite browser runner passed locally. Desktop/mobile Home layouts and the extension-guide link were checked. The release ZIP was validated for required files and excludes source maps.

A pattern-based review of 55 prospective publication files found no credential assignments, private keys, private Arcade flow/share URLs, personal `/Users/` paths, or files over 1 MB. This is a bounded scan, not proof that no sensitive data exists. Dependencies, generated assets, release ZIPs, test artifacts, profiles, `.env` files, and raw evidence remain ignored. No files were committed or pushed as part of this preparation.

GitHub workflows are configured but have not executed on GitHub yet. Repository visibility and licensing remain owner choices. Historical verification sections above describe earlier milestones, not the current package version.
