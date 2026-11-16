# Pause and resume tab recording

Reload the unpacked extension from `dist/` in chrome://extensions while no recording is active. Record a normal web tab, reopen the extension menu, and choose **Pause recording**. The badge switches to a pause indicator after acknowledgement. Reopen the menu and choose **Resume recording** to continue the same recording, or **Finish recording** to save and open the editor.

Paused time and clicks are excluded. Chrome may continue showing its sharing indicator because the capture stream remains open. This is not a privacy/redaction guarantee around the transition; wait for the paused state before preparing the next screen. Resuming naturally joins two different screen states with a cut. Finish ends the recording; appending a later session is not implemented. The existing shortcut opens the menu; no new shortcut or permission was added.

The existing same-origin policy remains: changing the captured tab to another origin ends capture, including while paused. Closing the captured tab or ending sharing also finishes from the paused state. Switching to a different tab does not switch the recording source.

## Manual validation

- Record a click, pause, interact with the page, resume, and record another click. Only the active clicks should create screenshot steps, with the expected frames.
- Repeat multiple pauses, including a longer wait. Preview and exported HTML should contain no long frozen gap, and clip duration should exclude waits.
- Finish while paused. Verify the result opens once and retains the active footage.
- Close the recorded tab or end sharing while paused; verify the saved result and explanation.
- Try a same-origin reload and a cross-origin navigation while paused. Verify the pause state remains accurate or capture ends with the existing explanation.
- Check Windows and macOS Chrome, especially clicks immediately after resuming. Synthetic Chromium tests are not a substitute for native tabCapture checks.

Automated coverage uses a real MediaRecorder with synthetic canvas frames, checks decoded playback frame timestamps and delayed paused clicks, and separately tests popup/worker state transitions. No real recordings are included.

The maintainer reported successful local extension testing before requesting a PR. The individual cases above and both operating systems have not all been independently verified.
