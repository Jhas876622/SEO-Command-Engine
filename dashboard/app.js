/* app.js — SEO Command Center · Premium Cockpit · Plain DOM + SSE */
'use strict';

const $ = (id) => document.getElementById(id);

/* ─── Known blocked domain patterns ─── */
const BLOCKED_DOMAINS = [
  'google.com','amazon.com','amazon.in','facebook.com','instagram.com',
  'twitter.com','x.com','linkedin.com','youtube.com','flipkart.com',
  'cloudflare.com','netflix.com','reddit.com','tiktok.com','shopify.com',
  'ebay.com','apple.com','microsoft.com','github.com','stackoverflow.com',
  'wikipedia.org','nytimes.com','bbc.com','cnn.com','forbes.com',
  'bloomberg.com','airbnb.com','uber.com','zomato.com','swiggy.com'
];

function isDomainBlocked(url) {
  try {
    const host = new URL(url.startsWith('http') ? url : 'https://' + url).hostname.replace('www.', '');
    return BLOCKED_DOMAINS.some(d => host === d || host.endsWith('.' + d));
  } catch { return false; }
}

/* ─── State ─── */
let totals = { High: 0, Medium: 0, Low: 0, total: 0 };
let checks = [];

/* ─── Animate number ─── */
function animateValue(id, start, end, duration) {
  const obj = $(id); if (!obj) return;
  const delta = end - start;
  if (delta === 0) return;
  let startTs = null;
  const step = (ts) => {
    if (!startTs) startTs = ts;
    const progress = Math.min((ts - startTs) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    obj.textContent = Math.round(start + delta * ease);
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ─── SVG Gauge ─── */
const CIRCUMFERENCE = 2 * Math.PI * 65; // r=65

function updateGauge(score) {
  const arc = $('gauge-arc');
  const txt = $('gauge-score');
  if (!arc || !txt) return;

  const pct = Math.max(0, Math.min(score, 100)) / 100;
  const offset = CIRCUMFERENCE - pct * CIRCUMFERENCE;
  arc.style.strokeDasharray = CIRCUMFERENCE;
  arc.style.strokeDashoffset = offset;

  // Color
  if (score < 40) arc.style.stroke = '#f04060';
  else if (score < 70) arc.style.stroke = '#f5a623';
  else arc.style.stroke = '#27c97e';

  // Animate text
  const current = parseInt(txt.textContent) || 0;
  animateValue('gauge-score', current, score, 800);
}

/* ─── Bar Chart ─── */
function updateChart() {
  const max = Math.max(totals.High, totals.Medium, totals.Low, 1);
  const barHigh = $('bar-high');
  const barMed = $('bar-med');
  const barLow = $('bar-low');
  if (barHigh) barHigh.style.width = (totals.High / max * 100) + '%';
  if (barMed) barMed.style.width = (totals.Medium / max * 100) + '%';
  if (barLow) barLow.style.width = (totals.Low / max * 100) + '%';
  if ($('bar-high-n')) $('bar-high-n').textContent = totals.High;
  if ($('bar-med-n')) $('bar-med-n').textContent = totals.Medium;
  if ($('bar-low-n')) $('bar-low-n').textContent = totals.Low;
}

/* ─── Log ─── */
function log(msg, type = '') {
  const l = $('log');
  if (!l) return;
  if (l.querySelector('.empty')) l.innerHTML = '';
  const d = document.createElement('div');
  d.textContent = '› ' + msg;
  if (type) d.className = 'log-' + type;
  l.appendChild(d);
  l.scrollTop = l.scrollHeight;
}

function label(name) {
  return String(name || '').replaceAll('_', ' ');
}

/* ─── Checklist ─── */
function renderChecklist() {
  const box = $('checklist');
  if (!box) return;
  if (!checks.length) {
    box.innerHTML = '<div class="empty">Waiting for detector checks…</div>';
    return;
  }
  box.innerHTML = '';
  checks.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'check' + (item.done ? ' done' : '');
    const left = document.createElement('div');
    left.className = 'left';
    const tick = document.createElement('span');
    tick.className = 'tick';
    tick.textContent = item.done ? '✓' : '';
    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = label(item.check);
    left.appendChild(tick);
    left.appendChild(name);
    const found = document.createElement('span');
    found.className = 'found';
    found.textContent = item.done ? `${item.found || 0} found` : '…';
    row.appendChild(left);
    row.appendChild(found);
    box.appendChild(row);
  });
}

function setChecks(next) {
  checks = (next || []).map(item => ({ check: item.check, found: item.found || 0, done: !!item.done }));
  renderChecklist();
}

function updateCheck(data) {
  const existing = checks.find(item => item.check === data.check);
  if (existing) { existing.found = data.found || 0; existing.done = true; }
  else checks.push({ check: data.check, found: data.found || 0, done: true });
  renderChecklist();
}

/* ─── Issues Table ─── */
function addIssue(i) {
  const tb = $('tbody');
  if (!tb) return;
  if (tb.querySelector('.empty')) tb.innerHTML = '';
  const tr = document.createElement('tr');
  tr.className = 'row-' + i.severity.toLowerCase();
  tr.innerHTML = `<td><span class="sev ${i.severity.toLowerCase()}">${i.severity}</span></td>
                  <td>${label(i.type)}</td><td>${i.count}</td>`;
  tb.appendChild(tr);
  totals[i.severity] = (totals[i.severity] || 0) + 1;
  totals.total++;
  animateValue('c-total', parseInt($('c-total').textContent || 0), totals.total, 400);
  animateValue('c-high', parseInt($('c-high').textContent || 0), totals.High, 400);
  animateValue('c-med', parseInt($('c-med').textContent || 0), totals.Medium, 400);
  animateValue('c-low', parseInt($('c-low').textContent || 0), totals.Low, 400);
  updateChart();
}

/* ─── AI Title Fixes ─── */
function renderFixes(titles) {
  const ftb = $('fixes-tbody');
  const btn = $('export-fixes-btn');
  if (!ftb) return;
  if (!titles || !titles.length) {
    ftb.innerHTML = '<tr><td colspan="3" class="empty">No AI title fixes generated yet. Run an audit to generate title rewrites.</td></tr>';
    if (btn) btn.style.display = 'none';
    return;
  }
  ftb.innerHTML = '';
  titles.forEach(t => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td style="max-width:240px;overflow-wrap:anywhere;font-size:11px;color:var(--mute)">${t.url}</td>
                    <td style="color:var(--mute)">${t.old || '<em>Missing</em>'}</td>
                    <td contenteditable="true" class="editable-cell">${t.new}</td>`;
    ftb.appendChild(tr);
  });
  if (btn) btn.style.display = 'inline-block';
}

/* ─── Toast Banner ─── */
function showToast(msg, type = 'info', duration = 8000) {
  const toast = $('toast-banner');
  if (!toast) return;
  toast.className = 'toast-banner ' + type;
  toast.innerHTML = `<span>${msg}</span><button class="close-btn" onclick="this.parentElement.style.display='none'">✕</button>`;
  toast.style.display = 'flex';
  if (duration > 0) {
    setTimeout(() => { toast.style.display = 'none'; }, duration);
  }
}

/* ─── Button State ─── */
function setAuditBtnLoading(loading) {
  const btns = [document.getElementById('url-btn'), document.getElementById('landing-audit-btn')];
  btns.forEach(b => {
    if (!b) return;
    b.disabled = loading;
    b.textContent = loading ? '⏳ Auditing...' : '🌐 Audit URL';
  });
}

/* ─── Switch to Cockpit ─── */
function showCockpit() {
  const landing = $('landing');
  const cockpit = $('cockpit');
  if (landing) landing.style.display = 'none';
  if (cockpit) cockpit.style.display = 'block';
}

/* ─── Reset totals ─── */
function resetTotals() {
  totals = { High: 0, Medium: 0, Low: 0, total: 0 };
  ['c-total','c-high','c-med','c-low'].forEach(id => { const el = $(id); if (el) el.textContent = '0'; });
  updateChart();
  updateGauge(0);
}

/* ─── SSE Event Handler ─── */
function handle({ event, data }) {
  if (event === 'snapshot') {
    if (data.site) {
      const m = $('meta'); if (m) m.textContent = '· ' + data.site;
      const u = $('urls'); if (u) u.textContent = (data.urls || 0) + ' URLs';
    }
    setChecks(data.checks || []);
    (data.issues || []).forEach(addIssue);
    if (data.health_score !== undefined) updateGauge(data.health_score);
    if (data.fixes && data.fixes.titles) renderFixes(data.fixes.titles);

  } else if (event === 'loaded') {
    const m = $('meta'), u = $('urls'), tb = $('tbody');
    if (m) m.textContent = '· ' + data.site;
    if (u) u.textContent = data.urls + ' URLs';
    if (tb) tb.innerHTML = '';
    log(`Loaded ${data.urls} URLs from ${data.site}`, 'info');
    resetTotals();
    setChecks([]);
    renderFixes([]);

  } else if (event === 'checks') {
    setChecks(data.checks || []);

  } else if (event === 'progress') {
    updateCheck(data);
    log(`${label(data.check)}: ${data.found || 0} found`);

  } else if (event === 'issue') {
    addIssue(data);
    log(`Found ${data.count} × ${label(data.type)}`);

  } else if (event === 'summary') {
    log(`Audit complete — ${data.total_issues} issue type(s) detected`, 'success');
    showToast(`✅ Audit complete! Found ${data.total_issues} issue types. Scroll down to review fixes.`, 'success', 8000);
    setAuditBtnLoading(false);

  } else if (event === 'score') {
    updateGauge(data.score);

  } else if (event === 'error') {
    const msg = data.message || data.title || 'Audit error occurred';
    log('ERROR: ' + msg, 'error');
    showToast(`⛔ ${msg}`, 'error', 14000);
    setAuditBtnLoading(false);

  } else if (event === 'fixes') {
    const badge = $('fix-badge');
    if (badge) {
      badge.style.display = 'inline-flex';
      badge.textContent = `Fixes Ready: ${(data.titles||[]).length + (data.redirect_map||[]).length}`;
    }
    renderFixes(data.titles || []);
    log(`Fixes ready — ${(data.titles||[]).length} title rewrites, ${(data.redirect_map||[]).length} redirects`, 'success');

  } else if (event === 'exported') {
    const exp = $('export');
    if (exp) exp.innerHTML = '<b>✓ report.html generated!</b><br><span style="color:var(--mute);font-size:12px">Download or email outputs/report.html to your client.</span>';
    showToast('🎉 Client report is ready! Check outputs/report.html', 'success', 8000);
    setAuditBtnLoading(false);

  } else if (event === 'saved') {
    log('report.json saved');
  }
}

/* ─── SSE Connection ─── */
const es = new EventSource('/events');
es.onmessage = (m) => { try { handle(JSON.parse(m.data)); } catch (e) {} };
es.onerror = () => { /* silently reconnect */ };

/* ─── Start Audit (shared) ─── */
function startUrlAudit(url) {
  if (!url) {
    showToast('Please enter a website URL (e.g. https://books.toscrape.com)', 'warning', 5000);
    return;
  }

  // Pre-check for known blocked domains
  if (isDomainBlocked(url)) {
    showToast(`⛔ ${new URL(url.startsWith('http') ? url : 'https://' + url).hostname} is protected by Cloudflare/Bot security. Try books.toscrape.com or quotes.toscrape.com instead!`, 'error', 12000);
    return;
  }

  showCockpit();
  setAuditBtnLoading(true);

  // Copy URL to cockpit input
  const cockpitInput = $('url-input');
  if (cockpitInput) cockpitInput.value = url;

  showToast(`🔍 Crawling ${url}... Please wait 15–30 seconds for results to stream in.`, 'info', 14000);
  log('Starting live crawl for ' + url, 'info');

  fetch('/crawl', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  })
  .then(res => res.json())
  .then(d => log(d.message || 'Crawl started', 'info'))
  .catch(err => {
    log('Connection error: ' + err, 'error');
    showToast(`⛔ Could not connect to server: ${err}`, 'error', 8000);
    setAuditBtnLoading(false);
  });
}

/* ─── Upload CSV (shared) ─── */
function startUpload(file) {
  if (!file) return;
  showCockpit();
  log('Uploading ' + file.name + '...', 'info');
  showToast(`📁 Processing ${file.name}… This takes a few seconds.`, 'info', 6000);
  const fd = new FormData();
  fd.append('file', file);
  fetch('/upload', { method: 'POST', body: fd })
    .then(res => res.json())
    .then(d => log(d.message || 'Audit started', 'info'))
    .catch(err => {
      log('Upload error: ' + err, 'error');
      showToast('⛔ Upload failed: ' + err, 'error', 8000);
    });
}

/* ─── DOM Ready ─── */
document.addEventListener('DOMContentLoaded', () => {

  // ── Landing page audit button ──
  const landingBtn = $('landing-audit-btn');
  const landingInput = $('landing-url');
  if (landingBtn && landingInput) {
    landingBtn.addEventListener('click', () => startUrlAudit(landingInput.value.trim()));
    landingInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') startUrlAudit(landingInput.value.trim()); });
  }

  // ── Landing page file upload ──
  const landingFile = $('landing-file');
  if (landingFile) {
    landingFile.addEventListener('change', (e) => startUpload(e.target.files[0]));
  }

  // ── Cockpit URL audit button ──
  const cockpitBtn = $('url-btn');
  const cockpitInput = $('url-input');
  if (cockpitBtn && cockpitInput) {
    cockpitBtn.addEventListener('click', () => startUrlAudit(cockpitInput.value.trim()));
    cockpitInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') startUrlAudit(cockpitInput.value.trim()); });
  }

  // ── Cockpit CSV upload ──
  const fi = $('file-input');
  if (fi) {
    fi.addEventListener('change', (e) => startUpload(e.target.files[0]));
  }

  // ── Print ──
  const pbtn = $('print-btn');
  if (pbtn) pbtn.addEventListener('click', () => window.print());

  // ── Export fixes CSV ──
  const expbtn = $('export-fixes-btn');
  if (expbtn) {
    expbtn.addEventListener('click', () => {
      const rows = [['url', 'old_title', 'new_title']];
      document.querySelectorAll('#fixes-tbody tr').forEach(tr => {
        const tds = tr.querySelectorAll('td');
        if (tds.length === 3) {
          rows.push([
            `"${tds[0].innerText.replace(/"/g, '""')}"`,
            `"${tds[1].innerText.replace(/"/g, '""')}"`,
            `"${tds[2].innerText.replace(/"/g, '""')}"`
          ]);
        }
      });
      const csv = 'data:text/csv;charset=utf-8,' + rows.map(r => r.join(',')).join('\n');
      const link = document.createElement('a');
      link.setAttribute('href', encodeURI(csv));
      link.setAttribute('download', 'seo_title_fixes.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('✅ CSV downloaded!', 'success', 3000);
    });
  }

});
