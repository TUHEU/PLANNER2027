"""Validation partagée (mêmes règles que TaskLink pour l'e-mail, le nom, le téléphone et le mot de passe).

Chaque fonction `*_problem` renvoie None si tout est bon, sinon un code d'erreur stable
(le frontend le traduit en français ou en anglais).
"""
import re
from flask import request, jsonify

# E-mail : minuscules uniquement ; la partie locale COMMENCE par une lettre et finit par une lettre ou un chiffre,
# pas de "..", 64 caractères maximum avant le @, un vrai domaine avec au moins un point.
EMAIL_RE = re.compile(r"""^(?=[^@]{1,64}@)(?!.*\.\.)
    [a-z](?:[a-z0-9._%+-]*[a-z0-9])?
    @(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$""", re.X)
NAME_RE = re.compile(r"^[^\W\d_]+(?:[ '’.-]{1,2}[^\W\d_]+)*\.?$")   # lettres, espaces, - ' .
COMMON_PASSWORDS = {
    "password", "password1", "motdepasse", "motdepasse1", "12345678", "123456789", "1234567890",
    "qwerty123", "azerty123", "azertyui", "qwertyui", "11111111", "00000000", "planner2027",
    "planner1", "abcd1234", "abc12345", "iloveyou1",
}


def valid_email(e):
    """Contrôle strict. Les majuscules sont refusées (l'appelant ne doit pas passer l'e-mail en minuscules avant)."""
    if len(e) > 120 or not EMAIL_RE.match(e):
        return False
    local, domain = e.rsplit("@", 1)
    if not re.search(r"[a-z]", local.split("+", 1)[0]):      # que des chiffres avant le @
        return False
    if domain in ("gmail.com", "googlemail.com"):
        # Vrais noms Gmail : 6 à 30 lettres, chiffres ou points (un +tag optionnel est accepté)
        return bool(re.fullmatch(r"[a-z0-9.]{6,30}", local.split("+", 1)[0]))
    return True


def email_problem(e):
    if e != e.lower():
        return "email_case"
    if not valid_email(e):
        return "bad_email"
    return None


def clean_name(n):
    return re.sub(r"\s+", " ", n or "").strip()


def valid_name(n):
    return 2 <= len(n) <= 80 and bool(NAME_RE.match(n))


def password_problem(pw, email="", name=""):
    if len(pw) < 8:
        return "pw_short"
    if len(pw) > 128:
        return "too_long"
    if not re.search(r"[^\W\d_]", pw) or not re.search(r"\d", pw):
        return "pw_letters_digit"
    low = pw.lower()
    if low in COMMON_PASSWORDS or low == (email or "").split("@")[0].lower() \
            or low == (name or "").lower().replace(" ", ""):
        return "pw_easy"
    return None


def clean_phone(p):
    """Numéro propre ou None. Cameroun : 9 chiffres commençant par 6 ou 2 (avec ou sans +237) -> +237XXXXXXXXX ;
    autres pays : forme internationale +<indicatif><numéro> (8 à 15 chiffres)."""
    n = re.sub(r"[\s().-]", "", p or "")
    if n.startswith("00"):
        n = "+" + n[2:]
    m = re.fullmatch(r"(?:\+?237)?([62]\d{8})", n)
    if m:
        n = "+237" + m.group(1)
    elif n.startswith("+237") or not re.fullmatch(r"\+[1-9]\d{7,14}", n):
        return None
    digits = n[5:] if n.startswith("+237") else n.lstrip("+")
    if len(set(digits)) == 1:                      # 600000000, 666666666 ...
        return None
    return n


def body():
    d = request.get_json(silent=True)
    return d if isinstance(d, dict) else {}


def fail(code, status=400):
    """Erreur JSON : `code` est stable, `error` est le même code (lisible en dev)."""
    return jsonify(code=code, error=code), status


def text(d, key):
    v = d.get(key, "")
    if isinstance(v, bool) or not isinstance(v, (str, int, float)):
        return ""
    return str(v).strip()
