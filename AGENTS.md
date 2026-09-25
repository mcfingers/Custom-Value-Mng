# AGENTS.md — Custom Values Manager

Vanilla HTML/CSS/JS app (no framework, no build step, no dependencies in `package.json`, no lockfile, no lint/test/CI config).

## Run & verify

- `npm start` → `node server.js`, serves at `http://localhost:4173` (override with `PORT`). Only script that exists.
- No test suite. Verify changes with throwaway jsdom smoke tests in `C:\Users\mcfin\AppData\Local\Temp\opencode\` (previous examples: `smoke-profile.js`, `smoke-delete.js`, `smoke-header.js` there):
  - `npm install --no-save jsdom`, run `node <temp test>` with `workdir` set to the project, then **delete `node_modules`** to keep the project clean. Also stop any `node server.js` processes you started.
  - jsdom gaps to polyfill **in the test only** (app code must stay vanilla): no `innerText` (map to `textContent`), no `dialog.showModal/close` (stub on `HTMLDialogElement.prototype`), forms with `method="dialog"` don't auto-close.

## Architecture (non-obvious)

- `server.js` is both the static file server (serves `/`, maps `.svg → image/svg+xml`) **and** a CORS-avoiding proxy: `POST /api/ghl/` forwards `{token, locationId, method, endpoint, payload}` to `https://services.leadconnectorhq.com` with `Authorization: Bearer` and `Version: 2021-07-28`. All GHL calls from `app.js` go through this proxy (`ghl()` helper), never directly to GHL.
- Connections persist in localStorage: `value-studio-connections` (array) and `value-studio-active`. Values are stored **JSON-stringified twice** (`JSON.stringify(JSON.stringify(...))` for single values, e.g. active id/null) — read the existing code before touching these keys.
- `demoValues` in `app.js` is the fallback workspace: shown when no active connection, when GHL load fails, and after deleting a connection (deletion must reset to demo and re-render the sidebar profile dropdown).

## Conventions that differ from defaults

- **SVG icon colors are baked into the `.svg` files** (e.g. `chevron-down.svg` `#c7cfca`, `trash-alt.svg` `#FFFFFF`, `gear.svg` `#657069`, `reload.svg` `#55605b`). CSS `color` does not reach inside `<img src="*.svg">` — to recolor an icon, edit the SVG file, not the stylesheet.
- Icons are fetched from SVGRepo via `https://www.svgrepo.com/show/<id>/<name>.svg` — the `/download/<id>/<name>.svg` path returns 429/bot challenge.
- `#refreshBtn` must not be assigned `textContent` (it would wipe the icon `<img>`). Toggle only `$(".refresh-label").textContent` and the `disabled` flag; label strings are `"Loading…"` / `"Reload"`.
- `styles.css` is plain multi-line CSS (it was minified historically; some content may still be on one line). Match the surrounding formatting of each rule, don't reformat the whole file.
- UI texts/icons that recur across files: app name is "Custom Values Manager" (title, brand, sidebar). Header has **Settings** (opens connection dialog) and **Reload**; sidebar nav item is **Add new connection**.
- Dialogs (`#connectionDialog`, `#deleteDialog`): `app.js` explicitly calls `.close()` even when `method="dialog"` would handle it — keep that for jsdom/robustness. Delete flow: red `.delete-connection` button (`#F25F5C` bg, white text) → `#deleteDialog` confirmation → remove active connection, update dropdown, load demo workspace.

## Persistence & state rules

- Any change to connections (save, delete, switch profile) must update both localStorage keys **and** call `renderProfileMenu()` / `syncProfileUI()` so the sidebar stays in sync.
- Keep credentials out of disk: tokens live only in localStorage and are sent to the local proxy in the request body (README documents this promise — don't break it).
