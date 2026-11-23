# Frameway 0.5 launch brief

Status: preparation, not a publication announcement. The maintainer will create three real example projects. Final artwork and launch footage should use those approved examples; existing synthetic screenshots are references, not final campaign assets.

## Message

**Record anything. Make it clear. Share it your way.**

Supporting line: Turn screen recordings into interactive walkthroughs, videos, and editable projects. No Frameway account required.

Lead with the result, then explain capture → edit → share. The three use cases are Product demos, Training & onboarding, and Support & handoffs. Show local ownership through concrete behavior: local project storage, downloadable outputs, and editable file handoffs. Do not claim certifications, guaranteed security, automatic desktop click capture, live collaboration, or cloud hosting. Protected content and browser/OS capture restrictions still apply to “record anything.”

## Owner: example projects and final decisions

Create one short project for each category, ideally 5–8 steps and a 30–60 second viewing path. Use synthetic data or material you are allowed to publish. Use a consistent typeface and presentation style with a different accent per category.

| Category              | Suggested scenario                                     | Useful proof                                 |
| --------------------- | ------------------------------------------------------ | -------------------------------------------- |
| Product demos         | Explore a dashboard and create a report                | Hotspot, area highlight, gentle zoom         |
| Training & onboarding | Submit a request or complete a routine task            | Chapter, tip, warning, clear finish          |
| Support & handoffs    | Resolve a setting or explain a troubleshooting process | Arrow, short video segment, editable handoff |

For each, provide an editable `.frameway.zip` and a viewer HTML export. Optionally provide video. Save originals in ignored `exports/launch-0.5/`, not Git. Include the project title, one-sentence outcome, preferred hero slide, intended use permissions, and any music attribution. Inspect the complete source recording: interactive and editable exports retain original media even when trimmed.

Also test the final package with your important existing projects, tab recording/pause/resume/finish, and screen recording. Review on macOS and Windows if available. Approve the visual direction, final copy, and Store publication settings. Use the existing Store item; public listing does not require a new extension identity.

## Screenshot story

Five 1280×800 images, full-bleed canvas, square outer corners. Large readable headlines with real product UI; check readability at half size. Do not draw fictional product controls.

| Order | Headline                            | Capture needed                                                           |
| ----- | ----------------------------------- | ------------------------------------------------------------------------ |
| 1     | Turn your screen into a walkthrough | Finished product-demo slide, with one clear callout                      |
| 2     | Capture clicks as you work          | Actual recording popup and resulting slide sequence                      |
| 3     | Make every step clear               | Editor with a tip/arrow and a selected image step                        |
| 4     | Share something people can use      | Actual Share dialog and concise HTML / video / editable project captions |
| 5     | Your work stays local               | Library, with a local-storage/no-account caption                         |

Keep screenshots focused on real functionality. Use blue as the main product color with restrained teal/amber accents. No review stars, install counts, customer logos, or unsupported security badges.

## Asset deliverables

- Store icon: existing 128×128 PNG, verify small-size legibility and light/dark backgrounds. No logo redesign required for this release.
- Store screenshots: five 1280×800 PNGs as above.
- Small promo tile: 440×280; brand-led, minimal text, readable when reduced.
- Optional marquee: 1400×560 using the same visual system.
- Promo tile exports: JPEG or opaque 24-bit PNG; check the final dashboard constraints.
- Launch video: 30–45 seconds, 16:9, captioned, understandable muted. Finished result (0–6s), capture (6–14s), edit (14–25s), share (25–35s), logo and install CTA (35–40s). Record actual native capture separately; do not simulate a successful OS permission flow.
- README loop: 8–12 second derivative of editor → finished output, with a static fallback image. Keep download size modest.
- Social image: reusable 1200×630 composition, with editable source. This is our chosen format, not a promise of every platform's requirements.

Image sizes checked against [Chrome's image guidance](https://developer.chrome.com/docs/webstore/images) on November 23, 2026. Recheck the dashboard before uploading. Store screenshots are actual-UI evidence; promotional tiles can be more brand-led.

## Work that can be dispatched now

Copy this assignment into a separate agent task, preferably using an isolated worktree:

> Prepare Frameway 0.5 launch design templates using docs/LAUNCH-0.5.md and docs/STORE-READINESS.md. Work on a docs/launch-assets branch. Use the existing logo, blue/teal/amber visual direction, and bundled fonts with their licenses. Create editable SVG or HTML/CSS layouts for five 1280×800 Store screenshots, a 440×280 promo tile, an optional 1400×560 marquee, and a 1200×630 social image. Use clearly marked placeholders where the owner's three example projects will go; existing docs/assets/ui-polish and docs/assets/store images may be used only as provisional references. Supply a contact sheet and reproducible render instructions. Do not modify application code, dependency versions, extension permissions, release metadata, or publish anything. Do not commit private project backups. Keep copy short and do not invent functionality, testimonials, certifications, or adoption numbers. Preserve applicable asset/font notices. Open a focused PR when ready.

This is an assignment to dispatch, not a task already created. Keep design output under `docs/assets/launch-0.5/` so it does not conflict with release work.

## Launch copy drafts

**Short announcement, use only after publication:**

Frameway 0.5 is available: record a workflow, turn it into an interactive walkthrough, and share it as HTML, video, or an editable project. This release adds animated annotations, presentation frames, background music, and more polished sharing. Projects stay local, and no Frameway account is required. Try it from the Chrome Web Store: https://chromewebstore.google.com/detail/dpfkfbpolahiofedbdebdjmpjfphkjge

**Personal tester message:**

I've been building Frameway, a local tool for recording and sharing walkthroughs. I'd love for you to try recording a short workflow and sending the result to someone. You can share a viewable HTML file or an editable project. Let me know where recording, editing, or sharing feels confusing. Install: https://chromewebstore.google.com/detail/dpfkfbpolahiofedbdebdjmpjfphkjge

**Feedback link:** https://github.com/NicholasMicali/frameway/issues

Keep developer setup below the Store installation path in the README. Replace the existing demo only after the new footage is reviewed. Do not announce 0.5 as available until it is actually published.

## Final sequence

1. Merge release changes and verify main CI; build 0.5.0 candidate ZIP/checksum.
2. Owner tests candidate and supplies the three approved example projects.
3. Assemble assets from the approved examples and design templates; review images at actual and half size, video muted, and rights/credits.
4. Refresh README demo and Store screenshots; approve final package and copy.
5. Publish the approved GitHub release and verify its artifacts. Upload that package to the existing Store item, choose Public distribution, and submit for review.
6. Verify actual Store availability, same-item update behavior, and retained projects before public announcements. Update published-version references only when true.
