import React, { useState } from "react";
import { api } from "./api.js";
import { THEMES, YEAR } from "./data.js";
import { useLang, errText } from "./i18n.jsx";
import { Box, SaveBar, SheetHeader } from "./pages.jsx";
import { EMAIL_PATTERN, NAME_PATTERN, PHONE_PATTERN, PASSWORD_PATTERN } from "./Auth.jsx";

const HELP = [
  [
    "Les pages",
    "Le planner reprend les 30 pages du PDF : objectifs, 12 mois (objectif du mois + budget et bilan), bilan de l’année et notes. Utilise le menu à gauche (bouton « Pages » sur téléphone) ou les boutons Précédent / Suivant.",
  ],
  [
    "Enregistrer",
    "Rien n’est sauvegardé tant que tu n’as pas cliqué sur « Enregistrer » en bas de la page. Un point orange dans le menu signale une page modifiée. Ton travail est rangé dans ton compte : tu le retrouves sur tous tes appareils.",
  ],
  [
    "Le calendrier",
    "Clique sur un jour pour le marquer comme date importante, clique encore pour l’enlever. Les jours fériés sont en couleur foncée.",
  ],
  [
    "Le budget",
    "Remplis tes revenus et tes charges : les totaux se calculent tout seuls. Reste à vivre = revenus − charges fixes − charges variables − loisirs − épargne mise de côté. Le lien « + ajouter une ligne » ajoute une ligne à un tableau.",
  ],
  [
    "Mon compte",
    "Ici tu peux changer ta langue, ton thème, tes informations et ton mot de passe. Tes pages sont privées : personne d’autre ne peut les voir.",
  ],
];

function Field({ label, children }) {
  return (
    <label className="box field">
      <span className="box-title">{label}</span>
      {children}
    </label>
  );
}

function ProfileBox({ user, onUser }) {
  const { t } = useLang();
  const initial = { full_name: user.full_name, phone: user.phone, email: user.email };
  const [f, setF] = useState(initial);
  const [flag, setFlag] = useState(null); // "saving" | "saved" | "error"
  const [err, setErr] = useState("");
  const dirty = JSON.stringify(f) !== JSON.stringify({ full_name: user.full_name, phone: user.phone, email: user.email });
  const set = (k) => (e) => {
    setF((s) => ({ ...s, [k]: e.target.value }));
    setFlag(null);
  };
  const status = flag === "saving" || flag === "saved" || flag === "error" ? flag : dirty ? "dirty" : "clean";

  const save = async (e) => {
    e?.preventDefault?.();
    if (!e?.currentTarget?.form?.reportValidity?.()) return;
    setFlag("saving");
    try {
      const r = await api("/me", "PUT", f);
      onUser(r.user);
      setF({ full_name: r.user.full_name, phone: r.user.phone, email: r.user.email });
      setFlag("saved");
      setTimeout(() => setFlag((x) => (x === "saved" ? null : x)), 2500);
    } catch (ex) {
      setErr(errText(ex, t));
      setFlag("error");
    }
  };

  return (
    <Box title={t("Modifier mon profil")}>
      <form onSubmit={(e) => e.preventDefault()}>
        <Field label={t("Nom complet")}>
          <input type="text" value={f.full_name} onChange={set("full_name")} autoComplete="name" minLength={2} maxLength={80}
                 pattern={NAME_PATTERN} title={t("Lettres uniquement (accents, espace, tiret et apostrophe acceptés)")} required />
        </Field>
        <Field label={t("Téléphone")}>
          <input type="tel" value={f.phone} onChange={set("phone")} autoComplete="tel" maxLength={25}
                 pattern={PHONE_PATTERN} title={t("Exemple : +237 677 12 34 56")} required />
        </Field>
        <Field label={t("Adresse e-mail")}>
          <input type="email" value={f.email} onChange={set("email")} autoComplete="email" autoCapitalize="none"
                 spellCheck={false} maxLength={120} pattern={EMAIL_PATTERN}
                 title={t("Exemple : nom@exemple.com (minuscules uniquement, commence par une lettre, pas de double point)")} required />
        </Field>
        <SaveBar status={status} updatedAt={null} errorText={err} onSave={save} />
      </form>
    </Box>
  );
}

