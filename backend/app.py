"""Backend Flask du Planner 2027 (comptes + données par utilisateur).

Lancer :  python app.py   (puis ouvrir http://localhost:5000)

- Stockage : SQLite (planner.db, créé automatiquement à côté de ce fichier)
- Comptes : inscription / connexion par e-mail avec les mêmes restrictions que TaskLink
  (e-mail strict en minuscules, nom réel, téléphone valide, mot de passe solide,
  5 essais ratés max par 10 minutes, mots de passe hachés, sessions de 7 jours).
- Chaque personne ne voit et ne modifie que ses propres pages.

API (toutes en JSON) :
    POST /api/register          crée le compte et connecte
    POST /api/login             connexion
    POST /api/logout            déconnexion
    GET  /api/me                profil de la personne connectée (401 sinon)
    PUT  /api/me                modifie nom, téléphone, e-mail, langue, thème
    PUT  /api/me/password       change le mot de passe
    GET  /api/pages             toutes mes pages
    GET/PUT/DELETE /api/pages/<cle>
    GET  /api/health
"""
import json
import logging
import os
import secrets
import sqlite3
import time
from contextlib import closing
from datetime import datetime, timedelta, timezone
from functools import wraps

from flask import Flask, jsonify, request, send_from_directory, session
from werkzeug.exceptions import HTTPException
from werkzeug.security import check_password_hash, generate_password_hash

import helpers as H

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.environ.get("PLANNER_DB", os.path.join(BASE_DIR, "planner.db"))
DIST_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "frontend", "dist"))

MONTH_IDS = ["janvier", "fevrier", "mars", "avril", "mai", "juin", "juillet",
             "aout", "septembre", "octobre", "novembre", "decembre"]
PAGE_KEYS = {"objectifs", "bilan_annee", "notes"} | {f"{m}_{p}" for m in MONTH_IDS for p in ("mois", "budget")}
LANGS = ("fr", "en")
THEMES = ("or", "nuit", "rose")

WINDOW, MAX_TRIES = 600, 5          # 5 essais ratés par 10 minutes
attempts = {}                       # clé -> instants des derniers échecs (en mémoire)


def load_secret_key():
    """Clé stable pour que les connexions survivent à un redémarrage.
    Priorité : variable SECRET_KEY, puis backend/.secret_key (créé au premier lancement)."""
    if os.environ.get("SECRET_KEY"):
        return os.environ["SECRET_KEY"]
    path = os.path.join(BASE_DIR, ".secret_key")
    try:
        with open(path) as f:
            key = f.read().strip()
        if key:
            return key
    except OSError:
        pass
    key = secrets.token_hex(32)
    try:
        with open(path, "w") as f:
            f.write(key)
        os.chmod(path, 0o600)
    except OSError:
        pass
    return key


app = Flask(__name__, static_folder=None)
app.secret_key = load_secret_key()
app.config.update(
    MAX_CONTENT_LENGTH=1_000_000,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SECURE=os.environ.get("COOKIE_SECURE") == "1",   # mettre COOKIE_SECURE=1 derrière HTTPS
)
app.permanent_session_lifetime = timedelta(days=7)


# ---------------------------------------------------------------- base de données
def q(sql, args=(), one=False, commit=False):
    with closing(sqlite3.connect(DB_PATH)) as conn:
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        cur = conn.execute(sql, args)
        if commit:
            conn.commit()
            return cur.lastrowid
        return cur.fetchone() if one else cur.fetchall()


def init_db():
    with closing(sqlite3.connect(DB_PATH)) as conn:
        conn.execute("PRAGMA foreign_keys = ON")
        conn.execute(
            """CREATE TABLE IF NOT EXISTS users (
                   id INTEGER PRIMARY KEY AUTOINCREMENT,
                   full_name TEXT NOT NULL,
                   phone TEXT NOT NULL,
                   email TEXT NOT NULL UNIQUE,
                   password TEXT NOT NULL,
                   lang TEXT NOT NULL DEFAULT 'fr',
                   theme TEXT NOT NULL DEFAULT 'or',
                   created_at TEXT NOT NULL
               )"""
        )
        cols = [r[1] for r in conn.execute("PRAGMA table_info(pages)")]
        if cols and "user_id" not in cols:
            # Ancienne version sans comptes : on garde les pages pour le premier compte créé.
            conn.execute("ALTER TABLE pages RENAME TO legacy_pages")
        conn.execute(
            """CREATE TABLE IF NOT EXISTS pages (
                   user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                   cle TEXT NOT NULL,
                   data TEXT NOT NULL,
                   updated_at TEXT NOT NULL,
                   PRIMARY KEY (user_id, cle)
               )"""
        )
        conn.commit()


