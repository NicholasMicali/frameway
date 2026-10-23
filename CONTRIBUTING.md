# Contributing to Frameway

Frameway is a local tool for recording, editing, and exporting interactive walkthroughs. Bug reports, Windows testing, documentation, accessibility fixes, and focused code contributions are welcome. Read our [project scope](docs/PROJECT-POLICY.md) and [code of conduct](CODE_OF_CONDUCT.md) first.

## Run locally

Install Node.js 24 and Git. These commands work in macOS/Linux terminals and Windows PowerShell:

```sh
git clone https://github.com/NicholasMicali/frameway.git
cd frameway
npm ci
npm run build
npm run dev
```

Load `dist/` using Chrome's **Load unpacked** at `chrome://extensions` to test automatic tab video/click capture. For the website editor, open the localhost URL printed by Vite. After rebuilding, reload the extension and reopen its editor. The extension and localhost have separate project libraries; export/import project backups to transfer work. Back up projects before moving an extension installation.

See [architecture](docs/ARCHITECTURE.md) for the code map and [tester guide](docs/BETA-TESTING.md) for a complete workflow.

## Branch and review workflow

- Start from updated `main`. Use short-lived `feat/<topic>`, `fix/<topic>`, `docs/<topic>`, `chore/<topic>`, or `refactor/<topic>` branches. External contributors fork first; maintainers and coding agents also work through PRs.
- Keep one purpose per PR. Separate formatting-only commits from functional changes. Open a draft PR early for substantial work.
- Describe the problem, resulting behavior, and validation. Include sanitized before/after screenshots for UI changes.
- The maintainer reviews external contributions. Merge only after applicable CI passes; use squash merges and delete merged branches. Do not force-push or delete `main`, or move published release tags.
- We do not use a permanent `develop` branch. Releases come from tested commits on `main` and require an explicit maintainer release decision.
- Mandatory independent approval should be enabled once a second active maintainer exists; the sole maintainer must still use PRs and checks for their own changes.

These are contributor rules. GitHub enforcement settings are managed separately; this document does not claim branch protection is enabled.

Discuss changes to capture permissions, project schema, runtime networking, dependencies, or product scope in an issue before implementation. Small fixes can go straight to a PR. Feature requests should explain the real workflow and existing workaround.

## Validate changes

```sh
npm run format:check
npm run lint
npm run build
npm test
npx playwright install chromium
npm run test:browser
```

Run `npm run format` to format source and documentation before committing. Prettier and ESLint versions are pinned. Lint targets likely bugs; TypeScript checks run as part of the build. Keep format-only changes separate from behavior changes.

CI checks build, extension packaging, and model tests on Windows, macOS, and Linux. Formatting/lint and full Chromium workflows run on Linux; the stable `check` job requires every job to succeed. The offline test uses the built app, a synthetic screen stream, and an offline browser context after initial loading. It does not automate an OS picker or enterprise policy approval.

On Linux, Playwright may need system dependencies: `npx playwright install --with-deps chromium`. Tests generate synthetic content and put results in ignored `test-results/`. Browser tests use local ports 4173–4183; stop conflicting servers before running them. Native recording/Chrome toolbar actions and enterprise policy restrictions still need manual testing.

For an extension change, also run `npm run package:extension`, extract the ZIP, and verify the real recording flow. Test both editor preview and standalone exports when rendering behavior changes. Add meaningful tests for fixes; do not add tests that merely repeat implementation details.

## Data and compatibility

- Preserve import compatibility with existing project backups. Validate new fields and test export/import roundtrips; use migrations for incompatible schema changes.
- Core recording, editing, and export must remain usable offline after installation. Do not introduce accounts, backend dependencies, cloud sync, telemetry, or remote assets required at runtime.
- Keep personal recordings, browser profiles, credentials, and enterprise data out of commits and public issues. Use ignored `recordings/` or `exports/` for local artifacts.
- Use original or appropriately licensed code/assets. Explain new dependencies and preserve their notices.

Contributions are provided under [Apache-2.0](LICENSE), including its contribution terms, unless explicitly stated otherwise. Submit only material you are entitled to contribute. Your recordings, screenshots, and company logos remain your content; they are not relicensed by using Frameway.

For suspected vulnerabilities, follow [SECURITY.md](SECURITY.md) rather than opening a public issue. For ordinary feedback, use the issue forms. Current work is tracked in [TODO.md](TODO.md).
