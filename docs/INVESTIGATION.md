# Investigation and Codex handoff

## Observe a small representative walkthrough

Use a dummy application and a short sequence: click a button, open a dropdown, scroll, open a modal, navigate, then finish recording. In Arcade's editor, change hotspot text, move its anchor, move the card, reorder/delete a step, change a target, resize preview, save, and reload.

For each action record: input, before/after screenshot, visible result, applicable request metadata, REA evidence ID, confidence, and remaining unknowns. Separate documented behavior, directly observed behavior, inferred mechanism, and our design choice. Do not infer backend storage from a route name alone.

Questions that matter:

- Is the displayed screenshot before or after the recorded click?
- Are screenshots, video segments, or both generated?
- What happens to rapid clicks, scrolling, and navigation?
- Are card placement and hotspot position independent?
- Are anchors percentage-based, pixel-based, or transformed elsewhere? How do they behave when resized?
- Does reordering preserve explicit targets? How are deleted targets handled?
- When is edited content persisted? Does reload preserve it?

Timebox observation to answering these questions. Pixel-identical reproduction and full bundle deobfuscation are unnecessary to the requested product.

## Investigation prompt

```text
Read docs/FEASIBILITY.md, docs/SETUP.md, and docs/SOURCES.md. Use REA's
browser tools (or its CLI if MCP is unavailable) to inspect my authorized
Arcade research-browser session. Focus only on click capture, video/screenshot/step
association, hotspot and callout editing, and preview navigation. Establish
the actual target and allowed origin from browser discovery. Collect before/
after evidence around representative actions and save raw results under
ignored evidence/. Write docs/OBSERVED-BEHAVIOR.md with evidence IDs, observed
facts, inferences, and unknowns. Do not claim private implementation details
without evidence. If the session is unavailable, report that limitation and
continue with the local capture spike; do not invent observations.
```

## Implementation prompt

```text
Implement the narrow hybrid video-and-screenshot walkthrough MVP in this repository using
React, TypeScript, and a Chrome Manifest V3 extension with an extension-page
editor and shared player. Read the feasibility brief and any observed-behavior
report first. Build a dummy target page and a continuous-video capture spike with timestamped clicks.
Use an offscreen document for recording and map event time to media time. Verify screenshot/click pairing during scroll,
SPA transitions, full navigation, and rapid input. Flag stale captures visibly.
Then implement step management, draggable normalized hotspots, editable plain-
text callout cards, navigation targets, preview, IndexedDB persistence, simple transition clip in/out editing, and
versioned project archives containing binary media. Keep it local and use original UI/code.
No accounts, cloud services, AI API, billing, multitrack video editor, or analytics.
Document load-unpacked instructions and verify a ten-step capture/edit/reload/
playback flow. Add meaningful tests for coordinates, target integrity, and
import validation. Report supported cases and actual test results candidly.
```

## Video-specific observation checklist

Confirm how Arcade splits continuous capture into still and video steps; whether clicks pause on the pre-action or post-action frame; whether scrolling creates a clip; how idle time is removed; how users adjust boundaries; and whether moving/reordering a still also moves its transition. Check back/restart behavior and audio at still pauses. Capture one 30–60 second dummy flow in the extension and later in the desktop app. Compare outputs before inferring a shared pipeline.

Credentials are not needed for the public research phase. For later authenticated inspection, the user can sign in directly in the isolated browser and complete MFA. Record the desktop app's actual bundle path/version before using REA; do not assume Electron or native implementation from appearance.
