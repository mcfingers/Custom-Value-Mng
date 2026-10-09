const demoValues = [
  {
    id: "demo-welcome",
    name: "Welcome message",
    key: "welcome_message",
    value:
      "<p>Welcome to <strong>Northstar Health</strong>.</p><p>We’re glad you’re here. Our team will help you take the next step with confidence.</p>",
  },
  {
    id: "demo-footer",
    name: "Email footer",
    key: "email_footer",
    value:
      "<p><strong>Northstar Health</strong><br>Personal care, made simple.</p>",
  },
  {
    id: "demo-reminder",
    name: "Booking reminder",
    key: "booking_reminder",
    value:
      "<p>Hi there — your appointment is confirmed for <strong>{{appointment.start_time}}</strong>.</p>",
  },
  {
    id: "demo-terms",
    name: "Terms snippet",
    key: "terms_snippet",
    value: "<p>By booking, you agree to our cancellation policy.</p>",
  },
];
let values = [...demoValues],
  selected = values[0],
  dirty = false;
let connections = JSON.parse(
  localStorage.getItem("value-studio-connections") || "[]",
);
let activeConnection = JSON.parse(
  localStorage.getItem("value-studio-active") || "null",
);
let editingConnectionId = activeConnection;
const $ = (s) => document.querySelector(s);
const editor = $("#editor");

