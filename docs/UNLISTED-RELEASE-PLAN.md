# Unlisted Chrome Web Store release plan

Drafted November 16, 2026. Baseline: v0.3.0. Proposed next version: v0.4.0, confirmed during release preparation. This document describes planned work, not shipped functionality or an approved Store submission.

## Outcome and boundaries

Make Frameway feel like a polished, installed Chrome extension while preserving its local-first recording, editing, and portable exports. Adopt Radix Primitives and consistent custom CSS. The only new product functionality is an optional closing slide. Existing capabilities may be reorganized and relabeled, but recording behavior, permissions, navigation rules, and storage semantics stay unchanged.

Keep accounts, backend services, telemetry, remote runtime assets, cloud sync, AI, narration, additional animation types, and new capture modes outside this release. Reusing existing app tabs, recording timers, and new tab-selection controls are also deferred rather than added during popup polish. Animation exploration remains [issue #44](https://github.com/NicholasMicali/frameway/issues/44).

## Product language

Lead with broad capture capability, then explain the best route for the task:

> Turn what’s on your screen into a walkthrough.
>
> Capture websites, desktop apps, or an entire screen. Record a Chrome tab for automatic click-by-click steps, or record a window or screen and add screenshot steps in the editor.

Use “Record my screen” as a visible secondary action, not an obscure fallback. Explain that the browser picker determines available capture surfaces; do not promise capture of protected content, automatic desktop click detection, audio, or unrestricted enterprise access. Both current recording paths capture silent video. The installed extension remains useful for workflows outside Chrome through the existing screen recorder.

Use consistent terms: Library, walkthrough, Record this tab, Record my screen, Pause, Resume, Finish recording, Share, Export project backup, Import project backup. Avoid studio/lab terminology and developer setup language in everyday UI.

## Visual system

- White surfaces, a restrained pale-blue page background, dark neutral text, subtle borders and shadows. Project branding colors affect walkthrough content only.
- Shared tokens for type sizes, line heights, spacing, radii, shadows, focus rings, motion, and semantic colors. Prefer system fonts and bundled assets.
- Solid blue primary buttons; neutral secondary buttons; ghost utility buttons; consistently sized icon-only controls with accessible names and tooltips. Keep text on unfamiliar or important actions.
- Red denotes recording or destructive actions, amber denotes paused/warning states, green denotes success. Always pair color with text or a recognizable icon.
- Use a consistent SVG icon vocabulary and stroke weight. Refine the existing Frameway mark, with optical adjustments at 16/32 px and coordinated 48/128 px assets. Verify light and dark browser-toolbar backgrounds. Do not redesign user-supplied brand logos.
- Clear hover, pressed, selected, disabled, pending, error, and keyboard-focus treatments. Reduced-motion support and usable contrast remain acceptance criteria.
- Responsive library cards and section layouts; no clipped controls at narrow widths or 200% browser zoom. Preserve the editor’s usable canvas and independent settings scrolling.

## Architecture

Use Radix Primitives for interactive React controls such as dropdown menus, dialogs/alert dialogs, tooltips, and popovers where needed. Keep native controls where they already fit. Use small Frameway wrappers in `src/ui/` so feature components share styling and conventions. No Tailwind or CSS-in-JS migration is required.

Split the home/library composition out of `src/main.tsx`, then extract editor shell/settings composition where doing so clarifies ownership. Separate global tokens/base styles, shared control styles, and feature styles. Scope broad selectors to avoid accidental changes to the player or popup. Do not combine these extractions with recording-engine rewrites.

Centralize extension message/session types while preserving runtime sender checks, state transitions, and error handling. Keep the popup in plain HTML/TypeScript; reuse tokens and icon assets without adding React solely for a few controls. Keep the standalone exported player independent of React and Radix.

Record the dependency and closing-slide data-format decisions in a tracking issue before their implementation, per CONTRIBUTING.md. Pin resolved dependencies through the lockfile, review licenses, and compare packaged size. Existing backups must continue to import.

## PR sequence

### PR 1 — Shared UI foundation and safe architecture extraction

- Add the selected Radix primitives and shared control wrappers.
- Establish tokens, button variants, field styles, and icon sizing.
- Extract home composition and split styles into clear ownership boundaries.
- Centralize extension protocol types without changing behavior.
- Migrate a small representative set of controls to prove focus, portals, and styling work before broad replacement.
- Document the component conventions and architecture map for contributors.

Acceptance: existing workflows and exports remain unchanged; menu/dialog keyboard behavior, focus restoration, and layering work; no new runtime network requests or permissions. Measure editor/popup/player bundle changes.

### PR 2 — Library, content, and logo polish

- Compact header and “Your walkthroughs” heading; library remains the central feature.
- Consistent project cards, readable metadata, compact search/sort, and Radix project menus. Preserve current sorting and actions.
- Polish empty, loading, no-results, error, and busy states using existing capabilities.
- Present the existing onboarding, sharing/backups, and use-case content as normal sections below the library, not collapsible panels. Keep first-use guidance visible without displacing the whole library.
- Make Record my screen a clearly labeled secondary action alongside concise tab-recording guidance. Do not add a home-page button that tries to record the extension’s own tab.
- Replace installation-heavy content with pin/open/record/share guidance for installed users. Keep manual ZIP and source-install instructions in contributor/testing documentation.
- Refine and generate the Frameway logo assets; apply consistently across header, popup, and manifest icons.

Acceptance: synthetic empty and populated libraries reviewed at desktop, narrow widths, and browser zoom; no collapsed help sections below the library; no claims of automatic desktop click capture. Published Store links are inserted only after a real item URL exists.

### PR 3 — Popup and editor consistency

- Restyle the existing popup states using shared tokens, SVG icons, and clear action hierarchy.
- Primary Record this tab; secondary Open library. Preserve existing pause/resume/finish behavior and popup-close behavior.
- Make unsupported-page and failure messages useful; keep library access available.
- Apply shared controls to editor toolbars, project settings, slide menus, and utility dialogs in bounded groups. Preserve all existing controls and workflows.
- Use Radix focus/navigation behavior where appropriate; verify Escape, tab order, outside-click dismissal, tooltips, and dialog focus restoration.

Acceptance: unchanged capture/message behavior; all recording states remain understandable; no popup overflow; project styling does not recolor the application. No new timers or tab-reuse behavior in this PR.

### PR 4 — Optional closing slide

- Add an explicit Closing slide entry in the existing add-slide menu. Append it at the end and select it for editing. Do not automatically alter existing walkthroughs.
- Provide editable heading and description with a restrained completion layout using the current project branding. Default copy: “You’re all set” and an editable short completion message.
- Provide a Replay walkthrough action; restart from the first step and reset video/zoom state. Do not introduce additional external-link settings in this release.
- Support normal slide selection, editing, duplication, deletion, and undo/redo. A closing slide ends that playback route; users can still use existing navigation to revisit steps.
- Reuse presentation styles where useful, but model closing behavior explicitly rather than overloading the title-slide Start action. Decide the smallest validated schema extension and document compatibility before implementation. Old backups import without adding a closing slide; do not promise new backups work in older app versions.
- Implement consistent rendering in editor, preview, standalone HTML, and embed exports; preserve settings through project backup/import.

Acceptance: completion and replay work with and without a title slide; direct navigation, video-to-closing transitions, zoom exit, duplicate/delete/undo, and backup roundtrips are tested. Existing projects without closing slides retain their current ending behavior.

### PR 5 — Store readiness and release candidate

- Finish README, testing guide, privacy/support links, release notes, and stale version references. Describe both recording paths accurately.
- Prepare listing copy, permission justifications, privacy disclosures, refined icons, and sanitized screenshots reflecting the final build.
- Keep unpacked/source distribution documented. Explain backup/import migration from an unpacked installation to the Store installation; do not imply the libraries automatically transfer.
- Document normal Store updates separately from manual ZIP replacement. Test storage preservation using successive versions with the same extension identity.
- Confirm version number, synchronize manifest/package versions, and package the reviewed candidate from main after merges.
- Create the Store item and select unlisted distribution as part of the authorized publishing workflow. Do not claim the listing is live before approval/publication.

Acceptance: complete release checklist below, maintainer product test, and explicit green light before submission/publication. Do not add automatic Store upload credentials or CI publishing in this pass.

## Review and validation

Use focused branches and PRs with sanitized before/after screenshots. Merge sequentially after applicable CI and maintainer review; stack only when dependencies make it useful and identify the base clearly. Avoid mixing visual rewrites with closing-slide behavior in the same PR.

- Run formatting, lint, TypeScript/build, model tests, and relevant browser workflows for each change; run the complete required suite for the final candidate.
- Add meaningful interaction tests for Radix migration and closing-slide behavior, rather than tests that merely assert CSS classes.
- Test the packaged extension in a fresh Chrome profile: launch library, tab capture, pause/resume/finish, edit, preview, closing slide, HTML/embed export, backup/import, and reopen persistence.
- Test the existing Record my screen path with an actual desktop window or full screen on macOS and Windows. Synthetic CI capture does not prove native-picker behavior or managed-device permissions.
- Check narrow layouts, browser zoom, keyboard-only flows, focus restoration, contrast, and reduced motion. Radix is a foundation, not an accessibility certification.
- Verify existing backups, current projects, and offline exports. Keep private recordings and browser profiles out of source control and Store screenshots.
- Review package contents, dependency/license changes, CSP compatibility, permissions, and runtime network behavior. No remote scripts/fonts or backend requirements.
- Stop temporary local servers after tests. Leave the user’s project storage untouched.

## Release gates and deferred work

1. Maintainer reviews the visual direction and tests the completed package.
2. Required CI and native capture checks pass; release/version materials are consistent.
3. Store listing, disclosures, migration instructions, and actual support/privacy URLs are ready.
4. Maintainer explicitly approves submission/publication. Account registration or verification may require the owner.
5. Submit as unlisted, address review findings, then verify installation from the actual Store link. Unlisted is link-accessible, not restricted to the team, and still undergoes normal policy review.

This plan does not close broad reliability/accessibility issues merely because related controls were polished. Keep narration, redaction, reusable brand kits, readable-guide exports, and additional animations as separately prioritized work.

## References

- [Radix styling](https://www.radix-ui.com/primitives/docs/guides/styling): unstyled primitives accept ordinary CSS; Frameway owns the visual system.
- [Chrome distribution settings](https://developer.chrome.com/docs/webstore/cws-dashboard-distribution): unlisted visibility and review requirements.
- [Chrome Web Store best practices](https://developer.chrome.com/docs/webstore/best-practices).
- [Privacy disclosures](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy).

## Implementation status

The work is prepared as a dependent PR stack, awaiting maintainer review and merge:

| Chunk                                | PR / branch                                               |
| ------------------------------------ | --------------------------------------------------------- |
| Shared foundation                    | [#46](https://github.com/NicholasMicali/frameway/pull/46) |
| Library and logo                     | [#47](https://github.com/NicholasMicali/frameway/pull/47) |
| Popup and editor                     | [#48](https://github.com/NicholasMicali/frameway/pull/48) |
| Optional closing slide               | [#49](https://github.com/NicholasMicali/frameway/pull/49) |
| v0.4.0 candidate and Store materials | `chore/store-release-prep`                                |

The current editor has add-slide buttons below its step list, so Closing slide uses that area alongside Add title slide rather than introducing a new menu. Native dialogs remain where appropriate; Radix covers the migrated menus/popovers/tooltips. The popup remains plain HTML/TypeScript and the exported player remains independent of React/Radix.

See [Store readiness](STORE-READINESS.md) for remaining owner and publication gates. The Store listing is not live, and local candidate packaging does not constitute release approval.