def now_iso():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


# ---------------------------------------------------------------- sessions
def public_user(u):
    return {"id": u["id"], "full_name": u["full_name"], "phone": u["phone"], "email": u["email"],
            "lang": u["lang"], "theme": u["theme"]}


def current_user():
    uid = session.get("uid")
    if uid is None:
        return None
    u = q("SELECT * FROM users WHERE id=?", (uid,), one=True)
    if not u:
        session.clear()
    return u


def login_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        u = current_user()
        if not u:
            return H.fail("login_required", 401)
        return f(u, *args, **kwargs)
    return wrapper


def too_many(key):
    now = time.time()
    recent = [t for t in attempts.get(key, []) if now - t < WINDOW]
    attempts[key] = recent
    return len(recent) >= MAX_TRIES


def note_failure(key):
    attempts[key] = attempts.get(key, []) + [time.time()]


def start_session(uid):
    session.clear()
    session.permanent = True
    session["uid"] = uid


# ---------------------------------------------------------------- comptes
@app.post("/api/register")
def register():
    d = H.body()
    name, phone, email = H.clean_name(H.text(d, "full_name")), H.text(d, "phone"), H.text(d, "email")
    password = d.get("password")
    if not (name and phone and email) or not isinstance(password, str) or not password:
        return H.fail("required")
    if len(password) > 128 or len(name) > 80:
        return H.fail("too_long")
    problem = H.email_problem(email)
    if problem:
        return H.fail(problem)
    if not H.valid_name(name):
        return H.fail("bad_name")
    phone = H.clean_phone(phone)
    if not phone:
        return H.fail("bad_phone")
    problem = H.password_problem(password, email, name)
    if problem:
        return H.fail(problem)
    if q("SELECT id FROM users WHERE email=?", (email,), one=True):
        return H.fail("email_used", 409)
    first = q("SELECT COUNT(*) AS c FROM users", one=True)["c"] == 0
    lang = d.get("lang") if d.get("lang") in LANGS else "fr"
    theme = d.get("theme") if d.get("theme") in THEMES else "or"
    try:
        uid = q("INSERT INTO users (full_name, phone, email, password, lang, theme, created_at) VALUES (?,?,?,?,?,?,?)",
                (name, phone, email, generate_password_hash(password), lang, theme, now_iso()), commit=True)
    except sqlite3.IntegrityError:                  # deux inscriptions simultanées avec le même e-mail
        return H.fail("email_used", 409)
    if first and q("SELECT 1 FROM sqlite_master WHERE type='table' AND name='legacy_pages'", one=True):
        q("INSERT INTO pages (user_id, cle, data, updated_at) SELECT ?, cle, data, updated_at FROM legacy_pages",
          (uid,), commit=True)
    start_session(uid)
    return jsonify(ok=True, user=public_user(q("SELECT * FROM users WHERE id=?", (uid,), one=True)))


@app.post("/api/login")
def login():
    d = H.body()
    key, password = H.text(d, "email").lower(), d.get("password")
    if not key or not isinstance(password, str) or not password:
        return H.fail("bad_login", 401)
    if too_many(key):
        return H.fail("too_many", 429)
    u = q("SELECT * FROM users WHERE email=?", (key,), one=True)
    if not u or not check_password_hash(u["password"], password):
        note_failure(key)
        return H.fail("bad_login", 401)
    attempts.pop(key, None)
    start_session(u["id"])
    return jsonify(ok=True, user=public_user(u))


@app.post("/api/logout")
def logout():
    session.clear()
    return jsonify(ok=True)


@app.get("/api/me")
@login_required
def me(u):
    return jsonify(user=public_user(u))


@app.put("/api/me")
@login_required
def update_me(u):
    d = H.body()
    name, phone, email = u["full_name"], u["phone"], u["email"]
    lang, theme = u["lang"], u["theme"]

    if "full_name" in d:
        name = H.clean_name(H.text(d, "full_name"))
        if not H.valid_name(name):
            return H.fail("bad_name")
    if "phone" in d:
        phone = H.clean_phone(H.text(d, "phone"))
        if not phone:
            return H.fail("bad_phone")
    if "email" in d:
        email = H.text(d, "email")
        problem = H.email_problem(email)
        if problem:
            return H.fail(problem)
        taken = q("SELECT id FROM users WHERE email=? AND id<>?", (email, u["id"]), one=True)
        if taken:
            return H.fail("email_used", 409)
    if "lang" in d:
        if d["lang"] not in LANGS:
            return H.fail("bad_value")
        lang = d["lang"]
    if "theme" in d:
        if d["theme"] not in THEMES:
            return H.fail("bad_value")
        theme = d["theme"]
    try:
        q("UPDATE users SET full_name=?, phone=?, email=?, lang=?, theme=? WHERE id=?",
          (name, phone, email, lang, theme, u["id"]), commit=True)
    except sqlite3.IntegrityError:
        return H.fail("email_used", 409)
    return jsonify(ok=True, user=public_user(q("SELECT * FROM users WHERE id=?", (u["id"],), one=True)))


