import React, { useEffect, useRef, useState } from "react";
import { api } from "./api.js";
import { WA_DISPLAY, WA_NUMBER, YEAR } from "./data.js";
import { useLang, errText } from "./i18n.jsx";

// Mêmes motifs que TaskLink (contrôle immédiat dans le navigateur ; le serveur refait toujours les vérifications)
export const EMAIL_PATTERN =
  "(?!.*\\.\\.)[a-z](?:[a-z0-9._%+\\-]*[a-z0-9])?@(?:[a-z0-9](?:[a-z0-9\\-]{0,61}[a-z0-9])?\\.)+[a-z]{2,24}";
export const NAME_PATTERN = "\\p{L}+(?:[ '’.\\-]{1,2}\\p{L}+)*\\.?";
export const PHONE_PATTERN = "[+0-9 \\(\\)\\.\\-]{9,25}";
export const PASSWORD_PATTERN = "(?=.*[A-Za-z])(?=.*[0-9]).{8,128}";

/* ---------- Pop-up WhatsApp ---------- */

export function WhatsAppModal({ open, onClose }) {
  const { t } = useLang();
  const [copied, setCopied] = useState(false);
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    setCopied(false);
    closeRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const link = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(t("Bonjour, j’ai besoin d’aide pour mon Planner 2027."))}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(WA_DISPLAY);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* presse-papiers indisponible */
    }
  };
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="wa-title">
        <button ref={closeRef} type="button" className="modal-x" onClick={onClose} aria-label={t("Fermer")}>
          ×
        </button>
        <div className="brand">{t("MON PLANNER")} {YEAR}</div>
        <h2 id="wa-title" className="modal-title">{t("Contactez-nous sur WhatsApp")}</h2>
        <p className="modal-text">
          {t("Une question, un mot de passe oublié ou un souci avec ton compte ? Écris-nous sur ce numéro :")}
        </p>
        <div className="wa-number" data-testid="wa-number">{WA_DISPLAY}</div>
        <div className="modal-actions">
          <a className="gold-btn" href={link} target="_blank" rel="noopener noreferrer">
            {t("Ouvrir WhatsApp")}
          </a>
          <button type="button" className="ghost-btn" onClick={copy}>
            {copied ? t("Copié ✓") : t("Copier le numéro")}
          </button>
        </div>
      </div>
    </div>
  );
}