function PasswordBox() {
  const { t } = useLang();
  const empty = { current_password: "", new_password: "", confirm: "" };
  const [f, setF] = useState(empty);
  const [flag, setFlag] = useState(null);
  const [err, setErr] = useState("");
  const dirty = Object.values(f).some(Boolean);
  const set = (k) => (e) => {
    setF((s) => ({ ...s, [k]: e.target.value }));
    setFlag(null);
  };
  const status = flag === "saving" || flag === "saved" || flag === "error" ? flag : dirty ? "dirty" : "clean";

  const save = async (e) => {
    if (!e?.currentTarget?.form?.reportValidity?.()) return;
    if (f.new_password !== f.confirm) {
      setErr(t("Les deux mots de passe ne sont pas identiques"));
      setFlag("error");
      return;
    }
    setFlag("saving");
    try {
      await api("/me/password", "PUT", { current_password: f.current_password, new_password: f.new_password });
      setF(empty);
      setFlag("saved");
      setTimeout(() => setFlag((x) => (x === "saved" ? null : x)), 2500);
    } catch (ex) {
      setErr(errText(ex, t));
      setFlag("error");
    }
  };

  return (
    <Box title={t("Changer mon mot de passe")}>
      <form onSubmit={(e) => e.preventDefault()}>
        <Field label={t("Mot de passe actuel")}>
          <input type="password" value={f.current_password} onChange={set("current_password")}
                 autoComplete="current-password" maxLength={128} required />
        </Field>
        <Field label={t("Nouveau mot de passe")}>
          <input type="password" value={f.new_password} onChange={set("new_password")} autoComplete="new-password"
                 minLength={8} maxLength={128} pattern={PASSWORD_PATTERN}
                 title={t("Au moins 8 caractères, avec une lettre et un chiffre")}
                 placeholder={t("8 caractères minimum, avec une lettre et un chiffre")} required />
        </Field>
        <Field label={t("Confirmer le mot de passe")}>
          <input type="password" value={f.confirm} onChange={set("confirm")} autoComplete="new-password"
                 maxLength={128} required />
        </Field>
        <SaveBar status={status} updatedAt={null} errorText={err} onSave={save} />
      </form>
    </Box>
  );
}

export default function Settings({ user, onUser, onPrefs, onLogout, onWhatsApp }) {
  const { t, lang } = useLang();
  const [confirmOut, setConfirmOut] = useState(false);

  return (
    <>
      <SheetHeader>
        <h1 className="title">
          {t("Réglages")}
          <small>{t("Mon compte")}</small>
        </h1>
      </SheetHeader>

      {/* 1. Compte + déconnexion */}
      <Box title={t("Mon compte")}>
        <div className="account-row">
          <div>
            <strong className="acc-name">{user.full_name}</strong>
            <div className="acc-mail">{user.email}</div>
          </div>
          {confirmOut ? (
            <div className="confirm-out">
              <span>{t("Se déconnecter maintenant ?")}</span>
              <button type="button" className="gold-btn small" onClick={onLogout}>{t("Oui, me déconnecter")}</button>
              <button type="button" className="ghost-btn small" onClick={() => setConfirmOut(false)}>{t("Annuler")}</button>
            </div>
          ) : (
            <button type="button" className="ghost-btn" onClick={() => setConfirmOut(true)}>
              {t("Se déconnecter")}
            </button>
          )}
        </div>
      </Box>

      {/* 2. Langue */}
      <Box title={t("Langue")}>
        <div className="chips" role="radiogroup" aria-label={t("Langue")}>
          {[["fr", "Français"], ["en", "English"]].map(([id, name]) => (
            <button key={id} type="button" role="radio" aria-checked={lang === id}
                    className={`chip ${lang === id ? "on" : ""}`} onClick={() => onPrefs({ lang: id })}>
              {name}
            </button>
          ))}
        </div>
      </Box>

      {/* 3. Aide */}
      <Box title={t("Aide : comment fonctionne le planner")}>
        <div className="help">
          {HELP.map(([title, body]) => (
            <details key={title}>
              <summary>{t(title)}</summary>
              <p>{t(body)}</p>
            </details>
          ))}
        </div>
        <p className="help-wa">
          {t("Besoin d’aide ?")}{" "}
          <button type="button" className="link-btn" onClick={onWhatsApp}>{t("Contactez-nous sur WhatsApp")}</button>
        </p>
      </Box>

      {/* 4. Profil */}
      <ProfileBox user={user} onUser={onUser} />
      <PasswordBox />

      {/* 5. Thème */}
      <Box title={t("Thème")}>
        <div className="themes" role="radiogroup" aria-label={t("Thème")}>
          {THEMES.map((th) => (
            <button key={th.id} type="button" role="radio" aria-checked={user.theme === th.id}
                    className={`theme-card ${user.theme === th.id ? "on" : ""}`} onClick={() => onPrefs({ theme: th.id })}>
              <span className="swatch" aria-hidden="true">
                {th.swatch.map((c) => <i key={c} style={{ background: c }} />)}
              </span>
              <span>{lang === "en" ? th.en : th.fr}</span>
            </button>
          ))}
        </div>
      </Box>

      <p className="quote">{t("Chaque petit pas compte.")}</p>
      <p className="center sub-note">{t("MON PLANNER")} {YEAR}</p>
    </>
  );
}
