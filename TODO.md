# Frameway beta TODOs

The next milestone is a dependable first-use experience: record a real workflow, edit it, and send or embed a working walkthrough. These are open tasks, not promised features. Prioritize changes using tester findings before expanding scope.

## Before wider sharing

- [ ] Verify the first GitHub Actions build and downloadable extension artifact.
- [ ] Install the packaged extension in a fresh Chrome profile and complete the entire record → edit → export flow.
- [ ] Choose a license so contributors and users know what reuse is permitted.
- [ ] Publish a versioned beta release with the extension ZIP and installation instructions after validation.
- [ ] Ask a few testers to follow [the testing guide](docs/BETA-TESTING.md) without live setup help; capture where they get stuck.

## Windows enterprise validation — awaiting owner testing

- [ ] Clone and build with Node 24 in PowerShell, including a checkout path containing spaces.
- [ ] Check whether managed Chrome permits Developer mode, unpacked extensions, and tab capture; document any policy blockers without bypassing them.
- [ ] Record a representative workflow with approved test data; check click alignment, screenshots, video continuity, and stop/save behavior.
- [ ] Test browser zoom, Windows display scaling, and multiple monitors for overlay alignment.
- [ ] Exercise scrolling, dialogs, new tabs, and sign-in redirects; note where existing single-tab/top-frame/cross-origin limits affect the use case.
- [ ] Edit title slides, callouts, highlights, step order, and video trims; reload and confirm the project persists.
- [ ] Export/import a project, open standalone HTML offline, and test an embed on the intended internal site if permitted.
- [ ] Test recipient delivery through the intended enterprise sharing channel, including any HTML/ZIP download restrictions.
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
