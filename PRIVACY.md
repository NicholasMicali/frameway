# Privacy and local storage

Frameway's core recorder, editor, and standalone player do not require an account, backend, analytics service, or cloud project storage. Installed recording/editing/export workflows run locally. The websites you record may make their own network requests; Frameway does not control those websites.

## What is stored

Video, screenshots, click positions/timestamps, titles, callouts, branding, uploaded background music, and editing settings are stored in your browser's IndexedDB. The extension and localhost editor have separate libraries. Browser data is not a durable backup: clearing browser storage, removing an extension, or changing an installation can make projects unavailable. Export project backups before those actions.

Projects are not written into this Git repository. Save downloaded artifacts outside the checkout or in ignored `exports/` and `recordings/` directories. Do not commit enterprise data, credentials, or personal recordings.

## Permissions

The extension requests `activeTab` for the tab you activate it on, `scripting` to install click capture, `tabCapture` to record that tab, `offscreen` for the recording context, and `storage` for local extension coordination/status. The manual recorder uses the browser's screen-sharing picker. Both paths currently record silent video.

## Sharing and export

Exporting creates a file on your computer; you decide how and with whom to share it. Anyone receiving a walkthrough may extract its screenshots and recording. **Trimming changes playback ranges, not the underlying media: exported walkthroughs retain the original recording.** Review the full recording for sensitive information before sharing. Uploaded logos are embedded in title/closing slides and exported artifacts. Selected background music is included in playable exports; editable project files retain uploaded audio so recipients can continue editing. Bundled music and fonts load from the installed package, not remote services.

The embedded player does not send data to Frameway. If you host an export elsewhere, that host's logging and privacy practices apply. GitHub and the Chrome Web Store handle software distribution under their own policies; that does not upload your walkthroughs.

Report security concerns through [SECURITY.md](SECURITY.md). Public issue reports should contain only sanitized reproduction material.

## Installation identity and updates

Projects belong to the current browser profile and extension installation. An unpacked extension, a Store installation, and the localhost editor can have separate libraries. Export editable `.frameway.zip` backups from the old installation, then import them into the new one before removing anything.

Normal updates of the same extension identity retain browser storage. Uninstalling, clearing data, changing profiles, or moving to a different extension identity can remove access to it. Keep backups outside the extension folder.

Frameway does not sell, transmit to its developers, or use recorded content for advertising, analytics, or model training. Recording starts only after a user action. A recording can contain anything visible in the selected surface, including personal or confidential data. Users control recording, deletion, and export. Data remains local until users choose to share exported files. Public help links open GitHub; GitHub's policies apply to those visits.
