# Privacy and local storage

Frameway's core recorder, editor, and standalone player do not require an account, backend, analytics service, or cloud project storage. Installed recording/editing/export workflows run locally. The websites you record may make their own network requests; Frameway does not control those websites.

## What is stored

Video, screenshots, click positions/timestamps, titles, callouts, branding, and editing settings are stored in your browser's IndexedDB. The extension and localhost editor have separate libraries. Browser data is not a durable backup: clearing browser storage, removing an extension, or changing an installation can make projects unavailable. Export project backups before those actions.

Projects are not written into this Git repository. Save downloaded artifacts outside the checkout or in ignored `exports/` and `recordings/` directories. Do not commit enterprise data, credentials, or personal recordings.

## Permissions

The extension requests `activeTab` for the tab you activate it on, `scripting` to install click capture, `tabCapture` to record that tab, `offscreen` for the recording context, and `storage` for local extension coordination/status. The manual recorder uses the browser's screen-sharing picker. Both paths currently record silent video.

## Sharing and export

Exporting creates a file on your computer; you decide how and with whom to share it. Anyone receiving a walkthrough may extract its screenshots and recording. **Trimming changes playback ranges, not the underlying media: exported walkthroughs retain the original recording.** Review the full recording for sensitive information before sharing. Uploaded logos are embedded in title slides and exported artifacts.

The embedded player does not send data to Frameway. If you host an export elsewhere, that host's logging and privacy practices apply. GitHub and any future extension store handle software distribution under their own policies; that does not upload your walkthroughs.

Report security concerns through [SECURITY.md](SECURITY.md). Public issue reports should contain only sanitized reproduction material.
