"""Backend Flask du Planner 2027.

Lancer :  python app.py   (puis ouvrir http://localhost:5000)

- Stockage : SQLite (planner.db, créé automatiquement à côté de ce fichier)
- API :
    GET  /api/pages          -> toutes les pages enregistrées {cle: {data, updated_at}}
    GET  /api/pages/<cle>    -> une page
    PUT  /api/pages/<cle>    -> enregistre une page (corps JSON : {"data": {...}})
    DELETE /api/pages/<cle>  -> efface une page
    GET  /api/health         -> test de vie
- Si le dossier ../frontend/dist existe (après `npm run build`), Flask sert aussi le site.
"""
import json
import os
import re
import sqlite3
from datetime import datetime, timezone

from flask import Flask, jsonify, request, send_from_directory

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.environ.get("PLANNER_DB", os.path.join(BASE_DIR, "planner.db"))
DIST_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "frontend", "dist"))

KEY_RE = re.compile(r"^[a-z0-9_\-]{1,64}$")
MAX_BODY = 1_000_000  # 1 Mo par page, largement suffisant

app = Flask(__name__, static_folder=None)
app.config["MAX_CONTENT_LENGTH"] = MAX_BODY


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_db() as conn:
        conn.execute(
            """CREATE TABLE IF NOT EXISTS pages (
                   cle TEXT PRIMARY KEY,
                   data TEXT NOT NULL,
                   updated_at TEXT NOT NULL
               )"""
        )


@app.after_request
def cors(resp):
    # Utile seulement si le front tourne sur un autre port (npm run dev sans proxy)
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type"
    resp.headers["Access-Control-Allow-Methods"] = "GET, PUT, DELETE, OPTIONS"
    return resp


@app.route("/api/health")
def health():
    return jsonify(ok=True)


@app.route("/api/pages", methods=["GET"])
def list_pages():
    with get_db() as conn:
        rows = conn.execute("SELECT cle, data, updated_at FROM pages").fetchall()
    return jsonify({r["cle"]: {"data": json.loads(r["data"]), "updated_at": r["updated_at"]} for r in rows})


@app.route("/api/pages/<cle>", methods=["GET"])
def get_page(cle):
    if not KEY_RE.match(cle):
        return jsonify(error="clé invalide"), 400
    with get_db() as conn:
        row = conn.execute("SELECT data, updated_at FROM pages WHERE cle = ?", (cle,)).fetchone()
    if row is None:
        return jsonify(data={}, updated_at=None)
    return jsonify(data=json.loads(row["data"]), updated_at=row["updated_at"])


@app.route("/api/pages/<cle>", methods=["PUT", "OPTIONS"])
def put_page(cle):
    if request.method == "OPTIONS":
        return ("", 204)
    if not KEY_RE.match(cle):
        return jsonify(error="clé invalide"), 400
    body = request.get_json(silent=True)
    if not isinstance(body, dict) or not isinstance(body.get("data"), dict):
        return jsonify(error='corps attendu : {"data": {...}}'), 400
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    with get_db() as conn:
        conn.execute(
            """INSERT INTO pages (cle, data, updated_at) VALUES (?, ?, ?)
               ON CONFLICT(cle) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at""",
            (cle, json.dumps(body["data"], ensure_ascii=False), now),
        )
    return jsonify(ok=True, updated_at=now)


@app.route("/api/pages/<cle>", methods=["DELETE"])
def delete_page(cle):
    if not KEY_RE.match(cle):
        return jsonify(error="clé invalide"), 400
    with get_db() as conn:
        conn.execute("DELETE FROM pages WHERE cle = ?", (cle,))
    return jsonify(ok=True)


# ---------- Service du site React compilé ----------
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_front(path):
    if not os.path.isdir(DIST_DIR):
        return (
            "Frontend non compilé. Lance `npm install && npm run build` dans le dossier frontend, "
            "ou utilise `npm run dev` (http://localhost:5173).",
            200,
        )
    full = os.path.join(DIST_DIR, path)
    if path and os.path.isfile(full):
        return send_from_directory(DIST_DIR, path)
    return send_from_directory(DIST_DIR, "index.html")


init_db()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
