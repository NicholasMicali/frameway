# REA + Codex setup

The setup alternatives below were researched first. Node and REA are now installed project-locally; see the implementation update at the end. Global Codex registration has not been applied. The upstream clone is available in `tools/rea/`. Inspected commit: `d2015e94f32a51b898918b5b39b374c134119fd5`, package 6.7.0.

## 1. Use supported Node

REA declares Node `^22.19.0 || ^24.11.0 || >=26.0.0`. Current default here is v23.10.0. Use Node 24.11 or newer within the 24.x line. `.nvmrc` selects 24 if you already use nvm:

```sh
nvm install
nvm use
node --version
```

Alternatively install a supported Node through your existing package manager. A shell's Node selection does not necessarily affect the Codex desktop app: verify the MCP process resolves a supported Node/npm too. Prefer an absolute supported executable/shim in the MCP entry if the desktop PATH still resolves Node 23.

## 2. Choose integration scope

For a first CLI-only investigation, no Codex configuration change is necessary:

```sh
npx -y rea-agents@6.7.0 --help
npx -y rea-agents@6.7.0 list-browser-targets http://127.0.0.1:9222 --json
```

The npm registry was queried successfully on 2026-10-21: version 6.7.0 is published, exposes `rea` and `rea-agents` binaries, and declares the same Node range as the inspected source. This verifies publication, not installation or runtime health.

For full Codex integration, preview then apply the official setup:

```sh
npx -y rea-agents@6.7.0 setup --client codex --dry-run
npx -y rea-agents@6.7.0 setup --client codex
```

Review the paths shown by setup and select no native decompiler installation. The official setup changes user-level Codex configuration and installs the matching workflow skill; it is not confined to this Git repo. It creates configuration backups. Restart Codex after setup, then verify:

```sh
npx -y rea-agents@6.7.0 doctor --client codex --skill --json
```

A missing native provider is not necessarily a blocker for browser work. Diagnose the browser capability separately. No setup command was run during this research pass.

The MCP command shape documented by REA is `npx -y rea-agents@6.7.0 mcp`. Let setup handle configuration and timeouts rather than overwriting your existing config. If you want everything confined to this project for now, use CLI-only commands from Codex instead.

Codex also discovers repo skills under `.agents/skills/`; installing a skill alone does not start an MCP server. [Official skills documentation](https://learn.chatgpt.com/docs/build-skills).

## 3. Start an isolated research browser

Chrome is present at the following path on this machine. Run from this repo:

```sh
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"   --remote-debugging-address=127.0.0.1   --remote-debugging-port=9222   --user-data-dir="$PWD/.browser-profile"   https://www.arcade.software/
```

Use a dedicated profile, keep the debugging endpoint on loopback, and close the browser when done. Sign into Arcade yourself when inspection of the editor is needed. Install Arcade's extension in this research profile through its official listing if recording behavior is part of the investigation. A marketing page alone cannot establish how the authenticated editor works.

## 4. Capture evidence

```sh
npx -y rea-agents@6.7.0 list-browser-targets http://127.0.0.1:9222 --json
```

Take the actual target ID from that response; replace `TARGET_ID` below:

```sh
npx -y rea-agents@6.7.0 inspect-web-page http://127.0.0.1:9222 TARGET_ID --observation-ms 1000 --json
npx -y rea-agents@6.7.0 analyze-web-bundle http://127.0.0.1:9222 TARGET_ID --json
npx -y rea-agents@6.7.0 observe-web-session http://127.0.0.1:9222 TARGET_ID --observation-ms 10000 --json
```

Perform the relevant UI action during the observation window. Use REA's exact-origin filter when inspecting a profile with multiple origins; consult the installed command's help for its argument format. Preserve complete outputs under ignored `evidence/` and link evidence IDs in a sanitized findings document. CLI examples are verified against upstream documentation, not live-run against Arcade.

References: [REA installation](https://github.com/morluto/rea/blob/d2015e94f32a51b898918b5b39b374c134119fd5/docs/installation.md), [browser observation](https://github.com/morluto/rea/blob/d2015e94f32a51b898918b5b39b374c134119fd5/docs/browser-observation.md).

## Project-scoped MCP alternative (verified in official Codex docs)

Codex supports `.codex/config.toml` in trusted projects. This is an alternative to REA's user-level setup. The following is a configuration example, not an installed registration:

```toml
[mcp_servers.rea]
command = "npx"
args = ["-y", "rea-agents@6.7.0", "mcp"]
startup_timeout_sec = 30
tool_timeout_sec = 450
```

Before enabling it, resolve the supported Node runtime for the desktop process. A bare `npx` currently risks selecting Node 23 here. An absolute launcher using a supported Node environment is preferable. Preinstall/warm the pinned package with that runtime before relying on a 30-second MCP startup timeout.

For a matching repo-local workflow, copy the inspected upstream `.agents/skills/reverse-engineer-anything/` directory, including its references and license attribution, into this project's `.agents/skills/`. Do not run user-level setup merely to obtain a local skill. A skill is instructions; the MCP entry supplies callable tools. Neither has been installed in this research pass.

Open this repository as the Codex project, trust the project configuration, reload Codex, and confirm the REA tools are visible. Test browser target discovery before any Arcade analysis. A local registration scopes tool discovery; it is not a security sandbox.

[Official Codex MCP documentation](https://learn.chatgpt.com/docs/extend/mcp?surface=cli) confirms project configuration and the command/args/env fields. REA's own setup remains the easiest guided alternative if user-level installation is desired.

## Implemented local tooling update — 2026-10-21

Node 24.22.0 and REA 6.7.0 are now installed under ignored `tools/runtime/`. Use `./scripts/rea.sh` from the repo. Global Node and Codex configuration remain unchanged. The earlier sections document installation alternatives; they no longer describe the package as absent on this machine.

CLI startup/help succeeds. The setup dry-run was attempted and fails in native readiness because the local Swift compiler and SDK do not match; no setup writes were applied. Browser discovery is tested separately from native readiness. See `docs/VERIFICATION.md` for the actual results.
