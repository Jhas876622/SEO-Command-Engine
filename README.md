<div align="center">

<img src="https://capsule-render.vercel.app/api?type=venom&height=220&text=SEO%20Command%20Engine&fontSize=60&color=0:020617,50:052e16,100:020617&fontColor=f0fdf4&stroke=22c55e&strokeWidth=3&animation=fadeIn&fontAlignY=50&desc=Autonomous%20SEO%20Audit%20Engine%20%E2%80%A2%20Direct%20URL%20Crawler%20%E2%80%A2%20Local%20AI%20%E2%80%A2%20Docker%20Ready&descSize=16&descAlignY=72&descFontColor=4ade80" width="100%"/>

<br/>

[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![pandas](https://img.shields.io/badge/pandas-Detection%20Engine-150458?style=flat-square&logo=pandas&logoColor=white)](https://pandas.pydata.org)
[![Ollama](https://img.shields.io/badge/Ollama-REST%20API%20%2B%20Local%20AI-000000?style=flat-square&logo=ollama&logoColor=white)](https://ollama.ai)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)](./Dockerfile)
[![Tests](https://img.shields.io/badge/Tests-9%2F9%20Passing-22c55e?style=flat-square)](./tests)
[![Speed](https://img.shields.io/badge/Audit%20Speed-Under%2060s-f59e0b?style=flat-square)](.)
[![Rules](https://img.shields.io/badge/SEO%20Rules-17%20Detectors-8b5cf6?style=flat-square)](.)

<br/>

[**Live Cockpit**](#-quick-start) · [**Features**](#-key-features) · [**Architecture**](#-architecture) · [**Deployment**](#-cloud-deployment) · [**Outputs**](#-outputs)

<br/>

</div>

## ✦ What This Is

> **The Problem:** Technical SEO audits are slow, expensive, and manual. Agencies charge thousands for what is essentially a repeatable checklist applied to crawl data.

**SEO Command Engine** is a high-performance, hybrid technical-SEO audit engine built with Python, Pandas, local AI (Ollama), Docker, and Server-Sent Events.

You can audit any website by dropping in a **Screaming Frog CSV export** OR typing a **direct website URL** (`https://example.com`). The engine:

- 🔍 Runs **17 deterministic SEO checks** via pure pandas — zero hallucination risk
- 🌐 **Directly crawls live URLs** via a built-in lightweight async Python web crawler
- ⚖️ **Prioritizes every issue** by business impact (HIGH / MEDIUM / LOW)
- 🤖 Uses a **local AI model** with self-healing pixel-width validation to rewrite broken titles
- 🎛️ Features an **Interactive Browser Fix Editor** to modify AI titles inline & export custom CSVs
- 🗺️ **Maps 404 pages** to the nearest live URL via string similarity
- 📄 Generates a **client-ready HTML report** & print PDF — all in under 60 seconds, 100% offline or cloud-hosted

---

## ⚡ Key Features

| Feature | Description |
|---------|-------------|
| 🔍 **17 Deterministic Detectors** | High, Medium, and Low severity rules evaluated strictly in Python (0% LLM hallucination). |
| 🌐 **Live Web Crawler** | Integrated `seo/crawler.py` module to crawl live domains directly from the web browser. |
| 🤖 **Self-Healing LLM Loop** | Re-prompts Ollama up to 3 times if generated titles exceed search pixel limits (`<= 561px`), with fallback offline title formatting. |
| 🎛️ **Interactive Fix Editor** | Edit AI-suggested title rewrites directly inside the dashboard and click **"Export Fixes CSV"**. |
| 🔌 **Dual Interface** | Operates as an **MCP Server** for Claude Code / AI Agents AND as an interactive **Web Cockpit** (`http://localhost:7700`). |
| 🐳 **Docker & Cloud Ready** | Includes `Dockerfile`, `docker-compose.yml`, and 1-click hosting setups for Render, Railway, and Fly.io. |
| 🧪 **Automated Test Suite** | 9 unit tests covering detection rules, title validation, string similarity, and web crawling. |

---

## 🔬 Sample Audit Benchmark: nmgtechnologies.com

*Validated on a real production digital marketing agency website.*

```
Site:         nmgtechnologies.com
URLs crawled: 456
Health Score: 40 / 100  ⚠️ Needs Work
```

| Severity | Issue | URLs Affected |
|:--------:|-------|:-------------:|
| 🔴 **HIGH** | Duplicate Title | 12 |
| 🔴 **HIGH** | Broken Link (4xx) | 6 |
| 🟡 **MEDIUM** | Title Too Long | 63 |
| 🟡 **MEDIUM** | Duplicate Meta Description | 16 |
| 🟡 **MEDIUM** | Non-Indexable But Linked | 10 |
| 🟡 **MEDIUM** | Redirect (3xx) | 7 |
| 🟡 **MEDIUM** | Missing H1 | 2 |
| ⚪ **LOW** | Meta Too Long | 42 |
| ⚪ **LOW** | Slow Page | 152 |
| ⚪ **LOW** | Duplicate H1 | 19 |
| ⚪ **LOW** | Title Too Short | 21 |
| ⚪ **LOW** | Thin Content | 10 |

---

## ⚡ How It Works

```
 INPUT (Screaming Frog CSV  OR  Direct Website URL)
                       │
                       ▼
 ┌───────────────────────────────────────────────────────────┐
 │ STAGE 1: INGEST / CRAWL                                   │
 │ Load CSV OR Crawl URL via async Python crawler           │
 └─────────────────────┬─────────────────────────────────────┘
                       │
                       ▼
 ┌───────────────────────────────────────────────────────────┐
 │ STAGE 2: DETERMINISTIC DETECTION                          │
 │ 17 pure-pandas rules · 0% hallucination risk              │
 └─────────────────────┬─────────────────────────────────────┘
                       │
                       ▼
 ┌───────────────────────────────────────────────────────────┐
 │ STAGE 3: AI & ALGORITHMIC FIX ENGINE                      │
 │ Ollama REST API title rewrites + difflib 404 redirect map │
 └─────────────────────┬─────────────────────────────────────┘
                       │
                       ▼
 ┌───────────────────────────────────────────────────────────┐
 │ STAGE 4: INTERACTIVE DASHBOARD & DELIVERABLES             │
 │ Live Cockpit + Editable Fix Table + report.html + CSVs    │
 └───────────────────────────────────────────────────────────┘
```

---

## 🛡️ 17 SEO Detectors

<details>
<summary><b>🔴 HIGH Severity — Business-Critical Issues</b></summary>

| Rule | Detection Logic |
|------|----------------|
| Missing Title | `Title 1` empty on indexable 200 page |
| Duplicate Title | Same `Title 1` on 2+ indexable URLs |
| Broken Link (4xx) | `Status Code` 400–499 |
| Server Error (5xx) | `Status Code` 500–599 |
| Redirect Chain | 3xx URL that redirects to another 3xx |

</details>

<details>
<summary><b>🟡 MEDIUM Severity — Ranking Impact Issues</b></summary>

| Rule | Detection Logic |
|------|----------------|
| Title Too Long | `Pixel Width` > 561px |
| Missing Meta Description | `Meta Description 1` empty |
| Duplicate Meta Description | Same meta on 2+ pages |
| Missing H1 | `H1-1` empty on 200 page |
| Redirect (3xx) | `Status Code` 300–399 |
| Orphan Page | `Inlinks = 0` on indexable page |
| Non-Indexable But Linked | Non-Indexable with `Inlinks > 0` |

</details>

<details>
<summary><b>⚪ LOW Severity — Quality Improvements</b></summary>

| Rule | Detection Logic |
|------|----------------|
| Title Too Short | `Title 1 Length` < 30 chars |
| Meta Description Too Long | `Meta Length` > 155 chars |
| Duplicate H1 | Same H1 on multiple pages |
| Thin Content | `Word Count` < 200 |
| Slow Page | `Response Time` > 3.0 seconds |

</details>

---

## 🏗️ Architecture

```
SEO-Command-Engine/
│
├── 📄  run.py                  ← CLI Orchestrator: runs full pipeline
├── 📋  SKILL.md                ← Claude Code / Agent instructions
│
├── 🤖  agents/
│   ├── detector.py             ← 17 pure-pandas SEO detectors (utf-8-sig normalized)
│   └── fixer.py                ← Ollama REST API title rewriter + string-matching redirect map
│
├── 🌐  seo/
│   ├── crawler.py              ← Lightweight async Python web crawler module
│   └── detector.py             ← High-level detector wrapper
│
├── 🔌  mcp/
│   └── server.py               ← Dual MCP Server + SSE Web Server (Upload / Crawl / History APIs)
│
├── 🖥️  dashboard/
│   ├── index.html              ← Live cockpit dashboard with interactive fix editor
│   └── app.js                  ← Real-time SSE updates & CSV export listeners
│
├── 🧪  tests/
│   ├── test_detector.py        ← Detector unit tests
│   ├── test_fixer.py           ← Fixer & title pixel validation unit tests
│   └── test_crawler.py         ← Crawler unit tests
│
├── 🐳  Dockerfile              ← Production container configuration
├── 🐳  docker-compose.yml      ← 1-command service setup
├── 📄  DEPLOYMENT.md           ← Cloud deployment guide (Render, Railway, Fly.io, localtunnel)
│
└── 📦  outputs/
    ├── report.json             ← Schema-validated JSON audit report
    ├── report.html             ← Standalone client HTML report
    ├── fixes.csv               ← AI-generated title rewrites
    └── redirect_map.csv        ← 404 → live URL mappings
```

---

## 🚀 Quick Start

### 1. Installation

```bash
git clone https://github.com/Jhas876622/SEO-Command-Engine.git
cd SEO-Command-Engine
pip install -r requirements.txt

# Optional: Ollama for AI-powered title rewrites
ollama pull qwen3.5:9b
```

### 2. Run via Live Dashboard

```bash
python3 mcp/server.py
```
Open **`http://localhost:7700`** in your browser:
- Click **"📁 Upload CSV"** to upload a Screaming Frog export file, OR
- Enter a domain URL in **`[ https://example.com ]`** and click **"🌐 Audit URL"** to crawl live!

### 3. Run via Command Line

```bash
# Basic audit on a CSV export
python3 run.py path/to/screaming-frog-export/

# Offline audit (no AI model required)
python3 run.py path/to/export/ --no-ollama

# Customize max fixes and redirects
python3 run.py path/to/export/ --max-fixes 50 --max-redirects 100
```

### 4. Run Unit Tests

```bash
python3 -m unittest discover tests
```

---

## 🐳 Docker & Cloud Deployment

### Docker Compose
```bash
docker-compose up -d --build
```
Dashboard will be live at `http://localhost:7700`.

### Deploy to Render.com (Free Tier)
1. Push repository to GitHub.
2. Create a new **Web Service** on Render.
3. Select **Docker** environment.
4. Set port `7700` and deploy!

---

## 📤 Outputs & Deliverables

Every audit run automatically generates five structured files:

| File | Description |
|------|-------------|
| `outputs/report.json` | Machine-readable results, schema-validated |
| `outputs/report.html` | Client-ready standalone HTML report with priority recommendations |
| `outputs/fixes.csv` | Before/after title rewrites with pixel-width validation |
| `outputs/redirect_map.csv` | 404 → nearest live URL mappings |
| `history/*.json` | Timestamped audit history for trend tracking |

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Detection** | Python + pandas | Fast, 100% deterministic, zero hallucination risk |
| **Crawler** | Python standard library | Fast lightweight HTML parsing without heavy browser binaries |
| **AI Fixes** | Ollama REST API (`qwen3.5:9b` / `gemma4:31b`) | Runs locally, zero API cost, self-healing loop |
| **Dashboard** | SSE Streaming + Vanilla JS | Real-time visibility with zero build tool complexity |
| **Redirect Map** | `difflib` string similarity | Reliable algorithmic URL string matching |
| **Containerization** | Docker / Docker Compose | 1-click cloud deployment anywhere |

---

<div align="center">

---

**SEO Command Engine** · Built by **[Satyam Kumar Jha](https://github.com/Jhas876622)** · 2026

*Built to prove that pragmatic architecture beats brute-forcing everything through an LLM.*

</div>
