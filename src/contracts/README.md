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

The committed `manifest.json` is the **source of truth**. Codegen is deterministic
by default — re-running never silently re-rolls an already-curated manifest. The
LLM only runs when you explicitly ask, or to bootstrap a brand-new folder.

- Generate **all** contracts (deterministic, from committed manifests): `yarn generate`
- Generate **one** folder by key: `yarn generate --only <feature-key>`
- **(Re)draft `manifest.json` via an LLM**, then codegen: `yarn generate:manifest`
  (or `yarn generate --ai-manifest [--only <feature-key>]`). This **overwrites**
  `manifest.json` — **review the git diff** before committing.
- Generate from an explicit manifest path only (no AI): `yarn generate --manifest src/contracts/<feature-key>/manifest.json`

> A new folder with `abi.json` but no `manifest.json` gets one drafted via LLM on
> the next `yarn generate` (bootstrap) — review and commit it.

**LLM providers** (used only by `generate:manifest` / `--ai-manifest`):
`ANTHROPIC_API_KEY` and/or `GEMINI_API_KEY`. In `auto` mode Claude is tried first;
on billing/rate-limit errors, **Gemini is used if `GEMINI_API_KEY` is set**. Gemini
tries `GEMINI_MODEL` (default `gemini-flash-latest`), then versioned fallbacks,
then models your key can use. Quota `limit: 0` → enable billing on the AI Studio
Google Cloud project, or use Anthropic with credits.

**Workflow notes:**
- After editing `manifest.json` or `abi.json` → run `yarn generate` and commit the updated `src/lib/generated/…` output.
- Added a function to `abi.json` and want a hook for it? Add it to the manifest's `include` list (or run `generate:manifest` to redraft), then `yarn generate`.
- `--keep-manifest` is still accepted but is now a **no-op** (reuse is the default).
