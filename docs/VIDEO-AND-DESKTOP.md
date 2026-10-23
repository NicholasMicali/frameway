# Continuous video, still steps, and desktop capture

Updated 2026-10-21. Video between screenshots is part of the requested MVP, not an optional enhancement. This document replaces the initial screenshot-first assumption. The goal is an original implementation of Arcade's basic capture/edit/play behavior; these proposals are not claims about Arcade's source code.

## Recommended viewer behavior

`Still A + callout → viewer clicks hotspot → transition clip A–B → Still B + callout`

Record continuously while the author demonstrates the flow. Keep the original video, click markers, and extracted stills. During editing, represent clips as ranges into the recording rather than repeatedly cutting files. During playback, hold each still until its hotspot or Next button is activated, play the associated range, then display the next still and card. Back goes directly to the previous still; Restart returns to the first still. This is our proposed basic behavior to validate against Arcade later.

A click is a candidate boundary, not necessarily a finished step. A user may make several clicks while opening a menu or scrolling. The editor needs to merge/remove markers and correct a still frame and clip start/end. Reordering or branching can invalidate the visual continuity of a transition: require the author to replace/disable that transition, rather than playing unrelated footage.

## Browser implementation

Use a Manifest V3 extension with four responsibilities:

- Service worker: explicit Start/Stop, tab identity, lifecycle, recorder coordination.
- Offscreen document: own the MediaStream and MediaRecorder; persist encoded chunks and finalization state.
- Content script: capture clicks, viewport geometry, navigation/document identity, and timing metadata.
- Extension editor: load recordings, derive thumbnails/stills, edit overlays and clip ranges, preview/export.

