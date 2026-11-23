# Editor, player, and export consistency

## Current cleanup pass (#57)

The editor, preview, offline HTML/embed player, and video compositor now resolve primary-card typography from `walkthroughStyle()` in `appearance.ts`. The same font family, body/heading sizes, text color, and button shape feed CSS custom properties and canvas rendering. Defaults are comfortable (14px body / 19px heading); compact is 12/16 and large is 16/22. These are authored sizes, not a promise of pixel-identical wrapping at every viewport width.

Video link labels use card text color, matching interactive cards. Final image cards show Replay instead of Continue when their configured destination ends the walkthrough. HTML uses the same Replay arrow label as preview. Music audition starts at the project volume and follows the volume slider.

## Expected behavior across outputs

| Area                    | Editor / preview / HTML or embed                               | Video                                                                    |
| ----------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Branding and frames     | Same saved appearance and shared frame geometry                | Same saved appearance and shared frame geometry                          |
| Primary-card typography | Shared resolved font, sizes, color, shape                      | Same resolved values; native canvas text measurement                     |
| Text formatting         | Shared safe HTML formatter                                     | Local text layout supports bold, italics, lists and explicit line breaks |
| Navigation              | Branches, replay, links, and clickable elements                | Library order once; controls are visual, not clickable                   |
| Extra cards             | Editable; expandable cards can open on demand                  | Expanded so their information is not hidden in a passive video           |
| Motion                  | Entrance, pulse, zoom, plus hover/focus feedback               | Time-based entrance, pulse and zoom; no hover state                      |
| Audio                   | One loop, viewer mute, browser interaction may be needed       | Selected track mixed locally, fades at output boundaries                 |
| Music attribution       | Accessible source/license credits                              | Required credits overlaid in final five seconds                          |
| Editable sharing        | Project archive preserves authored settings and uploaded audio | Playback-only output; keep the project archive for editing               |

Editor drag handles and editing affordances are intentional and are never exported. HTML and embed use the same standalone player. Video does not modify the project or follow interactive branches repeatedly.

## Follow-up work retained in #57

- Compare representative long-text cards, list indentation/paragraph spacing, title/closing layouts, and icon geometry at matched stage sizes. CSS is responsive; video composes at a logical 1280px width. Exact wrapping/layout equivalence remains open.
- Consolidate animation timing/easing where measurement shows differences. Honor reduced-motion behavior; do not add a new animation settings panel.
- Measure frame pacing, long clips, file sizes, and encoder resource use before changing codecs or quality controls.
- Optional text-length duration suggestions and an automatic-sequence preview remain future scope.
- Validate final artifacts in real Windows/macOS players before release; browser tests do not establish every native player combination.

No cloud render service, API keys, voiceover, new transition system, or wholesale renderer replacement is included in this pass.

## Verification

`tests/output-consistency.mjs` compares computed primary-card typography in the editor, preview, and offline HTML; checks actual canvas-drawn heading fonts, action-link color and terminal label; and checks soundtrack audition volume. Existing video export tests cover frames, rich text, extra elements, native encoding, cancellation/retry, offline rendering, durations and project immutability. Model tests protect the shared style resolver.
