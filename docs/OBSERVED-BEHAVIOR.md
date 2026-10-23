# Arcade project inspection — 2026-10-21

Inspected the user's already signed-in Arcade editor in their rightmost Chrome tab. The project was recorded with Arcade's extension, according to the user. No sign-in was necessary. Inspection used the native Chrome accessibility tree and screenshots because the browser connector returned an unsupported-authentication-method error. This initial pass was UI observation, not REA/CDP analysis or source recovery. The later network pass is documented at the end.

Only step selection, opening menus, switching Edit/Preview, and playing the walkthrough were performed. No text, styles, destinations, ordering, sharing settings, or recorded media were intentionally changed. The session was left in Edit with the opening video step selected. Full browser screenshots and account identifiers are not copied into the repository.

## Evidence ledger

IDs below identify observations in this session, not REA-generated evidence IDs.

| ID    | Action and directly observed result                                                                                                                                                                                                     | Confidence / boundary                                                                                                                                   |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UI-01 | Opening editor shows a left step rail, central media stage, right properties panel, and bottom timeline for the selected video step. Toolbar includes Hotspot, Callout, Area, Pan and zoom, Voiceover, and Recording.                   | Direct UI observation; these controls were not all exercised.                                                                                           |
| UI-02 | Select Step 2: the video timeline disappears; image-specific fit and image-editor controls appear; a hotspot is exposed on the recorded prompt input.                                                                                   | Confirms this selected step behaves as an image step.                                                                                                   |
| UI-03 | Select the existing hotspot: the inspector shows a text editor, three style choices (Hotspot/Callout/Area), background and text color, an Apply-to-all operation, five position controls, Open by default, and Destination.             | Controls observed. Styles, positions, colors, and default-open setting were not changed. Icon-only position choices were not assigned guessed meanings. |
| UI-04 | Open Destination: choices include Next Step, explicit steps up through Step 11, This Step, URL, and Another Interactive Demo. Close without choosing.                                                                                   | Confirms available target categories. No destination was changed or followed outside the walkthrough.                                                   |
| UI-05 | From Step 2 in Preview, activate its hotspot: the player exposes Video: Step 3, an active Pause control, and approximately 00:00 / 00:03. After completion, a still with a different hotspot appears. Returning to Edit selects Step 4. | Direct confirmation of still → user click → video → following still for this sequence.                                                                  |
| UI-06 | The opening video step's menu exposes Rename, Copy, Duplicate, Skip step, Hide from navigation, Disable autoplay, and Delete.                                                                                                           | Menu entries only. Disable autoplay suggests that step currently has autoplay enabled; no toggle was tested.                                            |
| UI-07 | Opening video in Edit shows 00:00.00 / 00:18.51 and a selected short segment near the beginning of the timeline. The same step in Preview starts playing with approximately 00:00 / 00:02, then reaches Step 2.                         | Distinguishes editor timeline extent from played clip length. The 18.51s value must NOT be described as the first clip's playback length.               |
| UI-08 | Preview begins from the currently selected editor step in the tested transitions between Edit and Preview. Returning to Edit reflects the reached playback step.                                                                        | Observed in this session; behavior for fresh loads/share links was not tested.                                                                          |

## What this changes in our implementation direction

### 1. Explicit image and video steps

Arcade exposes video clips as separate selectable steps, including an opening video before the first image. Our v1 model puts a video range on a still step (`transition: boolean`) and starts playback at the first still. It therefore preserves but does not present the opening footage before the first click.

Move toward a discriminated image/video step model with stable IDs. Video steps reference the original recording and an in/out range; image steps reference a still frame and overlays. Keep source assets separate from the editable sequence. This is our implementation design inspired by observed behavior, not a recovered Arcade schema.

### 2. Preserve the existing successful playback behavior

Our still → transition video → next still behavior matches the tested Arcade flow. A refactor should retain that behavior while exposing video steps directly in the editor and adding the optional opening clip. Autoplay should belong to video steps independently of any product-wide autoplay setting.

### 3. Separate the overlay styles

The current prototype always shows a dot and a visible card together. Add an explicit overlay kind and default-open state. Start with point hotspots and callout cards; add rectangular area overlays afterward. Empty hotspot text should support a dot-only experience rather than forcing a placeholder card. Confirm the exact callout and area behavior in a disposable project before claiming parity.

