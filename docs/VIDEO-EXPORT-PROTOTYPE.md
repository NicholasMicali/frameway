# Local video export

Try Share → Export video in the local editor. Nothing is uploaded and no capture permission is needed. The browser records a locally composed canvas, preferring MP4 when its encoder supports it and otherwise offering WebM. Exports are silent by default. Optional project background music is mixed locally into the video with short fades; see [background music](BACKGROUND-MUSIC.md). Original captured audio and voiceover are not included.

Every slide appears once in library order, including title and closing slides. Explicit navigation targets are ignored, so branches and loops cannot hang the export. Still slides default to five seconds; export-only overrides support 1–60 seconds per slide. Video slides use their existing trim ranges regardless of autoplay. The editable project is not changed. All context cards are expanded because viewers cannot click them in a video.

Rendering is approximately real time with a progress preview and cancel control. Keep the tab visible: backgrounding stops the export with a retry message instead of silently making an incomplete recording. Media resources are released on completion, cancellation, or failure. This prototype caps duration at 30 minutes and output at 512 MB. 720p/1080p choices preserve the recording's aspect ratio within the corresponding frame bounds.

The canvas compositor shares theme data and area-zoom geometry but is separate from the HTML player. It includes title/closing composition, branding, basic bold/italic text, highlights, zoom in/out, hotspots, extra cards, and animated arrows. Text wrapping and sizing are not yet pixel-identical to HTML playback. Tall text blocks fail with an actionable message rather than clipping silently. Overlapping cards retain their authored positions; review the preview and adjust placement if necessary. Video itself is not a redaction tool.

Before a release: visually compare real walkthroughs, test downloaded MP4/WebM in Windows and macOS players, review longer recordings and large text, and decide whether closer renderer parity is needed. Existing HTML/embed/project exports still include original source media. The new video contains only rendered frames from the selected trim ranges.

Implementation: `src/video-export.ts` owns the canvas compositor/encoder; `src/VideoExport.tsx` owns export-only controls. The implementation uses browser-native Canvas capture and MediaRecorder without adding packages or extension permissions.

References: [Canvas captureStream](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/captureStream) and [Chrome MediaRecorder guidance](https://developer.chrome.com/blog/mediarecorder).
