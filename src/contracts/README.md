# Contract artifacts & codegen

Each on-chain contract the app integrates with has its own folder:

```text
src/contracts/<feature-key>/
  abi.json       # Compiler output (or curated ABI) — source of truth for encoding
  manifest.json  # What to generate (include list, labels) — input to `yarn generate`
```

- **`<feature-key>`** must match `featureKey` inside `manifest.json` (and usually matches `src/lib/generated/<feature-key>/` after codegen).
- Folders whose name starts with **`_`** (e.g. `_templates/`) are **ignored** by `yarn generate` when discovering manifests.

## Commands

- Generate **all** contracts: `yarn generate` — by default **regenerates each `manifest.json` via an LLM** (`ANTHROPIC_API_KEY` and/or `GEMINI_API_KEY`). In `auto` mode, Claude is tried first; on billing/rate-limit style errors, **Gemini is used if `GEMINI_API_KEY` is set**. Gemini tries **`GEMINI_MODEL`** (default `gemini-flash-latest`), then versioned fallbacks, then **models your key can use** from the API. If you see **quota `limit: 0`**, enable billing on the Google Cloud project for AI Studio or use Anthropic with credits.
- **Reuse** existing manifests (no API call): `yarn generate --keep-manifest`
- Generate **one** folder by key: `yarn generate --only <feature-key>`
- Generate from an explicit manifest path only (no AI): `yarn generate --manifest src/contracts/<feature-key>/manifest.json`

After changing `abi.json` or `manifest.json`, run generate and commit the updated `src/lib/generated/…` output.
