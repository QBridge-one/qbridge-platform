# shadcn MCP (Cursor)

- **Config:** `.cursor/mcp.json` — `npx -y shadcn@latest mcp` with an **absolute `npx` path** so Cursor sees Node (nvm).
- **Tweakcn:** `components.json` → `registries["@tweakcn"]`.
- **New Node version:** run `which npx` (or `readlink -f "$(which npx)"`) and update the `command` + `PATH` prefix in `mcp.json`.
