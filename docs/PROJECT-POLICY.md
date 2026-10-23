# Project scope and governance

Frameway is a local tool, not a managed service. Core recording, editing, and export work without a Frameway account or backend. Recordings stay in the user's browser until the user explicitly exports or shares them.

## In scope

- Local browser recording, editing, storage, project backups, and portable interactive exports.
- Better accessibility, capture reliability, editing precision, privacy, and Windows/macOS/Linux compatibility.
- User-controlled branding and embedding an exported walkthrough on the user's own website or static server.
- Distribution of software through GitHub releases and potentially extension stores. Downloading/installing updates does not require sending recording data anywhere.

## Outside the official project direction

- Managed walkthrough hosting, cloud project storage/sync, accounts, subscriptions, and telemetry.
- Remote services or remotely loaded assets required for core recording, editing, playback, or export.

A localhost development server is not a hosted product. A contributor may use network tools during development, but must not make the installed core workflow depend on them.

## Maintainers and decisions

[NicholasMicali](https://github.com/NicholasMicali) maintains scope, reviews contributions, and decides when to publish releases. Contributors retain ownership of their contributions under Apache-2.0. Significant changes to permissions, dependencies, storage compatibility, or architecture require an issue/design discussion. Maintainer decisions should explain the user benefit and compatibility implications.

Branching and review rules are in [CONTRIBUTING.md](../CONTRIBUTING.md). Additional maintainers can be invited as the contributor community grows. There is no formal voting process or separate contributor agreement at this stage.

These boundaries govern what this project accepts and maintains. They are not additional license restrictions: Apache-2.0 permits others to make forks, including commercial or hosted products. The license does not generally grant use of project trademarks. See the [license](../LICENSE) for the actual terms.
