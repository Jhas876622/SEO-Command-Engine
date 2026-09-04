"""
db.py — persistent SQLite database layer for SEO Command Center.

Saves audit history, scores, issues, AI title rewrites, and recommendations
so state survives server/Render container restarts.
"""

from __future__ import annotations

import json
import sqlite3
from datetime import datetime
from pathlib import Path

import contextlib

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_DB_PATH = ROOT / "outputs" / "audits.db"


@contextlib.contextmanager
def _get_connection(db_path: Path | str | None = None):
    path = Path(db_path or DEFAULT_DB_PATH)
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(path), timeout=10.0)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def init_db(db_path: Path | str | None = None) -> None:
    """Initialize the audits table and indexes if they do not exist."""
    with _get_connection(db_path) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS audits (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                site TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                urls_count INTEGER DEFAULT 0,
                health_score INTEGER DEFAULT 100,
                status TEXT DEFAULT 'done',
                summary_json TEXT,
                score_breakdown_json TEXT,
                issues_json TEXT,
                fixes_json TEXT,
                recommendations_json TEXT,
                run_meta_json TEXT
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_audits_site ON audits(site)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_audits_created ON audits(created_at DESC)")
        conn.commit()


def save_audit(run_dict: dict, db_path: Path | str | None = None) -> int:
    """Persist a completed audit run to SQLite. Returns inserted audit ID."""
    init_db(db_path)
    site = run_dict.get("site") or "unknown"
    urls_count = int(run_dict.get("urls") or run_dict.get("urls_crawled") or 0)
    score = int(run_dict.get("health_score") or 100)
    status = run_dict.get("status") or "done"

    summary_json = json.dumps(run_dict.get("summary") or {})
    score_breakdown_json = json.dumps(run_dict.get("score_breakdown") or {})
    issues_json = json.dumps(run_dict.get("issues") or [])
    fixes_json = json.dumps(run_dict.get("fixes") or {})
    recommendations_json = json.dumps(run_dict.get("recommendations") or [])
    run_meta_json = json.dumps(run_dict.get("run_meta") or {})

    with _get_connection(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO audits (
                site, urls_count, health_score, status,
                summary_json, score_breakdown_json, issues_json,
                fixes_json, recommendations_json, run_meta_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            site, urls_count, score, status,
            summary_json, score_breakdown_json, issues_json,
            fixes_json, recommendations_json, run_meta_json
        ))
        conn.commit()
        return cursor.lastrowid


def get_latest_audit(db_path: Path | str | None = None) -> dict | None:
    """Retrieve the most recent completed audit to restore server state on restart."""
    init_db(db_path)
    with _get_connection(db_path) as conn:
        row = conn.execute("""
            SELECT * FROM audits 
            WHERE status = 'done' 
            ORDER BY id DESC LIMIT 1
        """).fetchone()

        if not row:
            return None

        return _row_to_dict(row)


def get_audit_history(limit: int = 50, db_path: Path | str | None = None) -> list[dict]:
    """Retrieve summarized audit history for the cockpit history viewer."""
    init_db(db_path)
    with _get_connection(db_path) as conn:
        rows = conn.execute("""
            SELECT id, site, created_at, urls_count, health_score, status, summary_json
            FROM audits
            ORDER BY id DESC LIMIT ?
        """, (limit,)).fetchall()

        history = []
        for r in rows:
            try:
                summary = json.loads(r["summary_json"] or "{}")
            except Exception:
                summary = {}

            history.append({
                "id": r["id"],
                "site": r["site"],
                "created_at": r["created_at"],
                "health_score": r["health_score"],
                "urls_crawled": r["urls_count"],
                "total_issues": summary.get("total_issues", 0),
                "by_severity": summary.get("by_severity", {})
            })
        return history


def _row_to_dict(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "site": row["site"],
        "created_at": row["created_at"],
        "urls": row["urls_count"],
        "urls_crawled": row["urls_count"],
        "health_score": row["health_score"],
        "status": row["status"],
        "summary": json.loads(row["summary_json"] or "{}"),
        "score_breakdown": json.loads(row["score_breakdown_json"] or "{}"),
        "issues": json.loads(row["issues_json"] or "[]"),
        "fixes": json.loads(row["fixes_json"] or "{}"),
        "recommendations": json.loads(row["recommendations_json"] or "[]"),
        "run_meta": json.loads(row["run_meta_json"] or "{}"),
    }
