# Architecture and code map

Frameway has no application backend. The Chrome extension and localhost editor use the same React app but different browser storage origins.

## Recording to walkthrough

1. `extension/background.ts` handles toolbar/shortcut start and stop and creates the offscreen recording context.
2. `extension/offscreen.ts` records tab video; `extension/content.ts` captures click markers for the supported page context.
3. `src/db.ts` stores recording chunks, sessions, and projects in IndexedDB. Projects contain media Blobs and step metadata, not paths in the Git checkout.
4. `src/media.ts` fixes video duration, extracts screenshots, and creates steps. `src/ScreenRecorder.tsx` provides the alternative manual screen/window/tab recorder.
5. `src/model.ts` defines project schemas, validation, migration, and step operations. Schema versions are independent from the application release version.

## Editor and player

- `src/main.tsx`: project loading/saving, undo history, navigation, editor canvas, slide list, and inspector. This is a current consolidation point; split it in focused follow-up PRs rather than mixing refactoring with behavior changes.
- `src/Timeline.tsx`: timeline zoom and trim handles.
- `src/TitleSlide.tsx`, `src/branding.ts`, `src/themes.ts`: title composition, bounded logo processing, and walkthrough colors. Studio UI colors stay independent.
- `src/area-zoom.ts` and `.css`: shared focus geometry and animation. Callouts are outside the zoom transform.
- `src/HomeIntro.tsx`, `src/sample.ts`: onboarding and generated sample content.

`src/archive.ts` handles editable project ZIP backups. `src/interactive-export.ts` packages standalone HTML or a ZIP player. The exported player uses `src/player/runtime.js` and `.css`; it does not require React, editor storage, or a Frameway server. The React embed example wraps that standalone player in an iframe. Exported media includes original recordings; trimming changes playback ranges and is not redaction.

Rendering changes often need corresponding editor and player changes. Keep shared calculations shared and verify preview, offline HTML, relative-file ZIP playback, and backup roundtrips.

## Build and checks

`scripts/build.mjs` builds the editor and MV3 extension into ignored `dist/`. `scripts/package-extension.mjs` creates the ignored release ZIP. Root package and manifest versions must match. `tests/model.test.ts` covers model invariants; `scripts/test-browser.mjs` runs browser suites with generated media. Manual OS capture and managed-browser checks complement automation.

Project profiles, private captures, dependency caches, exports, and build output are not source. See `.gitignore` and [privacy](../PRIVACY.md).

Local backup bookkeeping uses optional `localRevision` and `localBackup` fields on stored projects. Edits receive a revision token; undo/redo restores the content revision while retaining the most recent export record. Portable backups omit both fields, and imports discard them. No IndexedDB version upgrade or project schema bump is needed. `storage-health.ts` provides estimates/status labels; `StorageManager.tsx` manages the library. Project deletion atomically removes the project and any completed linked capture session/chunks, preserving unrelated or unfinished sessions.

## Shared interface foundation

`src/HomePage.tsx` owns library-page composition; `src/main.tsx` retains project persistence, recording, and editor state. `src/styles/tokens.css` defines application-only visual tokens, `src/ui/controls.css` styles reusable controls, and `src/styles/navigation.css` owns workspace navigation layout. Walkthrough appearance remains separate.

`src/ui/Button.tsx` provides primary, secondary, ghost, danger, and icon-only variants using native button semantics. `Menu.tsx` wraps Radix Dropdown Menu and restores trigger focus before invoking actions that may open a dialog. Project navigation uses a Radix Popover because it contains a search input rather than only menu items. `Tooltip.tsx` provides supplementary help; callers must still supply accessible names for icon-only controls. Avoid replacing useful native controls just for uniformity.

Radix dependencies are bundled into the editor; they require no runtime service. The plain HTML/TypeScript extension popup and standalone exported player do not import React or Radix. Shared capture session and popup control message types live in `extension/protocol.ts`; runtime sender validation remains in the background worker.

The phased Store preparation work is documented in [the unlisted release plan](UNLISTED-RELEASE-PLAN.md) and tracked in [issue #45](https://github.com/NicholasMicali/frameway/issues/45).
