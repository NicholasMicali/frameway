# Security reporting

Frameway is early beta software. Security fixes target the latest source on `main`; older snapshots do not have a separate supported maintenance line. Back up projects before updates.

Report suspected vulnerabilities privately using [GitHub's Report a vulnerability form](https://github.com/NicholasMicali/frameway/security/advisories/new). Include the affected commit/version, steps to reproduce, impact, and a minimal synthetic example. Do not open a public issue containing secrets or real enterprise recordings. If the private form is unavailable, open an issue requesting a private reporting channel without vulnerability details.

The maintainer will assess reports as availability permits; there is no guaranteed response time or paid support agreement. Ordinary bugs and feature requests belong in public issues with sanitized examples.

Relevant areas include malicious imported archives, script injection through exported content, accidental network transmission, recording permissions, and unsafe media handling. Playback trimming is explicitly not redaction; see [PRIVACY.md](PRIVACY.md).