export function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <div className="lang-toggle" role="group" aria-label="Langue / Language">
      {["fr", "en"].map((l) => (
        <button key={l} type="button" className={lang === l ? "on" : ""} onClick={() => setLang(l)}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function PasswordField({ label, value, onChange, autoComplete, pattern, placeholder, name }) {
  const { t } = useLang();
  const [show, setShow] = useState(false);
  return (
    <label className="box field">
      <span className="box-title">{label}</span>
      <span className="pw-row">
        <input
          name={name}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          minLength={pattern ? 8 : undefined}
          maxLength={128}
          pattern={pattern}
          title={pattern ? t("Au moins 8 caractères, avec une lettre et un chiffre") : undefined}
          placeholder={placeholder}
          required
        />
        <button type="button" className="pw-eye" onClick={() => setShow((s) => !s)} aria-pressed={show}>
          {show ? t("Masquer") : t("Afficher")}
        </button>
      </span>
    </label>
  );
}

/* ---------- Écran de connexion / création de compte ---------- */

export default function AuthScreen({ onAuth, onWhatsApp }) {
  const { t, lang } = useLang();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [f, setF] = useState({ full_name: "", phone: "", email: "", password: "", confirm: "" });
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: typeof v === "string" ? v : v.target.value }));

  const switchMode = (m) => {
    setMode(m);
    setError("");
    setF((s) => ({ ...s, password: "", confirm: "" }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (mode === "register" && f.password !== f.confirm) {
      setError(t("Les deux mots de passe ne sont pas identiques"));
      return;
    }
    setBusy(true);
    try {
      const r =
        mode === "login"
          ? await api("/login", "POST", { email: f.email, password: f.password })
          : await api("/register", "POST", {
              full_name: f.full_name,
              phone: f.phone,
              email: f.email,
              password: f.password,
              lang,
              theme: localStorage.getItem("planner_theme") || "or",
            });
      onAuth(r.user);
    } catch (err) {
      setError(errText(err, t));
      setBusy(false);
    }
  };

  const isLogin = mode === "login";
  return (
    <div className="auth">
      <div className="auth-top">
        <LangToggle />
      </div>

      <div className="auth-grid">
        <aside className="auth-cover" aria-hidden="true">
          <img src="/cover.jpg" alt="" />
        </aside>

        <section className="sheet auth-sheet">
          <header className="sheet-head">
            <div className="brand">{t("MON PLANNER")} {YEAR}</div>
            <h1 className="title">
              {isLogin ? t("Connexion") : t("Créer mon compte")}
              <small>{isLogin ? t("Content de te revoir") : t("Commence ton année 2027")}</small>
            </h1>
            <div className="pill">{isLogin ? t("ACCÈS À MON PLANNER") : t("NOUVEAU COMPTE")}</div>
          </header>

          <form onSubmit={submit} className="auth-form" noValidate={false}>
            {!isLogin && (
              <>
                <label className="box field">
                  <span className="box-title">{t("Nom complet")}</span>
                  <input
                    name="full_name"
                    type="text"
                    value={f.full_name}
                    onChange={set("full_name")}
                    autoComplete="name"
                    minLength={2}
                    maxLength={80}
                    pattern={NAME_PATTERN}
                    title={t("Lettres uniquement (accents, espace, tiret et apostrophe acceptés)")}
                    placeholder={t("Ton nom complet")}
                    required
                  />
                </label>
                <label className="box field">
                  <span className="box-title">{t("Téléphone")}</span>
                  <input
                    name="phone"
                    type="tel"
                    value={f.phone}
                    onChange={set("phone")}
                    autoComplete="tel"
                    maxLength={25}
                    pattern={PHONE_PATTERN}
                    title={t("Exemple : +237 677 12 34 56")}
                    placeholder="+237 6XX XXX XXX"
                    required
                  />
                </label>
              </>
            )}

            <label className="box field">
              <span className="box-title">{t("Adresse e-mail")}</span>
              <input
                name="email"
                type="email"
                value={f.email}
                onChange={set("email")}
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={120}
                pattern={isLogin ? undefined : EMAIL_PATTERN}
                title={t("Exemple : nom@exemple.com (minuscules uniquement, commence par une lettre, pas de double point)")}
                placeholder="nom@exemple.com"
                required
              />
            </label>

            <PasswordField
              name="password"
              label={t("Mot de passe")}
              value={f.password}
              onChange={set("password")}
              autoComplete={isLogin ? "current-password" : "new-password"}
              pattern={isLogin ? undefined : PASSWORD_PATTERN}
              placeholder={isLogin ? "" : t("8 caractères minimum, avec une lettre et un chiffre")}
            />

            {!isLogin && (
              <PasswordField
                name="confirm"
                label={t("Confirmer le mot de passe")}
                value={f.confirm}
                onChange={set("confirm")}
                autoComplete="new-password"
              />
            )}

            <p className="form-error" role="alert">{error}</p>

            <button type="submit" className="gold-btn wide" disabled={busy}>
              {busy ? t("Veuillez patienter…") : isLogin ? t("Se connecter") : t("Créer mon compte")}
            </button>
          </form>

          <div className="auth-links">
            {isLogin ? (
              <>
                <p>
                  {t("Pas encore de compte ?")}{" "}
                  <button type="button" className="link-btn" onClick={() => switchMode("register")}>
                    {t("Créer un compte")}
                  </button>
                </p>
                <p>
                  {t("Mot de passe oublié ?")}{" "}
                  <button type="button" className="link-btn" onClick={onWhatsApp}>
                    {t("Contactez-nous sur WhatsApp")}
                  </button>
                </p>
              </>
            ) : (
              <p>
                {t("Tu as déjà un compte ?")}{" "}
                <button type="button" className="link-btn" onClick={() => switchMode("login")}>
                  {t("Se connecter")}
                </button>
              </p>
            )}
          </div>
        </section>
      </div>

      <button type="button" className="wa-fab" onClick={onWhatsApp}>
        <span aria-hidden="true">💬</span> {t("Contact WhatsApp")}
      </button>
    </div>
  );
}
