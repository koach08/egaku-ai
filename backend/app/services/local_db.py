"""Local SQLite database for self-hosted mode (no Supabase needed)."""

import json
import sqlite3
import uuid
from datetime import datetime
from pathlib import Path

DB_PATH = Path("./data/ai_studio.db")


def _get_conn() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db():
    """Create tables if they don't exist."""
    conn = _get_conn()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS generations (
            id TEXT PRIMARY KEY,
            prompt TEXT NOT NULL,
            negative_prompt TEXT DEFAULT '',
            model TEXT DEFAULT '',
            params_json TEXT DEFAULT '{}',
            nsfw_flag INTEGER DEFAULT 0,
            image_path TEXT,
            video_path TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        );
    """)
    conn.commit()
    conn.close()


def save_generation(prompt: str, negative_prompt: str, model: str,
                    params: dict, nsfw: bool, image_path: str = None,
                    video_path: str = None) -> str:
    gen_id = str(uuid.uuid4())
    conn = _get_conn()
    conn.execute(
        "INSERT INTO generations (id, prompt, negative_prompt, model, params_json, nsfw_flag, image_path, video_path) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (gen_id, prompt, negative_prompt, model, json.dumps(params), int(nsfw), image_path, video_path),
    )
    conn.commit()
    conn.close()
    return gen_id


def list_generations(limit: int = 50, offset: int = 0, nsfw_filter: str = "all") -> list[dict]:
    conn = _get_conn()
    query = "SELECT * FROM generations"
    params = []
    if nsfw_filter == "sfw":
        query += " WHERE nsfw_flag = 0"
    elif nsfw_filter == "nsfw":
        query += " WHERE nsfw_flag = 1"
    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_generation(gen_id: str) -> dict | None:
    conn = _get_conn()
    row = conn.execute("SELECT * FROM generations WHERE id = ?", (gen_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def delete_generation(gen_id: str) -> bool:
    conn = _get_conn()
    cursor = conn.execute("DELETE FROM generations WHERE id = ?", (gen_id,))
    conn.commit()
    conn.close()
    return cursor.rowcount > 0


def count_generations(nsfw_filter: str = "all") -> int:
    conn = _get_conn()
    query = "SELECT COUNT(*) FROM generations"
    if nsfw_filter == "sfw":
        query += " WHERE nsfw_flag = 0"
    elif nsfw_filter == "nsfw":
        query += " WHERE nsfw_flag = 1"
    count = conn.execute(query).fetchone()[0]
    conn.close()
    return count