function escapeHTML(s) {
  const el = document.createElement("div");
  el.textContent = s;
  return el.innerHTML;
}
function plain(s) {
  const d = document.createElement("div");
  d.innerHTML = s;
  return d.textContent || "";
}
function renderList() {
  const q = $("#search").value.toLowerCase();
  const shown = values.filter((v) =>
    `${v.name} ${v.key}`.toLowerCase().includes(q),
  );
  $("#valuesList").innerHTML =
    shown
      .map(
        (v) =>
          `<button class="value-item ${v.id === selected.id ? "selected" : ""}" data-id="${v.id}"><b>${escapeHTML(v.name)}</b><small>${escapeHTML(v.key).replace(/\s/g, "")}</small><div class="preview">${escapeHTML(plain(v.value))}</div></button>`,
      )
      .join("") ||
    '<p style="padding:18px;color:#84908a;font-size:12px">No matching values.</p>';
  $("#valueCount").textContent = activeConnection
    ? `${shown.length} values synced`
    : `${shown.length} demo values`;
  document
    .querySelectorAll(".value-item")
    .forEach((el) => (el.onclick = () => selectValue(el.dataset.id)));
}
function selectValue(id) {
  selected = values.find((v) => v.id === id);
  editor.innerHTML = selected.value || "";
  $("#editorName").textContent = selected.name;
  $("#editorKey").textContent = selected.key.replace(/\s/g, "");
  $("#htmlSource").value = editor.innerHTML;
  dirty = false;
  $("#editorStatus").textContent = "● Saved";
  $("#editorStatus").style.background = "#e6f6de";
  $("#editorStatus").style.color = "#4c8038";
  updateCount();
  renderList();
}
function updateCount() {
  const text = editor.innerText.trim();
  $("#wordCount").textContent = `${text ? text.split(/\s+/).length : 0} words`;
}
function markDirty() {
  dirty = true;
  $("#editorStatus").textContent = "● Draft";
  $("#editorStatus").style.background = "#fff4d9";
  $("#editorStatus").style.color = "#a47012";
  $("#htmlSource").value = editor.innerHTML;
  updateCount();
}
function toast(message) {
  $("#toast").textContent = message;
  $("#toast").classList.add("show");
  setTimeout(() => $("#toast").classList.remove("show"), 2800);
}
function initials(name) {
  return (name || "Demo")
    .split(/\s+/)
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
function syncProfileUI() {
  const c =
    activeConnection && connections.find((x) => x.id === activeConnection);
  $("#profileName").textContent = c?.name || "Demo workspace";
  $("#profileRole").textContent = c ? "GHL subaccount" : "Not connected";
  $("#profileSwitcher").querySelector(".avatar").textContent = initials(
    c?.name || "Demo",
  );
  renderProfileMenu();
}
function closeProfileMenu() {
  $("#profileMenu").hidden = true;
  $("#profileSwitcher").setAttribute("aria-expanded", "false");
}
function toggleProfileMenu() {
  const menu = $("#profileMenu");
  const open = menu.hidden;
  if (open) renderProfileMenu();
  menu.hidden = !open;
  $("#profileSwitcher").setAttribute("aria-expanded", String(open));
}
function renderProfileMenu() {
  const menu = $("#profileMenu");
  if (!menu) return;
  const option = (c) =>
    `<button class="profile-option ${c.id === activeConnection ? "active" : ""}" role="menuitem" data-connection="${escapeHTML(c.id)}"><span class="avatar">${escapeHTML(initials(c.name))}</span><span class="profile-label"><b>${escapeHTML(c.name)}</b><small>GHL subaccount</small></span><span class="check">✓</span></button>`;
  menu.innerHTML =
    `<div class="profile-menu-title">PROFILES</div>` +
    (connections.length
      ? connections.map(option).join("")
      : '<p class="profile-empty">No saved profiles yet.</p>') +
    `<button class="profile-option demo ${activeConnection ? "" : "active"}" role="menuitem" data-connection=""><span class="avatar">DW</span><span class="profile-label"><b>Demo workspace</b><small>Local only</small></span><span class="check">✓</span></button>` +
    `<button class="profile-add" role="menuitem" data-add="1">+ Add connection</button>`;
}
function switchProfile(id) {
  activeConnection = id || null;
  localStorage.setItem("value-studio-active", JSON.stringify(activeConnection));
  closeProfileMenu();
  if (activeConnection) {
    syncProfileUI();
    loadValues();
  } else {
    values = [...demoValues];
    selected = values[0];
    syncProfileUI();
    selectValue(selected.id);
    toast("Switched to demo workspace.");
  }
}
$("#profileMenu").addEventListener("click", (e) => {
  e.stopPropagation();
  const add = e.target.closest("[data-add]");
  if (add) return closeProfileMenu(), openConnectionDialog(null);
  const item = e.target.closest("[data-connection]");
  if (!item) return;
  const id = item.dataset.connection;
  if ((id || null) === activeConnection) return closeProfileMenu();
  switchProfile(id);
});
document.addEventListener("click", (e) => {
  if (!e.target.closest(".profile-menu-wrap")) closeProfileMenu();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeProfileMenu();
});

$("#search").oninput = renderList;
editor.addEventListener("input", markDirty);
$("#htmlSource").addEventListener("input", (e) => {
  editor.innerHTML = e.target.value;
  markDirty();
});
$("#formatBar").addEventListener("mousedown", (e) => {
  if (e.target.closest("button")) e.preventDefault();
});
$("#formatBar").addEventListener("click", (e) => {
  const button = e.target.closest("button");
  if (!button) return;
  const command = button.dataset.command;
  if (command === "createLink") {
    const url = prompt("Enter the link URL");
    if (url) document.execCommand(command, false, url);
  } else document.execCommand(command, false, null);
  editor.focus();
  markDirty();
});
$("#blockFormat").onchange = (e) => {
  document.execCommand("formatBlock", false, e.target.value);
  editor.focus();
  markDirty();
};
$("#copyKey").onclick = () =>
  navigator.clipboard
    .writeText(`${selected.key.replace(/\s/g, "")}`)
    .then(() => toast("Merge key copied"));
$("#newBtn").onclick = () => {
  const name = prompt("Name for the custom value");
  if (!name) return;
  const key = prompt(
    "Merge key (letters, numbers, and underscores)",
    name.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
  );
  if (!key) return;
  const value = {
    id: `local-${Date.now()}`,
    name,
    key,
    value: "<p>Start writing here…</p>",
    local: true,
  };
  values.unshift(value);
  selectValue(value.id);
  renderList();
};

function openConnectionDialog(connectionId = activeConnection) {
  const c = connectionId && connections.find((x) => x.id === connectionId);
  editingConnectionId = c?.id || null;
  $("#deleteConnection").hidden = !editingConnectionId;
  $("#connectionName").value = c?.name || "";
  $("#locationId").value = c?.locationId || "";
  $("#token").value = c?.token || "";
  $("#connectionDialog").showModal();
}
$("#openConnection").onclick = () => openConnectionDialog();
$("#connectionsNav").onclick = (event) => {
  event.preventDefault();
  openConnectionDialog(null);
};
$("#profileSwitcher").onclick = (e) => {
  e.stopPropagation();
  toggleProfileMenu();
};
$("#deleteConnection").onclick = () => {
  const c = connections.find((x) => x.id === activeConnection);
  if (!c) return;
  $("#deleteConnectionName").textContent = c.name;
  $("#deleteDialog").showModal();
};
$("#confirmDelete").onclick = () => {
  $("#deleteDialog").close();
  const removed = connections.find((x) => x.id === activeConnection);
  connections = connections.filter((x) => x.id !== activeConnection);
  activeConnection = null;
  localStorage.setItem("value-studio-connections", JSON.stringify(connections));
  localStorage.setItem("value-studio-active", JSON.stringify(null));
  editingConnectionId = null;
  $("#connectionDialog").close();
  values = [...demoValues];
  selected = values[0];
  syncProfileUI();
  selectValue(selected.id);
  renderList();
  toast(`${removed?.name || "Connection"} deleted. Demo workspace loaded.`);
};
$("#saveConnection").onclick = (e) => {
  e.preventDefault();
  const name = $("#connectionName").value.trim(),
    locationId = $("#locationId").value.trim(),
    token = $("#token").value.trim();
  if (!name || !locationId || !token)
    return toast("Please complete all connection fields.");
  const existing = connections.find((c) => c.id === editingConnectionId);
  const c = {
    id: existing?.id || `conn-${Date.now()}`,
    name,
    locationId,
    token,
  };
  connections = existing
    ? connections.map((x) => (x.id === c.id ? c : x))
    : [...connections, c];
  activeConnection = c.id;
  localStorage.setItem("value-studio-connections", JSON.stringify(connections));
  localStorage.setItem("value-studio-active", JSON.stringify(activeConnection));
  $("#connectionDialog").close();
  syncProfileUI();
  toast("Connection saved. Sync custom values when ready.");
};

async function ghl(method, endpoint, payload, connectionId = activeConnection) {
  const c = connections.find((x) => x.id === connectionId);
  if (!c) throw new Error("Add a GHL connection first.");
  const res = await fetch("/api/ghl/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token: c.token,
      locationId: c.locationId,
      method,
      endpoint,
      payload,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    const detail = data.message || data.error || data.errors?.map((item) => item.message || item.msg || item).join(", ");
    throw new Error(detail || `GHL request failed (${res.status}).`);
  }
  return data;
}
async function fetchValuesFor(connectionId) {
  const data = await ghl(
    "GET",
    "/locations/:locationId/customValues",
    undefined,
    connectionId,
  );
  const result = data.customValues || data.values || [];
  return result.map((v) => ({
    id: v.id,
    name: v.name || v.fieldKey,
    key: v.fieldKey,
    value: v.value || "",
  }));
}
async function loadValues() {
  if (!activeConnection) return;
  $("#refreshBtn").disabled = true;
  $(".refresh-label").textContent = "Loading…";
  try {
    values = await fetchValuesFor(activeConnection);
    if (!values.length) values = [];
    selected = values[0] || {
      id: null,
      name: "No custom values found",
      key: "—",
      value: "<p>Create a new custom value to get started.</p>",
    };
    selectValue(selected.id);
    toast("Custom values synced from GHL.");
  } catch (error) {
    toast(`Couldn’t sync: ${error.message}`);
  } finally {
    $("#refreshBtn").disabled = false;
    $(".refresh-label").textContent = "Reload";
    renderList();
  }
}
$("#refreshBtn").onclick = loadValues;
$("#saveBtn").onclick = async () => {
  selected.value = editor.innerHTML;
  if (!activeConnection) {
    dirty = false;
    $("#editorStatus").textContent = "● Saved locally";
    renderList();
    return toast("Saved locally. Add a connection to publish to GHL.");
  }
  try {
    $("#saveBtn").disabled = true;
    $("#saveBtn").textContent = "Saving…";
    const endpoint = selected.id?.startsWith("local-")
      ? "/locations/:locationId/customValues"
      : `/locations/:locationId/customValues/${selected.id}`;
    const method = selected.id?.startsWith("local-") ? "POST" : "PUT";
    const result = await ghl(method, endpoint, {
      name: selected.name,
      value: selected.value,
    });
    if (method === "POST" && result.customValue?.id)
      selected.id = result.customValue.id;
    dirty = false;
    $("#editorStatus").textContent = "● Saved";
    $("#editorStatus").style.background = "#e6f6de";
    $("#editorStatus").style.color = "#4c8038";
    renderList();
    toast("Formatted value saved to GHL.");
  } catch (error) {
    toast(`Couldn’t save: ${error.message}`);
  } finally {
    $("#saveBtn").disabled = false;
    $("#saveBtn").innerHTML = "Save custom value <span>→</span>";
  }
};

let copyPairs = [],
  copyStats = null,
  copyRunning = false;

function fillConnectionSelect(select, selectedId) {
  select.innerHTML = "";
  connections.forEach((c) => {
    const option = document.createElement("option");
    option.value = c.id;
    option.textContent = c.name;
    select.appendChild(option);
  });
  if (connections.some((c) => c.id === selectedId)) select.value = selectedId;
}
function resetCopyResults() {
  copyPairs = [];
  copyStats = null;
  $("#copySummary").hidden = true;
  $("#copySummary").textContent = "";
  $("#copyResult").hidden = true;
  $("#copyResult").textContent = "";
  $("#copySearch").value = "";
  $("#copyListHead").hidden = true;
  $("#copyList").hidden = true;
  $("#copyList").innerHTML = "";
  $("#copyRun").hidden = true;
}
function openCopyDialog() {
  resetCopyResults();
  const ready = connections.length >= 2;
  $("#copyConnectionFields").hidden = !ready;
  $("#copyHint").hidden = ready;
  $("#loadMatches").hidden = !ready;
  if (ready) {
    const sourceId = connections.some((c) => c.id === activeConnection)
      ? activeConnection
      : connections[0].id;
    const target = connections.find((c) => c.id !== sourceId);
    fillConnectionSelect($("#copySource"), sourceId);
    fillConnectionSelect($("#copyTarget"), target?.id);
  }
  $("#copyDialog").showModal();
}
function copyDifferCount() {
  return copyPairs.filter((p) => !p.identical).length;
}
function checkedCopyCount() {
  return copyPairs.filter((p) => p.checked && !p.identical).length;
}
function filteredCopyRows() {
  const q = $("#copySearch").value.toLowerCase();
  return copyPairs
    .map((pair, index) => ({ pair, index }))
    .filter(({ pair }) =>
      `${pair.source.name} ${pair.source.key}`.toLowerCase().includes(q),
    );
}
function updateCopyRunLabel() {
  const n = checkedCopyCount();
  $("#copyRun").textContent = `Copy ${n} value${n === 1 ? "" : "s"}`;
  $("#copyRun").hidden = !copyDifferCount();
  if (!copyRunning) $("#copyRun").disabled = n === 0;
  const toggle = $("#copySelectToggle");
  if (toggle) toggle.textContent = n ? "Deselect all" : "Select all";
}
function renderCopySummary() {
  const s = copyStats;
  $("#copySummary").textContent = `${s.matched} matched · ${s.differs} differ · ${s.identical} identical · ${s.onlySource} only in source · ${s.onlyTarget} only in target`;
  $("#copySummary").hidden = false;
}
function renderCopyList() {
  const rows = filteredCopyRows();
  $("#copyList").innerHTML = !copyPairs.length
    ? '<p class="copy-empty">No keys exist in both connections.</p>'
    : rows.length
      ? rows
          .map(({ pair: p, index: i }) => {
            const src = plain(p.source.value) || "(empty)";
            const tgt = plain(p.target.value) || "(empty)";
            return `<label class="copy-row">
            <input type="checkbox" data-index="${i}" ${p.identical ? "disabled" : ""} ${!p.identical && p.checked ? "checked" : ""} />
            <span class="copy-row-main">
              <span class="copy-row-head"><b>${escapeHTML(p.source.name)}</b><code>${escapeHTML(p.source.key)}</code></span>
              <span class="copy-previews">
                <span class="copy-preview"><i>SOURCE</i>${escapeHTML(src)}</span>
                <span class="copy-preview"><i>TARGET</i>${escapeHTML(tgt)}</span>
              </span>
            </span>
            <span class="copy-badge ${p.identical ? "identical" : "differs"}">${p.identical ? "identical" : "differs"}</span>
          </label>`;
          })
          .join("")
      : '<p class="copy-empty">No matching values.</p>';
  $("#copyList").hidden = false;
  $("#copyListHead").hidden = !copyPairs.length;
  $("#copyList").onchange = (e) => {
    const box = e.target.closest('input[type="checkbox"]');
    const pair = box && copyPairs[Number(box.dataset.index)];
    if (pair) pair.checked = box.checked;
    updateCopyRunLabel();
  };
  updateCopyRunLabel();
}
async function loadCopyMatches() {
  const sourceId = $("#copySource").value;
  const targetId = $("#copyTarget").value;
  if (sourceId === targetId) return toast("Pick two different connections.");
  $("#loadMatches").disabled = true;
  $("#loadMatches").textContent = "Loading…";
  $("#copyResult").hidden = true;
  try {
    const [sourceValues, targetValues] = await Promise.all([
      fetchValuesFor(sourceId),
      fetchValuesFor(targetId),
    ]);
    const targetByKey = new Map(targetValues.map((v) => [v.key, v]));
    copyPairs = [];
    const matchedTargetIds = new Set();
    sourceValues.forEach((s) => {
      const t = targetByKey.get(s.key);
      if (!t) return;
      matchedTargetIds.add(t.id);
      copyPairs.push({
        source: s,
        target: t,
        identical: s.value === t.value,
        checked: s.value !== t.value,
      });
    });
    copyStats = {
      matched: copyPairs.length,
      differs: copyDifferCount(),
      identical: copyPairs.length - copyDifferCount(),
      onlySource: sourceValues.length - copyPairs.length,
      onlyTarget: targetValues.filter((v) => !matchedTargetIds.has(v.id))
        .length,
    };
    renderCopySummary();
    renderCopyList();
  } catch (error) {
    toast(`Couldn’t load values: ${error.message}`);
  } finally {
    $("#loadMatches").disabled = false;
    $("#loadMatches").textContent = "Load matches";
  }
}
function setCopyBusy(busy) {
  copyRunning = busy;
  ["#copySource", "#copyTarget", "#loadMatches", "#copyCancel", "#copySearch", "#copySelectToggle"].forEach(
    (s) => ($(s).disabled = busy),
  );
  $("#copyRun").disabled = busy;
  $("#copyList")
    .querySelectorAll('input[type="checkbox"]')
    .forEach((box) => {
      const pair = copyPairs[Number(box.dataset.index)];
      box.disabled = busy || !pair || pair.identical;
    });
  if (!busy) updateCopyRunLabel();
}
async function runCopy() {
  if (copyRunning) return;
  const rows = copyPairs.filter((p) => p.checked && !p.identical);
  if (!rows.length) return toast("Select at least one value to copy.");
  const targetId = $("#copyTarget").value;
  const targetName =
    connections.find((c) => c.id === targetId)?.name || "target";
  setCopyBusy(true);
  const copied = [],
    failed = [];
  for (let i = 0; i < rows.length; i++) {
    const pair = rows[i];
    $("#copyRun").textContent = `Copying ${i + 1}/${rows.length}…`;
    try {
      await ghl(
        "PUT",
        `/locations/:locationId/customValues/${pair.target.id}`,
        { name: pair.target.name, value: pair.source.value },
        targetId,
      );
      pair.identical = true;
      pair.target.value = pair.source.value;
      copied.push(pair);
    } catch (error) {
      failed.push({ pair, message: error.message });
    }
  }
  setCopyBusy(false);
  if (copyStats) {
    copyStats.differs = copyDifferCount();
    copyStats.identical = copyStats.matched - copyStats.differs;
    renderCopySummary();
  }
  renderCopyList();
  const result = $("#copyResult");
  result.hidden = false;
  result.classList.toggle("failed", failed.length > 0);
  result.textContent = failed.length
    ? `${copied.length} copied · ${failed.length} failed: ${failed
        .map((f) => f.pair.source.key)
        .join(", ")} — ${failed[0].message}`
    : `${copied.length} value${copied.length === 1 ? "" : "s"} copied to ${targetName}.`;
  if (copied.length && targetId === activeConnection) loadValues();
  toast(
    failed.length
      ? `Copy finished with ${failed.length} failure${failed.length === 1 ? "" : "s"}.`
      : `Copied ${copied.length} value${copied.length === 1 ? "" : "s"} to ${targetName}.`,
  );
}

$("#copyNav").onclick = (e) => {
  e.preventDefault();
  openCopyDialog();
};
$("#loadMatches").onclick = loadCopyMatches;
$("#copyRun").onclick = runCopy;
$("#copySelectToggle").onclick = () => {
  const select = checkedCopyCount() === 0;
  copyPairs.forEach((p) => {
    if (!p.identical) p.checked = select;
  });
  renderCopyList();
};
$("#copySearch").oninput = renderCopyList;
$("#copyCancel").onclick = () => {
  if (!copyRunning) $("#copyDialog").close();
};
$("#copySource").onchange = resetCopyResults;
$("#copyTarget").onchange = resetCopyResults;
$("#copyDialog").addEventListener("cancel", (e) => {
  if (copyRunning) e.preventDefault();
});
$("#copyDialog").querySelector(".close").addEventListener("click", (e) => {
  if (copyRunning) e.preventDefault();
});

syncProfileUI();
selectValue(selected.id);
renderList();