@app.put("/api/me/password")
@login_required
def change_password(u):
    d = H.body()
    current, new = d.get("current_password"), d.get("new_password")
    if not isinstance(current, str) or not isinstance(new, str) or not current or not new:
        return H.fail("required")
    key = f"pw:{u['id']}"
    if too_many(key):
        return H.fail("too_many", 429)
    if not check_password_hash(u["password"], current):
        note_failure(key)
        return H.fail("wrong_current_password", 401)
    problem = H.password_problem(new, u["email"], u["full_name"])
    if problem:
        return H.fail(problem)
    if current == new:
        return H.fail("pw_same")
    attempts.pop(key, None)
    q("UPDATE users SET password=? WHERE id=?", (generate_password_hash(new), u["id"]), commit=True)
    return jsonify(ok=True)


# ---------------------------------------------------------------- pages (par utilisateur)
def key_ok(cle):
    return cle in PAGE_KEYS


@app.get("/api/health")
def health():
    return jsonify(ok=True)


@app.get("/api/pages")
@login_required
def list_pages(u):
    rows = q("SELECT cle, data, updated_at FROM pages WHERE user_id=?", (u["id"],))
    return jsonify({r["cle"]: {"data": json.loads(r["data"]), "updated_at": r["updated_at"]} for r in rows})


@app.get("/api/pages/<cle>")
@login_required
def get_page(u, cle):
    if not key_ok(cle):
        return H.fail("bad_key")
    row = q("SELECT data, updated_at FROM pages WHERE user_id=? AND cle=?", (u["id"], cle), one=True)
    if row is None:
        return jsonify(data={}, updated_at=None)
    return jsonify(data=json.loads(row["data"]), updated_at=row["updated_at"])


@app.put("/api/pages/<cle>")
@login_required
def put_page(u, cle):
    if not key_ok(cle):
        return H.fail("bad_key")
    b = H.body()
    if not isinstance(b.get("data"), dict):
        return H.fail("bad_body")
    now = now_iso()
    q("""INSERT INTO pages (user_id, cle, data, updated_at) VALUES (?, ?, ?, ?)
         ON CONFLICT(user_id, cle) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at""",
      (u["id"], cle, json.dumps(b["data"], ensure_ascii=False), now), commit=True)
    return jsonify(ok=True, updated_at=now)


@app.delete("/api/pages/<cle>")
@login_required
def delete_page(u, cle):
    if not key_ok(cle):
        return H.fail("bad_key")
    q("DELETE FROM pages WHERE user_id=? AND cle=?", (u["id"], cle), commit=True)
    return jsonify(ok=True)


# ---------------------------------------------------------------- site React compilé
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_front(path):
    if path.startswith("api/"):
        return H.fail("not_found", 404)
    if not os.path.isdir(DIST_DIR):
        return ("Frontend non compilé. Lance `npm install && npm run build` dans le dossier frontend, "
                "ou utilise `npm run dev` (http://localhost:5173).", 200)
    if path and os.path.isfile(os.path.join(DIST_DIR, path)):
        return send_from_directory(DIST_DIR, path)
    return send_from_directory(DIST_DIR, "index.html")


@app.after_request
def headers(resp):
    resp.headers.setdefault("X-Content-Type-Options", "nosniff")
    resp.headers.setdefault("Referrer-Policy", "same-origin")
    if request.path.startswith("/api/"):
        resp.headers["Cache-Control"] = "no-store"
    return resp


@app.errorhandler(HTTPException)
def http_error(e):
    if request.path.startswith("/api/"):
        return jsonify(code="http_%s" % e.code, error=e.description), e.code
    return e


@app.errorhandler(Exception)
def server_error(e):
    logging.exception("Erreur non gérée")
    if request.path.startswith("/api/"):
        return jsonify(code="server", error="server"), 500
    return "Une erreur est survenue", 500


init_db()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
