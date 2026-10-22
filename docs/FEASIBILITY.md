# Feasibility and implementation scope

## Decision

The requested subset is feasible without rebuilding Arcade. Start with browser-only, hybrid video-and-screenshot interactive walkthroughs. Continuous video between still steps is a core requirement, confirmed by the user on 2026-10-21. A viewer clicks overlays on saved screenshots; the underlying website does not need to be live or logged in. This is different from injecting onboarding cards into a live application, which would require a separate DOM-anchored tour architecture.

Arcade's official knowledge-base index identifies recording, editing, hotspots/callouts/spotlights, branching, and cover/fit as product capabilities. Its changelog documents editable hotspot text and targets, movable text boxes, and point/area hotspots. These are documented behaviors, not observations of private code. [Sources](SOURCES.md).

## REA's useful scope

REA supplies browser page inspection, screenshots, session observations, static JavaScript bundle analysis, and evidence comparison. It can help establish which UI changes and browser-visible requests accompany recording, saving, and previewing. Browser observation attaches through Chrome DevTools Protocol. Passive observation does not click through the app; the user or a separate browser controller performs actions.

A locally available extension or JavaScript app can also be inspected statically. Native analysis is optional and unnecessary for the first browser version. Do not install Hopper/Ghidra just for this project.

REA cannot recover server source or guarantee original names from minified bundles. An observed request proves a browser interaction, not backend architecture. It does not automatically generate a correct recorder/editor. Investigating Arcade's logged-in editor needs a user-provided authorized session; that investigation has not happened yet.

## Proposed first version

| Area | Include | Defer |
| --- | --- | --- |
| Capture | Chrome MV3 extension; explicit start/stop; one active tab; continuous tab video; timestamped clicks; extracted still frames; manual frame correction | Desktop apps, mobile, cross-origin iframe interaction, multi-tab flows |
| Editor | Step thumbnails; select/reorder/delete; screenshot canvas; editable card title/body; movable hotspot/card; next-step target; simple clip in/out controls; preview | Rich text, multitrack video editing, audio, pan/zoom, AI writing |
| Player | Still with accessible hotspot/button → transition video → next still; next/back/restart; responsive media and overlays | Analytics, accounts, billing, hosted publishing |
| Storage | Extension-origin IndexedDB for images and metadata; versioned manifest plus binary image/video assets in a project archive | Cloud services, teams, conflict resolution |

Use a React + TypeScript editor packaged as an extension page, with a shared player component. This avoids an extension-to-localhost bridge for the initial product. A Vite development preview can use fixture data. A standalone player/export is a later milestone; REA is a development tool, not a runtime dependency. No AI API is needed by this product.

## Capture is the highest-risk part

1. A screenshot requested in a click listener is asynchronous. The site may navigate or update before pixels are captured. Even `pointerdown` does not guarantee a pre-click image. Never present this as solved merely by registering a listener in the capture phase.
2. Chrome documents a maximum of two `captureVisibleTab` calls per second. Rapid clicks need explicit handling, and this API is unsuitable for high-frame-rate sampling. It captures the active tab in a window, so validate tab identity before and after capture.
3. Record a continuous tab stream in an offscreen extension document, with timestamped click metadata from content scripts. Extract still frames from the recording and define transition clips as non-destructive in/out ranges. The screenshot API is only a manual fallback, not the video source.
4. Synchronization is still a spike: map event and media clocks, account for navigation and delivery delay, and expose correction of each selected still/clip boundary. A continuous recording preserves candidate pre-click frames but does not automatically align them. See [video research](VIDEO-AND-DESKTOP.md).
5. Content scripts record viewport-relative CSS coordinates. Save viewport size, scroll offset, zoom/device-pixel metadata, and actual image dimensions. Normalize hotspot coordinates to the captured image. At playback, apply overlays to the displayed image rectangle, accounting for letterboxing; do not anchor them to the entire editor container.
6. Start with `activeTab`, `scripting`, `tabCapture`, and `offscreen`. Cross-origin navigation revokes the temporary grant and should visibly pause capture. Same-origin full navigations require content-script reattachment. Restricted browser pages and cross-origin iframe clicks are outside the first supported matrix.
7. Persist each completed step as it arrives: a Manifest V3 worker can restart. Keep media blobs/chunks and metadata in IndexedDB, not growing localStorage/base64 strings. Never store typed password values. Screenshots can still show private content; use dummy data for research and exclude raw captures from Git.

Chrome API constraints are established by official documentation; the capture design above is our proposal. [Chrome Tabs API](https://developer.chrome.com/docs/extensions/reference/api/tabs), [activeTab](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab).

## Proposed data contract

A project has `schemaVersion`, `id`, `title`, ordered `stepIds`, `steps`, and media assets. A transition references a recording asset and media in/out timestamps; still frames retain their source recording and timestamp. Each step has a stable ID, asset ID, image size, capture viewport, timestamp, optional click metadata, and overlays. An overlay has a stable ID, kind (`hotspot` or `callout`), normalized x/y, title/body, card placement, and action (`next`, `stepId`, or `end`). Start with plain text, rendered as text rather than HTML.

Use stable step IDs for navigation. Reordering should not change explicit links. Deleting a referenced step must surface or repair broken links. Keep capture metadata distinct from editable overlays so moving a card does not overwrite the original evidence.

## Milestones and acceptance gates

These are rough engineering estimates, not measured Codex execution times. One developer with Codex might reach a narrow prototype in roughly 8–15 working days for the hybrid browser prototype; robust capture across arbitrary websites can take substantially longer.

1. **Observation and capture spike (1–2 days):** use a dummy site with a dropdown, modal, SPA route, full navigation, scroll, and rapid clicks. Measure event/image pairing. Gate: accurate pre-action screens for supported cases; visible failure status otherwise. Verify video-backed capture and media/event alignment before promising automatic segmentation.
2. **Editor/player (2–3 days):** import fixture screenshots, edit cards, reposition anchors, reorder/delete steps, preview still/video transitions and adjust clip boundaries. Gate: normalized anchors stay aligned on resized displays; keyboard navigation works; broken targets are handled.
3. **Extension integration (1–3 days):** start/stop, persistence, editor handoff, error states. Gate: record a ten-step supported flow, edit it, reload Chrome, and play it back correctly.
4. **Portable export and hardening (1–2 days):** validate import sizes/schema, round-trip binary image/video assets, standalone playback if needed. Gate: imported project preserves text, ordering, targets, and image alignment; no network dependency for local playback.

Tests should focus on coordinate transforms, graph edits, import validation, and real capture races. Browser tests must include device scaling, zoom, scroll, navigation, worker restarts, and quick repeated input. Passing unit tests alone does not establish capture reliability.

Desktop capture is a later separate capture adapter, with the same project model/editor/player. It is not included in the browser estimate. See [desktop research](VIDEO-AND-DESKTOP.md).
