# Frameway 0.5 launch artwork

Eight editable HTML/CSS layouts now use the supplied **CRM Training** example and freshly captured Frameway 0.5.0 UI. All placeholder panels, older UI references, and draft labels have been removed after visual review. This is one real example reused across the set, not three separately completed projects. No release-availability claim is made.

Open `contact-sheet.html` or `contact-sheet.png` for the overview. `renders/` contains eight full-size opaque RGB PNGs and eight `@half.png` readability proofs.

| File stem        | Size       | Content                                                             |
| ---------------- | ---------- | ------------------------------------------------------------------- |
| `01-walkthrough` | 1280 × 800 | CRM pipeline with the original Welcome callout                      |
| `02-capture`     | 1280 × 800 | Current tab-recording guidance and the actual CRM step sequence     |
| `03-edit`        | 1280 × 800 | Selected CRM image step and a close-up of the real image inspector  |
| `04-share`       | 1280 × 800 | Current Share dialog, tightly cropped, with concise format captions |
| `05-local`       | 1280 × 800 | Local Library with the supplied CRM Training project                |
| `06-promo`       | 440 × 280  | Brand-led small promo tile                                          |
| `07-marquee`     | 1400 × 560 | Optional marquee with the real walkthrough                          |
| `08-social`      | 1200 × 630 | Reusable social composition with the real walkthrough               |

Square outer corners and opaque RGB output are preserved. Sizes follow the supplied launch brief; verify the final Store dashboard before uploading.

## Edit and render

- `layouts.mjs`: copy, capture filenames, dimensions, and compositions.
- `styles.css`: blue/teal/amber palette, bundled fonts, spacing, and crop positioning.
- `index.html`: editable gallery; `?asset=03-edit` selects an individual artboard.
- `captures/`: seven current UI stills used by the layouts. These are necessary source assets, not backups.
- `capture.mjs`: optional recipe to regenerate those stills from the approved backup.
- `capture-provenance.json`: source ZIP checksum, extension/browser versions, and precise crop rectangles.
- `render.mjs`: generates all PNGs, the contact sheet, and `render-checks.json`.

From the repository root, use Node.js 24 and the repository's locked dependencies:

```sh
npm ci
npx playwright install chromium
node docs/assets/launch-0.5/render.mjs
```

With dependencies and Chromium already installed, only the last command is needed. Set `PLAYWRIGHT_BROWSERS_PATH` if using a custom existing browser cache. The renderer serves only the local repository at an ephemeral `127.0.0.1` port and uses a fresh headless browser. It does not run the extension, access the owner's Chrome profile, or require the private backup. Both scripts resolve paths relative to their own location and can be invoked from another directory.

The renderer checks exact dimensions, opaque 24-bit RGB PNG output, image/font loading, text overflow, absence of draft/placeholder labels, current capture sources, and zero external asset requests. It overwrites the generated proofs and reports. Review full and half-size images after changing copy, media, or crops. Rasterization can vary across browser/OS versions.

For interactive editing, serve the repository root with a static HTTP server and open `/docs/assets/launch-0.5/index.html`. ES modules require HTTP. The generated contact sheet can also be opened directly as a file.

## Regenerate current UI captures

The input is the owner-supplied `CRM Training.frameway.zip`. It stays outside this folder and outside Git. The capture script imports it through the real extension's standard import control in a disposable local Chromium profile. It does not change the source archive, edit the project, contact external services, or touch the owner's existing Chrome library.

```sh
npm run build
node docs/assets/launch-0.5/capture.mjs "/path/to/CRM Training.frameway.zip"
node docs/assets/launch-0.5/render.mjs
```

The build creates ignored `dist/` output without changing application source. The temporary profile is removed at completion. The source hash in `capture-provenance.json` identifies the exact backup used; no private path or recording bytes are included in the report. The recipe checks the project title and Frameway 0.5.0 version before capture.

Screenshot 2 uses the actual Library's tab-recording guidance rather than a toolbar popup. Direct browser authentication and native capture were unreliable in this session, and opening a popup as an ordinary extension page does not reproduce the toolbar's active-tab grant. No recording or permission-success state is simulated.

The editor composition combines two clearly separated crops from the same selected image step: the stage and its inspector. The Share screenshot includes the complete actual dialog, including format controls and the export-content notice. The Library crop contains one genuine project. The marquee and social image reuse the real Welcome step; they do not imply separate examples for each use case. Project text, colors, and controls are unchanged. Crops preserve image proportions; no UI is redrawn.

## Review and scope

Full-size and half-size proofs were inspected for headline fit, control readability, clipping, image quality, and obsolete labels. The supplied example is used as requested. Its CRM content and branding remain the owner's material; this review is not independent verification of third-party rights or a Store-publication approval. No customer relationship or endorsement is claimed by the campaign copy.

Only `docs/assets/launch-0.5/` contains deliverable changes. Application source, dependencies, permissions, release metadata, existing assets, and font binaries remain unchanged. No ZIP backup, source recording, or viewer HTML is copied here. Nothing is published or committed by these scripts.

See [asset notices](ASSET-NOTICES.md), the [launch brief](../../LAUNCH-0.5.md), and [Store readiness](../../STORE-READINESS.md).
