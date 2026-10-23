# Frameway beta TODOs

The next milestone is a dependable first-use experience: record a real workflow, edit it, and send or embed a working walkthrough. These are open tasks, not promised features. Prioritize changes using tester findings before expanding scope.

## Real-use feedback — October 23

- [x] Add per-slide quick actions for duplicate, move up/down, and delete, with undo support.
- [x] Use accessible undo/redo icons and move project selection into the header.
- [x] Scroll slide settings independently from the canvas.
- [x] Add timeline zoom controls (1×–16×) for granular trimming.
- [x] Upload a company logo for title slides only; preserve it in backups and exports.
- [x] Add a custom theme color alongside presets, scoped to walkthrough content.
- [x] Animate highlighted-area screenshots while keeping callouts at normal size.
- [x] Add subtle, area-size-based automatic zoom plus per-slide enable/disable and custom percentage; preserve settings in backups and exported players, respect reduced motion, and avoid blank image edges.
- [ ] Gather feedback on timeline zoom and numeric start/end editing before expanding video editing controls.

- [x] Name HTML downloads, embed ZIPs/extracted folders, and editable project backups after the project title, with portable filenames.

## Before wider sharing

- [x] Verify GitHub Actions checks on macOS, Windows, and Linux and build/test the local extension ZIP. Verification of the published release download remains part of release validation.
- [ ] Install the packaged extension in a fresh Chrome profile and complete the entire record → edit → export flow.
- [x] Adopt Apache-2.0 and document contribution and local-only project policies.
- [ ] Publish a versioned beta release with the extension ZIP and installation instructions after validation.
- [ ] Ask a few testers to follow [the testing guide](docs/BETA-TESTING.md) without live setup help; capture where they get stuck.

## Windows enterprise validation — owner feedback received

- [x] Owner reports Frameway works on Windows and exported HTML can be sent to recipients successfully. Exact OS/Chrome versions and managed-policy configuration were not supplied.
- [ ] Clone and build with Node 24 in PowerShell, including a checkout path containing spaces.
- [ ] Check whether managed Chrome permits Developer mode, unpacked extensions, and tab capture; document any policy blockers without bypassing them.
- [ ] Record a representative workflow with approved test data; check click alignment, screenshots, video continuity, and stop/save behavior.
- [ ] Test browser zoom, Windows display scaling, and multiple monitors for overlay alignment.
- [ ] Exercise scrolling, dialogs, new tabs, and sign-in redirects; note where existing single-tab/top-frame/cross-origin limits affect the use case.
- [ ] Edit title slides, callouts, highlights, step order, and video trims; reload and confirm the project persists.
- [ ] Export/import a project, open standalone HTML offline, and test an embed on the intended internal site if permitted.
- [x] Confirm recipient delivery of standalone HTML on the owner-tested Windows workflow.
- [ ] Check ZIP delivery and any additional enterprise sharing-channel restrictions.
- [ ] Record findings using the guide below, then turn reproducible failures into prioritized tasks.

## Reliability and trust

- [ ] Improve storage quota errors and make backup guidance actionable before space runs out.
- [ ] Recover unfinished recordings after browser crashes, tab closure, or interrupted saving.
- [ ] Test near-limit recordings and large exports for memory use, responsiveness, and useful failure messages.
- [ ] Verify project backup/migration across extension updates and fresh installations.
- [ ] Investigate export media trimming/redaction. Current exports retain original media; playback trims do not remove sensitive content.

## Usability — validate with testers

- [ ] Identify confusing editor controls and improve labels, empty states, and keyboard/focus behavior.
- [ ] Review title/card readability and player controls on small screens and at browser zoom.
- [ ] Make extension installation, recording status, and return-to-editor steps clearer wherever testers hesitate.
- [ ] Prioritize feature requests by concrete use case, frequency, and workaround cost.

## Candidate features — not yet committed

- [ ] Evaluate multi-tab/cross-origin recording and iframe click capture.
- [ ] Evaluate microphone/system audio requirements.
- [ ] Evaluate native desktop click capture only if browser recording cannot meet real use cases.
- [ ] Evaluate reusable branding/templates and richer navigation based on feedback.

Managed hosting and accounts are outside the current milestone. Keep local use and portable exports working independently.
