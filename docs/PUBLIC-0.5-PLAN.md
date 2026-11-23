# Public 0.5 release preparation

The maintainer intends 0.5.0 to be the first publicly listed Chrome Web Store release. Public visibility does not require calling the product 1.0. Publish only after final review and explicit approval; keep the existing extension identity and local-only architecture.

## Current release

- Merge the presentation-frame, music, output-consistency, and sharing-convenience PRs in dependency order after CI passes.
- Fix timeline ruler overflow and verify narrow layouts, fit/full-video controls, and trim preservation.
- In Share, show the generated filename and actual file size and offer copyable recipient instructions. Clipboard denial must leave selectable instructions visible. A download starting is not proof of delivery or a retained backup.
- Keep existing project appearance controls: logo, colors, typography, title layout, and presentation frame. No additional brand-kit storage/schema work in this release.
- Run a focused UI pass before publishing: narrow layouts, spacing, dropdowns, dialogs, keyboard focus, and consistent terminology.
- Prepare consistent branding for the Chrome Web Store, GitHub README, and optional media posts. Use synthetic demo content and retain required music attribution. Review the listing/privacy text against the shipped features and permissions.
- Validate the packaged extension as an update, older saved projects, recording/pause/resume, and recipient-side HTML, video, and editable-project import including uploaded music on Windows/macOS.
- Publish 0.5.0 only after review of the final package and main CI. Do not bump versions or upload a store package during this preparation pass.

## Sharing follow-up (#27)

Filename, size, and copying instructions are the bounded increment for 0.5. Keep viewer HTML, editable .frameway.zip, and website-embed ZIP distinct. Do not introduce a hosting URL, messaging integration, or another Share redesign. Only consider an HTML-plus-README transport ZIP if testers report delivery confusion.

## Reusable brand kits (#12)

Per-project branding already exists. Reusability is a separate feature, split into two increments:

1. **Named local presets:** save supported appearance settings and a bounded logo; select, rename, and delete kits; explicitly apply a snapshot with undo and a preview. Applying a kit must not replace the project's text, recordings, music, slide content, or navigation. Later kit edits/deletion must not mutate projects that used it.
2. **Portable kits:** import/export a versioned, strictly validated .frameway-brand.json file containing only allowlisted styling and logo data. Reject malformed/oversized files and unsupported versions. Handle duplicate names explicitly. Verify offline HTML/embed/video appearance and existing-project compatibility.

Decide the exact settings allowlist before implementation. Suggested first scope: theme, font/size choices, card/button shape, title layout/logo size, and presentation-frame styling. Title/closing text defaults remain optional future work rather than risking accidental company/project text reuse. Exclude remote fonts, arbitrary CSS, accounts, cloud libraries, recordings, and implicit watermarks.