Chrome documents obtaining a tab stream ID after a user gesture and passing it to an offscreen document from Chrome 116 onward. Recording in a content script ends on navigation; keeping media capture outside that script avoids this lifecycle problem. [Chrome capture guide](https://developer.chrome.com/docs/extensions/how-to/web-platform/screen-capture).

The tabCapture permission supplies media capture, while activeTab/scripting govern click-event access. These are separate capabilities: video may still be present while event collection becomes unavailable on navigation. Treat this as a visible state and pause the session on unsupported origins in the first version. A stream is pixels; it does not supply semantic mouse-click events. [tabCapture](https://developer.chrome.com/docs/extensions/reference/api/tabCapture), [activeTab](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab).

## Timing and frame selection

The important engineering experiment is synchronizing click events with encoded media. Do not equate message arrival time, MediaRecorder start time, or chunk number with the exact moment shown in a frame.

Proposed spike:

1. Record each event's local monotonic time, context time origin, document identity, and recorder receipt time. Establish and periodically check offsets between content and recorder clocks; retain uncertainty instead of assuming one zero point survives navigation.
2. Retain source media timestamps and a mapping to the capture timeline. Make pauses/resumes explicit discontinuities, or initially omit capture-pause and use edit-time trimming.
3. After recording finalizes, decode near each candidate boundary and pick the last suitable pre-action frame. Preserve the candidate timestamp and permit the user to scrub/correct it. A small live frame buffer is optional; do not keep an unbounded sequence of raw full-resolution frames in memory.
4. Use a dummy page with a visual counter and scripted visible changes to measure alignment under navigation and CPU load. Target no wrong-state stills in the supported test flow; report measured timing error, not an assumed fixed offset.

MediaRecorder chunks are storage deliveries, not automatically independent video clips. The recording specification permits individual blobs to be unplayable while requiring the completed combination to be playable. Query MIME support and retain the actual codec/container. Reassemble in order and validate duration and seeking before generating steps. [W3C MediaStream Recording](https://www.w3.org/TR/mediastream-recording/).

For initial playback, seek the original video to a range's start, wait for frame readiness, play, then stop and show the destination still. Handle seek latency and buffering explicitly. At short ranges, browser scheduling may overshoot an endpoint; a still overlay can prevent showing later content. Frame-accurate standalone clips may require decoding/re-encoding or remuxing with keyframe-aware boundaries. That is a separate export concern, not a reason to destructively cut files in the editor.

## Minimal editor additions

Keep the existing step strip, main preview, and callout properties panel. Add a small per-transition scrubber with start/end handles, a “Choose still frame” action, and “Skip transition.” A multitrack video editor is unnecessary. Cards and hotspots should remain editable separately from their original click markers.

Store a recording asset plus steps and transitions:

```text
recording: id, blob references, mimeType, duration, dimensions, clock mapping
click: id, documentId, eventTime, mappedMediaTime, x/y, viewport, uncertainty
step: id, stillAssetId, sourceRecordingId, stillTime, overlays[]
transition: id, fromStepId, toStepId, recordingId, inTime, outTime
```

Validate bounds, missing assets, and target IDs. Project export should be an archive containing a versioned JSON manifest and binary media files, not base64 video inside JSON. IndexedDB can hold the local blobs. Check quota and handle storage failure without marking a recording saved. Persist chunks incrementally, then mark the recording finalized only after the final data and stop event. Interrupted recordings need an explicit recovery/failure state.

For scale planning only: a configured 5 Mbps stream is about 37.5 MB/minute before container overhead, or 375 MB for ten minutes. Actual bitrate and quality must be measured. Start with short recordings, text-legibility checks, and a configurable resolution rather than assuming 1080p is enough for every UI. Microphone/system audio are deferred; if enabled later, define pause, autoplay, and audio-routing behavior explicitly.

## Browser versus desktop

| Option                        | Captures                                  | Click markers                                            | Recommended use                                                  |
| ----------------------------- | ----------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------- |
| Chrome extension              | Selected browser tab video                | Content-script events in permitted frames                | First implementation                                             |
| Browser screen/window sharing | User-selected window/display pixels       | No general cross-app click event feed                    | Manual markers/import, not automatic desktop walkthrough capture |
| macOS capture helper          | Selected screen/window via native capture | Separate native event listener and coordinate conversion | Second capture adapter if desktop apps are required              |

Arcade documents desktop screen/window/area recording followed by browser upload and editing. This supports reusing one editor for multiple capture front ends, but does not establish how Arcade implements them. [Arcade desktop](https://www.arcade.software/download).

For our macOS option, investigate ScreenCaptureKit for video and a passive Core Graphics event tap for mouse events. Account for screen-recording consent and the event listener's permission requirements on the chosen OS version. Window movement, display scaling, crop bounds, and multiple monitors require timestamped coordinate transforms. A browser-only recorder does not solve those problems. [Apple screen-capture sample](https://developer.apple.com/documentation/screencapturekit/capturing-screen-content-in-macos), [passive event taps](https://developer.apple.com/documentation/coregraphics/cgeventtapoptions/listenonly).

Keep the macOS helper separate from the shared web editor. It should export the same recording/marker manifest. Do not choose Electron solely because Arcade has a desktop app; its actual runtime is unknown. A native Swift helper is one candidate, pending capture and permission tests. Windows/mobile capture are separate future projects.

## How REA helps inspect the desktop app

After the app is available, identify its actual installed directory and version. Run the pinned REA CLI against that path:

```sh
npx -y rea-agents@6.7.0 inspect-desktop-application /actual/path/to/Arcade.app --detail complete --json
```

The directory inspector reads metadata and headers without executing the app or requiring a decompiler. Use the result to choose a next step: JavaScript/ASAR analysis if evidence supports that runtime, or targeted native analysis if needed. Do not install a native provider before identifying a question that requires it. [REA desktop inspection](https://github.com/morluto/rea/blob/d2015e94f32a51b898918b5b39b374c134119fd5/docs/desktop-applications.md).

Compare a short identical capture in the extension and desktop app: click coordinates, media segmentation, scroll treatment, still selection, and editor handoff. REA can help locate browser-visible data shapes and runtime candidates; backend code and inaccessible implementation details remain unknown.

## Verification gates

Before building a polished editor, prove: continuous video survives supported navigation; every click marker has a usable timeline mapping; chosen stills show the intended state; rapid clicks remain distinguishable; resizing/zoom does not misplace overlays; and a completed recording survives reload.

Then prove a ten-step flow with video transitions, manual boundary correction, delete/reorder, Next/Back/Restart, and export/import. Include delayed chunk delivery, source-tab close, user stop-sharing, full-disk/quota failure, and a worker restart. Stop calling the spike complete if only the happy-path recording works.

## Current evidence status

Public documentation and npm publication were verified. No Arcade credentials, authenticated session, installed desktop binary, or live recording were inspected. The initial research preceded implementation. A working browser recorder/editor prototype now exists; see [verification](VERIFICATION.md). Authenticated Arcade and desktop inspection remain future work.
