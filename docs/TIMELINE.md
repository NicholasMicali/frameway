# Finding and trimming a clip

**Fit selected clip** centers the selection with room around both edges. **Show full video** resets zoom. Zoom buttons center on the current playhead; **Show playhead** brings that position back after horizontal scrolling. The orange line marks the current position.

Click or drag the track to seek. Drag a trim handle to change the clip boundaries; the existing numeric start/end inputs remain available for exact time entry. With a handle focused, arrows move by 0.05 seconds, Shift+arrow by 0.5 seconds, and Home/End move to the allowed recording boundary. Start, end, duration, and playhead times stay together above the ruler. Zoom and scroll never alter the clip.

Zoom is bounded at 4096× for short clips in longer recordings. These are time-based edits, not frame-exact edits. Trimming is playback metadata: exports still include the original source recording. This does not implement destructive trimming or redaction.
