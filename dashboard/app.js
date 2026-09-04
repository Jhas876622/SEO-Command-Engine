/* app.js — SEO Command Center live cockpit. Plain DOM + SSE, no build step. */
const $ = (id) => document.getElementById(id);
let totals = { High: 0, Medium: 0, Low: 0, total: 0 };
let checks = [];

function animateValue(id, start, end, duration) {
  const obj = $(id); if (!obj) return;
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    obj.textContent = Math.floor(progress * (end - start) + start);
    if (progress < 1) window.requestAnimationFrame(step);
  };
  window.requestAnimationFrame(step);
}

function updateGauge(score) {
  const g = $("gauge");
  const val = g ? g.querySelector("b") : null;
  if (!g || !val) return;
  val.textContent = score;
  if (score < 40) g.style.borderColor = "var(--red)";
  else if (score < 70) g.style.borderColor = "var(--amber)";
  else g.style.borderColor = "var(--green)";
}

function log(msg) {
  const l = $("log"); if (l.querySelector(".empty")) l.innerHTML = "";
  const d = document.createElement("div"); d.textContent = "› " + msg; l.appendChild(d); l.scrollTop = l.scrollHeight;
}
function label(name) {
  return String(name || "").replaceAll("_", " ");
}
function renderChecklist() {
  const box = $("checklist");
  if (!checks.length) {
    box.innerHTML = `<div class="empty">Waiting for detector checks…</div>`;
    return;
  }
  box.innerHTML = "";
  checks.forEach((item) => {
    const row = document.createElement("div");
    row.className = `check ${item.done ? "done" : ""}`;
    const left = document.createElement("div");
    left.className = "left";
    const tick = document.createElement("span");
    tick.className = "tick";
    tick.textContent = item.done ? "✓" : "";
    const name = document.createElement("span");
    name.className = "name";
    name.textContent = label(item.check);
    left.appendChild(tick);
    left.appendChild(name);
    const found = document.createElement("span");
    found.className = "found";
    found.textContent = `${item.found || 0} found`;
    row.appendChild(left);
    row.appendChild(found);
    box.appendChild(row);
  });
}
function setChecks(next) {
  checks = (next || []).map((item) => ({ check: item.check, found: item.found || 0, done: !!item.done }));
  renderChecklist();
}
function updateCheck(data) {
  const existing = checks.find((item) => item.check === data.check);
  if (existing) {
    existing.found = data.found || 0;
    existing.done = true;
  } else {
    checks.push({ check: data.check, found: data.found || 0, done: true });
  }
  renderChecklist();
}
function addIssue(i) {
  const tb = $("tbody"); if (tb.querySelector(".empty")) tb.innerHTML = "";
  const tr = document.createElement("tr");
  const rowClass = `row-${i.severity.toLowerCase()}`;
  tr.className = rowClass;
  tr.innerHTML = `<td><span class="sev ${i.severity.toLowerCase()}">${i.severity}</span></td>
                  <td>${i.type}</td><td>${i.count}</td>`;
  tb.appendChild(tr);
  totals[i.severity] = (totals[i.severity] || 0) + 1; totals.total++;
  animateValue("c-total", parseInt($("c-total").textContent || 0), totals.total, 300);
  animateValue("c-high", parseInt($("c-high").textContent || 0), totals.High, 300);
  animateValue("c-med", parseInt($("c-med").textContent || 0), totals.Medium, 300);
  animateValue("c-low", parseInt($("c-low").textContent || 0), totals.Low, 300);
}
function renderFixes(titles) {
  const ftb = $("fixes-tbody");
  const btn = $("export-fixes-btn");
  if (!ftb) return;
  if (!titles || !titles.length) {
    ftb.innerHTML = `<tr><td colspan="3" class="empty">No AI title fixes generated yet.</td></tr>`;
    if (btn) btn.style.display = "none";
    return;
  }
  ftb.innerHTML = "";
  titles.forEach((t) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td style="max-width:260px;overflow-wrap:anywhere">${t.url}</td>
                    <td style="color:var(--mute)">${t.old || 'Missing'}</td>
                    <td contenteditable="true" class="editable-cell">${t.new}</td>`;
    ftb.appendChild(tr);
  });
  if (btn) btn.style.display = "inline-block";
}

function showToast(msg, type = "info", duration = 8000) {
  const toast = $("toast-banner");
  if (!toast) return;
  toast.className = `toast-banner ${type}`;
  toast.innerHTML = `<span>${msg}</span><button class="close-btn" onclick="this.parentElement.style.display='none'">✕</button>`;
  toast.style.display = "flex";
  if (duration > 0) {
    setTimeout(() => {
      if (toast.innerHTML.includes(msg)) toast.style.display = "none";
    }, duration);
  }
}

function resetUrlBtn() {
  const ubtn = $("url-btn");
  if (ubtn) {
    ubtn.disabled = false;
    ubtn.innerText = "🌐 Audit URL";
  }
}

function handle({ event, data }) {
  if (event === "snapshot") {
    if (data.site) { $("meta").textContent = "· " + data.site; $("urls").textContent = (data.urls||0) + " URLs"; }
    setChecks(data.checks || []);
    (data.issues || []).forEach(addIssue);
    if (data.health_score !== undefined) updateGauge(data.health_score);
    if (data.fixes && data.fixes.titles) renderFixes(data.fixes.titles);
  } else if (event === "loaded") {
    $("meta").textContent = "· " + data.site; $("urls").textContent = data.urls + " URLs";
    log(`[${new Date().toLocaleTimeString()}] Loaded ${data.urls} URLs from ${data.site}`); $("tbody").innerHTML = "";
    totals = { High:0, Medium:0, Low:0, total:0 };
    setChecks([]);
    updateGauge(0);
    renderFixes([]);
  } else if (event === "checks") { setChecks(data.checks || []); }
  else if (event === "progress") {
    updateCheck(data);
    log(`[${new Date().toLocaleTimeString()}] ${data.check}: ${data.found || 0} found`);
  }
  else if (event === "issue") {
    addIssue(data);
    log(`[${new Date().toLocaleTimeString()}] Found ${data.count} × ${data.type}`);
  }
  else if (event === "summary") {
    log(`[${new Date().toLocaleTimeString()}] Audit complete: ${data.total_issues} issue types`);
    showToast(`✅ Audit complete! ${data.total_issues} issue types analyzed.`, "success", 7000);
    resetUrlBtn();
  }
  else if (event === "error") {
    showToast(`⛔ ${data.message || data.title || "Audit error occurred"}`, "error", 12000);
    log(`[${new Date().toLocaleTimeString()}] ERROR: ${data.message || data.title}`);
    resetUrlBtn();
  }
  else if (event === "score") {
    updateGauge(data.score);
  }
  else if (event === "fixes") {
    const badge = $("fix-badge");
    if (badge) {
        badge.style.display = "inline-flex";
        badge.textContent = `Fixes Ready: ${(data.titles||[]).length + (data.redirect_map||[]).length}`;
    }
    renderFixes(data.titles || []);
    log(`[${new Date().toLocaleTimeString()}] Fixes ready: ${(data.titles||[]).length} titles, ${(data.redirect_map||[]).length} redirects`);
  }
  else if (event === "exported") {
    $("export").innerHTML = "<b>report.html written ✓</b><br><span style='color:#c8c5be;font-size:12px'>Open or email outputs/report.html to the client.</span>";
    showToast(`🎉 Report generated successfully! Check report.html`, "success", 8000);
    resetUrlBtn();
  }
  else if (event === "saved") {
    log(`[${new Date().toLocaleTimeString()}] report.json saved`);
  }
}
const es = new EventSource("/events");
es.onmessage = (m) => { try { handle(JSON.parse(m.data)); } catch (e) {} };

document.addEventListener("DOMContentLoaded", () => {
  const fi = $("file-input");
  if (fi) {
    fi.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      log(`[${new Date().toLocaleTimeString()}] Uploading ${file.name}...`);
      showToast(`📁 Processing CSV file: ${file.name}... Please wait a few seconds.`, "info", 5000);
      const fd = new FormData();
      fd.append("file", file);
      fetch("/upload", { method: "POST", body: fd })
        .then(res => res.json())
        .then(d => log(`[${new Date().toLocaleTimeString()}] ${d.message || "Audit started"}`))
        .catch(err => log(`[${new Date().toLocaleTimeString()}] Upload error: ${err}`));
    });
  }

  const ubtn = $("url-btn");
  const uinput = $("url-input");
  if (ubtn && uinput) {
    ubtn.addEventListener("click", () => {
      const url = uinput.value.trim();
      if (!url) return alert("Please enter a website URL (e.g. https://example.com)");
      
      ubtn.disabled = true;
      ubtn.innerText = "⏳ Auditing...";
      showToast(`🔍 Auditing in progress for ${url}! Please wait 10-15 seconds for results...`, "info", 10000);
      log(`[${new Date().toLocaleTimeString()}] Starting live crawl for ${url}...`);
      
      fetch("/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url })
      })
      .then(res => res.json())
      .then(d => log(`[${new Date().toLocaleTimeString()}] ${d.message || "Crawl started"}`))
      .catch(err => {
        log(`[${new Date().toLocaleTimeString()}] Crawl error: ${err}`);
        showToast(`⛔ Connection error starting audit: ${err}`, "error", 8000);
        resetUrlBtn();
      });
    });
  }

  const pbtn = $("print-btn");
  if (pbtn) {
    pbtn.addEventListener("click", () => window.print());
  }

  const expbtn = $("export-fixes-btn");
  if (expbtn) {
    expbtn.addEventListener("click", () => {
      const rows = [["url", "old_title", "new_title"]];
      const trs = document.querySelectorAll("#fixes-tbody tr");
      trs.forEach(tr => {
        const tds = tr.querySelectorAll("td");
        if (tds.length === 3) {
          rows.push([
            `"${tds[0].innerText.replace(/"/g, '""')}"`,
            `"${tds[1].innerText.replace(/"/g, '""')}"`,
            `"${tds[2].innerText.replace(/"/g, '""')}"`
          ]);
        }
      });
      const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "edited_title_fixes.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }
});
