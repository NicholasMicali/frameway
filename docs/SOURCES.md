# Sources and evidence status

Researched 2026-10-21. Use primary sources; Arcade Software is distinct from the unrelated arcade.dev tool platform.

| Source | What it supports |
| --- | --- |
| [REA repository](https://github.com/morluto/rea) | Product purpose and official package identity |
| [Pinned REA installation](https://github.com/morluto/rea/blob/d2015e94f32a51b898918b5b39b374c134119fd5/docs/installation.md) | Setup flags, personal scope, restart, workflow skill, backups |
| [Pinned browser observation](https://github.com/morluto/rea/blob/d2015e94f32a51b898918b5b39b374c134119fd5/docs/browser-observation.md) | CDP workflow, passive observation, bundle analysis, command syntax |
| [Pinned package metadata](https://github.com/morluto/rea/blob/d2015e94f32a51b898918b5b39b374c134119fd5/package.json) | Version 6.7.0 and supported Node engines |
| [Arcade knowledge-base index](https://docs.arcade.software/kb/llms.txt) | Recording/editing/hotspot/branching documentation taxonomy |
| [Arcade changelog](https://www.arcade.software/changelog) | Point and area hotspots, rich text and editing features |
| [Arcade historical changelog](https://www.arcade.software/changelog?c12c51b9_page=5&c9671a93_page=6) | Editable text/targets and behavior when steps are deleted |
| [Arcade desktop](https://www.arcade.software/download) | Desktop recording exists and hands off to browser editing |
| [Chrome Tabs API](https://developer.chrome.com/docs/extensions/reference/api/tabs) | Screenshot API, active-tab capture, rate limit |
| [Chrome activeTab](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab) | Temporary permission, origin changes, restricted injection |
| [Official Codex skills docs](https://learn.chatgpt.com/docs/build-skills) | Repo-scoped skill discovery versus plugin distribution |

The upstream repository was cloned and its installation, browser observation, client configuration, README, and package metadata inspected locally. No upstream code was executed. Direct Arcade detailed recording/editing articles failed to load through the research tool; the index and public changelog were available. No logged-in editor, extension internals, network capture, or runtime implementation was inspected. Consequently the architecture and schedule in this brief are proposals, not reverse-engineered facts.

## Follow-up: video and Codex integration

The npm registry returned `rea-agents@6.7.0`, engine range `^22.19.0 || ^24.11.0 || >=26.0.0`, and binaries `rea` / `rea-agents` pointing to `scripts/rea.mjs`. Registry query only; installation and execution remain untested.

New primary sources are linked at the relevant claims in [video/desktop research](VIDEO-AND-DESKTOP.md) and [setup](SETUP.md): Chrome offscreen/tabCapture guide, W3C MediaStream Recording, Apple's capture sample and passive event-tap API, and official Codex project-scoped MCP documentation. The W3C recording page is a working draft; verify behavior in the target Chrome version. Apple documentation's Markdown endpoints failed in the research tool; indexed official sample/API content was available.

Implementation update: project-local REA 6.7.0 and Node 24.22.0 are installed, browser discovery was executed against the local practice app, and a recorder/editor prototype was built and tested. See [verification](VERIFICATION.md). Earlier source-inspection statements describe the initial research phase.
