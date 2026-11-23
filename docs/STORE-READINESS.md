# Chrome Web Store listing and release materials

Frameway v0.4.0 is published on [Chrome Web Store](https://chromewebstore.google.com/detail/dpfkfbpolahiofedbdebdjmpjfphkjge). Version 0.5.0 is being prepared for public listing and is not yet published. Use this document for listing maintenance and future release checks; native-device tests remain release-specific.

## Listing draft for 0.5.0

**Name:** Frameway · Walkthrough recorder

**Short description:** Turn websites, apps, and screen recordings into local interactive walkthroughs. Edit, share, and embed without an account.

**Single purpose:** Create and edit local interactive walkthroughs from user-selected screen recordings, then export them for viewing or embedding.

**Description:**

Turn what's on your screen into a walkthrough. Frameway helps you explain a process, onboard colleagues, document a workflow, or demonstrate a product.

Record a Chrome tab for automatic click-by-click screenshot and video steps. For desktop apps or a whole screen, open the Library and choose Record my screen, then mark screenshot moments or add them in the editor. The browser picker controls which surfaces are available. Screen capture is silent; optional background music can be added when editing.

Edit screenshot and video steps, trim playback, add animated hotspots, arrows, cards and highlights, and organize chapters. Customize your logo, colors, bundled fonts and presentation frame. Add a soundtrack from the built-in music library or upload your own audio. Include an optional title and closing slide.

Share a standalone interactive HTML file, export a video, or embed the walkthrough on your own website. Send an editable project file to a teammate so they can import it into Frameway and make their own changes. Viewers do not need Frameway to open the HTML export. Project files are separate copies, not live collaboration.

Frameway runs locally: no account, application backend, cloud project storage, or analytics. Projects stay in this browser profile until you export them. Keep editable backups before uninstalling or changing installations. Playback trims do not remove the original recording from interactive HTML, embed packages, or editable project files; review the complete recording before sharing.

Chrome may restrict capture on protected or browser-internal pages. Automatic click capture covers the recorded tab's top frame. Frameway does not automatically detect clicks in desktop applications. Frameway is not a hosting service.

## Links and assets

- Homepage/source: https://github.com/NicholasMicali/frameway
- Support: https://github.com/NicholasMicali/frameway/issues
- Privacy: https://github.com/NicholasMicali/frameway/blob/main/PRIVACY.md.
- Icon: `extension/icons/frameway-128.png` (96px artwork with 16px transparent padding); smaller toolbar sizes are included in the package.
- Sanitized screenshots: `docs/assets/store/` (generated synthetic project, no private content).
- Package/checksum: `release/frameway-extension-v0.5.0.zip` and `.zip.sha256`, generated locally, not committed.

Use the final dashboard's asset requirements when uploading; preview all images there. Use the published Store link above in installation guidance.

## Permission justifications

| Permission | Why Frameway needs it                                                                                                    |
| ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| activeTab  | User-initiated access to the current tab for recording and click capture; no persistent access to all websites.          |
| scripting  | Inject the click listener into the tab selected by the user so recorded clicks can become steps.                         |
| tabCapture | Capture silent video of the selected Chrome tab after the user starts recording.                                         |
| offscreen  | Keep the MediaRecorder and local recording processing in an offscreen extension document while the popup is closed.      |
| storage    | Store recording coordination/status locally so the popup and recorder can share state. Projects and media use IndexedDB. |

No host permissions, remote code, telemetry, or new permissions were added. JavaScript, styles, and fonts required by the app are bundled or system-provided. User-selected external links and the websites being recorded can make their own requests.

## Privacy dashboard preparation

Use the current dashboard definitions and review the final certifications before submission. Do not equate “no upload” with “no access to user data.” Frameway locally processes website/screen content, clicks and timestamps, user-written text, uploaded branding, and uploaded background music. Screen content can include personal or sensitive information. It does not read browsing history or collect credentials as a separate feature.

Declare the locally processed content/activity accurately under the applicable dashboard categories, explain that it is stored locally and exported only on user request, and use the linked privacy policy consistently. No data is sold or used for advertising, creditworthiness, or unrelated purposes. No remote code is used. The owner must confirm the dashboard certifications against the final uploaded package.

## Install, migrate, and update

**First Store installation:** open the Store link above, add to Chrome, pin Frameway, and choose Open library or Record this tab. An unlisted item can be installed by anyone with its link; it still undergoes normal Store review.

**Unpacked → Store:** in the old extension, open each important project and use Share → Download project. Save the `.frameway.zip` files outside the extension folder. Install the Store version, open its Library, choose Options → Import projects, and verify the projects. Only then remove the old installation. HTML exports cannot restore editable projects. Different extension identities do not automatically share a library.

**Normal Store update:** Chrome manages updates for the same installed extension identity. Reopen the editor after an update; no manual folder replacement is needed. Browser storage normally remains, but backups are still essential.

**Unpacked/source users:** continue using the README instructions. To update, back up first, replace the same folder's files, click Reload at `chrome://extensions`, and reopen Frameway. Removing the extension or switching profiles can lose local data.

## Local candidate validation

The packaged extension was loaded into a disposable Chromium profile, imported a generated backup, saved a closing-slide edit, and retained the project after a version change in the same extension folder/profile. The extension identity remained stable. This verifies local same-identity storage behavior, not Chrome Web Store delivery. The editor made no HTTP(S) requests during that isolated workflow. Run `node tests/extension-update.mjs` after building to repeat this check.

Run `node scripts/store-screenshots.mjs` with Playwright Chromium installed to regenerate the sanitized screenshots.

## Submission gates

- [ ] Required CI green on the final PR stack and merged main.
- [ ] Maintainer approves the UI and closing slide in a packaged installation.
- [ ] Native tab capture, pause/resume/finish, and screen/window picker checked on macOS and Windows with the candidate. Automated tests do not prove OS picker or managed-device behavior.
- [ ] Final ZIP built from merged main; version, checksum, license notices, and package contents verified.
- [ ] Owner reviews Store privacy fields, screenshots, support details, account verification, regions, and the intended **Public** visibility for 0.5.0.
- [ ] Explicit owner green light to submit/publish. No automatic Store upload workflow is configured.
- [ ] After approval, verify real Store installation, backup/import migration, and a subsequent same-item update; then update the published-version references in the README and release guide.

## Official references

- [Store image guidance](https://developer.chrome.com/docs/webstore/images)
- [Distribution and unlisted visibility](https://developer.chrome.com/docs/webstore/cws-dashboard-distribution)
- [Privacy fields and permission justifications](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy)

Copy refreshed November 23, 2026. Store policy and dashboard details can change; verify at submission.