### 4. Make source time and clip time unambiguous

The observed editor exposes a longer media timeline than the selected clip's playback length. This is consistent with non-destructive ranges into a longer recording, but does not prove shared file storage or Arcade's backend representation. Our model already retains the original video and ranges; the UI should clearly distinguish source duration, selected range, and playback time.

### 5. Improve navigation and presentation selectively

Current internal next/step/end targets cover the initial local scope. The observed URL/other-demo targets are useful later. Skip, duplicate, and per-step autoplay are more relevant near-term than cloud publishing, AI voiceover, branding plans, or analytics.

## Next implementation slice

1. Add a versioned image/video step model and migrate existing v1 project ZIPs and stored projects without losing media, text, or targets.
2. Convert each retained transition into its own video step; migrate incoming/outgoing targets carefully so explicit branches still land on the intended still.
3. Add an opening video step for newly captured projects when there is usable footage before the first marker. Keep manual trim controls and explicit handling of tiny/empty ranges.
4. Render image/video badges in the step rail; show source timeline and selected range for video steps, overlay controls for image steps.
5. Add hotspot versus callout style and optional default-open state, while retaining separate anchor/card coordinates.
6. Test migrated projects, opening-clip playback, autoplay pause/resume, branching, Back/Restart, and export/import round trips.

## Still unknown

- Whether screenshots are separately captured at click time or extracted from the video, and how Arcade synchronizes them.
- The automatic segmentation algorithm, idle-time treatment, and rapid-click behavior.
- Whether every clip references one source file or separate rendered media; actual request payloads and storage schemas were not inspected.
- Overlay rendering details for Callout/Area, multiple overlays on one step, and behavior after deleting a linked step.
- Save/debounce behavior and native desktop implementation.

These unknowns should be investigated through a controlled recording/disposable project or focused browser evidence. The existing project is sufficient to establish the next useful product changes without downloading its private media or copying proprietary implementation code.

## Follow-up network inspection and implementation

A read-only native Chrome DevTools session followed the UI inspection. Reloaded the same editor with Network recording enabled, filtered requests, and viewed response tabs. Closed DevTools afterward; no project edits or save experiments were performed. No HAR, private asset URLs, tokens, or project payloads were saved.

- **NET-01:** A separately requested PNG under the CDN's extension-upload path appeared in the console's preload messages. This confirms a screenshot asset exists, not when or how it was captured.
- **NET-02:** A request to the Mux image service for `storyboard.vtt` appeared in Network. This establishes a video storyboard request, not the source-file layout of individual steps.
- **NET-03:** Firestore Listen/channel requests appeared. One response was a channel handshake; another returned DevTools' “No data found for resource with given identifier.” The project document schema was not recovered.

The v2 implementation now exposes image and video steps, opening footage for new recordings, per-video autoplay, hotspot/callout controls, and default-open state. Video ranges reference our single local original recording. That is our design, not a claim about Arcade storage. Existing v1 projects migrate without a new opening clip, preserving still IDs, media, text, and the destinations reached after each old transition. Explicit branch targets remain explicit after migration; review them when rearranging steps. Rectangular areas, colors, multiple overlays, external destinations, and exact timing parity remain future work.

## Editor-focused follow-up

The signed-in editor's video timeline visibly shows a source-time ruler, a highlighted clip segment with two edge grips, transport controls, and a scissors-shaped control. The overlay toolbar exposes Hotspot, Callout, and Area. These are UI observations; trim/split semantics were not exercised on the original. The project Options menu exposed Duplicate; invoking it dismissed the menu but did not provide a confirmed copy or navigate to another project. No repeat duplicate request or step mutation was performed. Copy creation remains unconfirmed. This pass also directly observed the share dialog's HTML/React selector and an iframe HTML snippet; both embedding options are present in the product UI.

Our editor improvements are original implementation decisions: an undo history of up to 80 recent editing snapshots, draggable clip edges, split/duplicate, selected-step preview with return to the originating edit step, card placement/width, and an area hotspot style. History shares immutable media blobs and is cleared on project opening/reload. Multiple overlays per image and full parity with Arcade's editor remain unimplemented.
