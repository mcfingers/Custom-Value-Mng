# GHL Custom Values Manager

A compact internal editor for formatting HighLevel custom values as HTML.

## Requirements

- NodeJS LTS Version | [Download ⬇️](https://nodejs.org/en/download)
- Works on Chrome, Edge, Safari

## Run locally

```powershell
npm start
```

Open `http://localhost:4173`.

## Use it

1. Click **Add new connection** in the sidebar (or **Settings** in the header) and enter a label, GHL Location ID, and the subaccount's Private Integration Token (see [Getting your GHL credentials](#getting-your-ghl-credentials)).
2. Click **Reload** in the header to load the location's custom values.
3. Select a value, format it using the visual editor, or edit the generated HTML directly.
4. Save to push the HTML back to GHL.
5. With two or more connections saved, use **Copy between connections** in the sidebar to batch-copy values between subaccounts (see [Copy between connections](#copy-between-connections)).

## Getting your GHL credentials

The connection dialog needs two values: the **Location ID** and a **Private Integration Token**.

### Location ID

1. Log into the GHL **sub-account** you want to connect.
2. Click **Settings** (gear icon, bottom of the left sidebar).
3. Open **Business Profile** (sometimes labelled _Company_).
4. Under **General Information**, copy the **Location ID** field.

Shortcut: the Location ID is also the segment in the browser URL — `https://app.gohighlevel.com/location/<LOCATION_ID>/...` — so you can copy it straight from the address bar.

### Private Integration Token

1. In the same sub-account, go to **Settings → Private Integrations**. If the menu item is missing, an agency admin must first enable **Private Integrations** under **Labs**.
2. Click **Create new Integration**, give it a name and description (e.g. "Custom Values Manager").
3. Select the scopes — this app needs both:
   - `locations/customValues.readonly` (list values with **Reload**)
   - `locations/customValues.write` (save edits back to GHL)
4. Click **Create** and **copy the token immediately** — HighLevel shows it only once, and you can't reveal it again later.
5. Paste the token into the **Private integration token** field of the connection dialog.

Repeat these steps per sub-account; each connection is stored separately in the sidebar profile switcher. HighLevel recommends rotating tokens roughly every 90 days (Settings → Private Integrations → the integration → _Rotate and expire this token later_).

## Profiles

The sidebar profile switcher is a dropdown of every saved connection. Open it to jump between subaccounts, pick the local **Demo workspace**, or add a new connection — the active profile is remembered across reloads.

## Copy between connections

Click **Copy between connections** in the sidebar to push values from one saved subaccount into another — useful when the same custom values exist across several client locations.

1. Pick a **Source** and a **Target** connection (the active profile is prefilled as the source), then click **Load matches**.
2. The dialog matches on the merge key (`fieldKey`): a value is only updated when that key **already exists in the target**. New custom values are never created — keys that exist in only one of the two connections are counted in the summary line but skipped.
3. Review the matched pairs. Rows marked **identical** are locked (same value in both connections); rows marked **differs** come pre-checked and show the source and target values side by side.
4. Narrow the list with **Search matches** (same name + key search as the main list) and use **Deselect all / Select all** to pick exactly what to copy. Selections survive filtering, and the button always shows how many values will be written.
5. Click **Copy N values**. Values are written one at a time to the target; the result line reports how many succeeded and lists any failures with their key. If the target is the active profile, its list refreshes when the copy finishes.

Requires at least two saved connections; the demo workspace can't be a source or target.

## Deleting a connection

Open the connection settings dialog with **Settings** and press the red **Delete** button (trash icon). A warning modal asks you to confirm the deletion. On confirm:

- the active connection is removed from browser storage,
- it disappears from the sidebar profile dropdown,
- the demo workspace is loaded as the starting point.

Connections are stored only in this browser's local storage, so you can keep and switch between several subaccounts. The tiny Node server proxies requests to GHL to keep the browser from handling CORS directly; it does not write credentials to disk.

The GHL REST API is called with `Version: 2021-07-28` and the Custom Values endpoints. Before deploying internally, protect the app behind your company authentication and use a real secrets store instead of browser local storage.
