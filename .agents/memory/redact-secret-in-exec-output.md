---
name: Redacting secrets in exec output
description: A naive raw-string redaction of a secret before logging can still leak it if the secret was transformed (e.g. URL-encoded) before use.
---

When a secret (e.g. a GitHub PAT) is embedded in a shell command — for example URL-encoded
into a git remote URL — redacting only the raw secret value from captured stdout/stderr is
not enough. If the command fails and echoes back the URL it tried to use, the value that
appears there is the *encoded* form, which a plain `output.replace(rawToken, '***')` will
not match, so the encoded (still-readable) secret leaks into logs/output anyway.

**Why:** Caught when a `GITHUB_PUSH_TOKEN` push failed; the error message from git included
the `encodeURIComponent`-ed token verbatim because the redaction only stripped the raw form.

**How to apply:** Before logging any captured output that might contain a secret, redact
every transformed representation you generated from it (raw, URL-encoded, base64, etc.), not
just the original value pulled from the environment.
