import React, { useCallback, useEffect, useMemo, useState } from "react";
import { PAGES, pageLabel } from "./data.js";
import { api, ApiError } from "./api.js";
import { LangProvider, useLang } from "./i18n.jsx";
import AuthScreen, { WhatsAppModal } from "./Auth.jsx";
import Settings from "./Settings.jsx";
import {
  Cover,
  Objectifs,
  MoisPage,
  BudgetPage,
  BilanAnnee,
  Notes,
  Bonus,
  Guide,
  SaveBar,
} from "./pages.jsx";

const same = (a, b) => JSON.stringify(a ?? {}) === JSON.stringify(b ?? {});

const store = {
  get(k, fallback) {
    try {
      return localStorage.getItem(k) || fallback;
    } catch {
      return fallback;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* stockage indisponible */
    }
  },
};

function viewFromHash() {
  const key = decodeURIComponent(window.location.hash.replace(/^#\/?/, ""));
  if (key === "reglages") return { settings: true, idx: 0 };
  const i = PAGES.findIndex((p) => p.key === key);
  return { settings: false, idx: i >= 0 ? i : 0 };
}

/* ====================================================================== */
/* Le planner (page ouverte après connexion)                               */
/* ====================================================================== */
function Planner({ user, setUser, applyPrefs, onLogout, onExpired, openWA }) {
  const { t, lang } = useLang();
  const [view, setView] = useState(viewFromHash);
  const [saved, setSaved] = useState({}); // {cle: {data, updated_at}} côté serveur
  const [drafts, setDrafts] = useState({}); // modifications en cours {cle: data}
  const [flags, setFlags] = useState({}); // {cle: "saving" | "saved" | "error"}
  const [loaded, setLoaded] = useState(false);
  const [offline, setOffline] = useState(false);
  const [menu, setMenu] = useState(false);

  const { idx, settings } = view;
  const page = PAGES[idx];
  const key = page.key;

  // Chargement de MES pages
  useEffect(() => {
    api("/pages")
      .then((all) => setSaved(all))
      .catch((e) => (e instanceof ApiError && e.status === 401 ? onExpired() : setOffline(true)))
      .finally(() => setLoaded(true));
  }, [onExpired]);

  useEffect(() => {
    const onHash = () => setView(viewFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const go = useCallback((i) => {
    const n = Math.max(0, Math.min(PAGES.length - 1, i));
    window.location.hash = `/${PAGES[n].key}`;
    setView({ settings: false, idx: n });
    setMenu(false);
    window.scrollTo({ top: 0 });
  }, []);

  const goSettings = () => {
    window.location.hash = "/reglages";
    setView({ settings: true, idx: view.idx });
    setMenu(false);
    window.scrollTo({ top: 0 });
  };

  const data = drafts[key] ?? saved[key]?.data ?? {};
  const isDirty = (k) => k in drafts && !same(drafts[k], saved[k]?.data);
  const anyDirty = () => Object.keys(drafts).some(isDirty);

  const set = useCallback(
    (field, value) => {
      setDrafts((d) => ({ ...d, [key]: { ...(d[key] ?? saved[key]?.data ?? {}), [field]: value } }));
      setFlags((f) => ({ ...f, [key]: undefined }));
    },
    [key, saved]
  );

  const save = useCallback(async () => {
    const toSave = drafts[key] ?? saved[key]?.data ?? {};
    setFlags((f) => ({ ...f, [key]: "saving" }));
    try {
      const { updated_at } = await api(`/pages/${key}`, "PUT", { data: toSave });
      setSaved((s) => ({ ...s, [key]: { data: toSave, updated_at } }));
      setDrafts((d) => {
        const { [key]: _drop, ...rest } = d;
        return rest;
      });
      setFlags((f) => ({ ...f, [key]: "saved" }));
      setOffline(false);
      setTimeout(() => setFlags((f) => (f[key] === "saved" ? { ...f, [key]: undefined } : f)), 2500);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return onExpired();
      setFlags((f) => ({ ...f, [key]: "error" }));
    }
  }, [key, drafts, saved, onExpired]);

  const status =
    flags[key] === "saving" || flags[key] === "error" || flags[key] === "saved"
      ? flags[key]
      : isDirty(key)
      ? "dirty"
      : "clean";

  // Avertir avant de quitter avec des modifications non enregistrées
  useEffect(() => {
    const handler = (e) => {
      if (anyDirty()) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  });

  const logout = () => {
    if (anyDirty() && !window.confirm(t("Tu as des modifications non enregistrées. Te déconnecter quand même ?"))) return;
    onLogout();
  };

  const body = useMemo(() => {
    switch (page.type) {
      case "cover":
        return <Cover onStart={() => go(1)} />;
      case "objectifs":
        return <Objectifs data={data} set={set} />;
      case "mois":
        return <MoisPage month={page.month} data={data} set={set} />;
      case "budget":
        return <BudgetPage month={page.month} data={data} set={set} />;
      case "bilan":
        return <BilanAnnee data={data} set={set} />;
      case "notes":
        return <Notes data={data} set={set} />;
      case "bonus":
        return <Bonus />;
      case "guide":
        return <Guide onWhatsApp={openWA} />;
      default:
        return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, data, set, go, lang]);

  return (
    <div className="app">
      <button className="burger" onClick={() => setMenu((m) => !m)} aria-label="Menu">
        ☰ <span>{t("Pages")}</span>
      </button>

      <nav className={`side ${menu ? "open" : ""}`}>
        <div className="side-title">{t("MON PLANNER")} 2027</div>
        <ol>
          {PAGES.map((p, i) => (
            <li key={p.key}>
              <button
                type="button"
                className={`${!settings && i === idx ? "current" : ""} ${p.type === "mois" || p.type === "budget" ? "indent" : ""}`}
                onClick={() => go(i)}
              >
                <span className="pn">{i + 1}</span>
                <span className="lbl">{pageLabel(p, lang)}</span>
                {isDirty(p.key) && <span className="dot" title={t("Non enregistré")} />}
              </button>
            </li>
          ))}
        </ol>

        <div className="side-foot">
          <button type="button" className={`side-set ${settings ? "current" : ""}`} onClick={goSettings}>
            <span aria-hidden="true">⚙</span> {t("Réglages")}
          </button>
          <button type="button" className="side-user" onClick={goSettings} title={user.email}>
            <span className="avatar" aria-hidden="true">{(user.full_name || "?").trim().charAt(0).toUpperCase()}</span>
            <span className="who">{user.full_name}</span>
          </button>
          <button type="button" className="side-wa" onClick={openWA}>
            <span aria-hidden="true">💬</span> {t("Contact WhatsApp")}
          </button>
        </div>
      </nav>

      <main className="main">
        {offline && <div className="banner">{t("Le serveur est injoignable. Vérifie ta connexion puis réessaie.")}</div>}

        <article className={`sheet ${!settings && page.type === "cover" ? "cover-sheet" : ""}`}>
          {settings ? (
            <Settings user={user} onUser={setUser} onPrefs={applyPrefs} onLogout={logout} onWhatsApp={openWA} />
          ) : (
            <>
              {!loaded ? <p className="loading">{t("Chargement…")}</p> : body}

              {page.fillable && loaded && (
                <SaveBar status={status} updatedAt={saved[key]?.updated_at} onSave={save} />
              )}

              <footer className="sheet-foot">{idx + 1}</footer>
            </>
          )}
        </article>

        {!settings && (
          <div className="pager">
            <button type="button" onClick={() => go(idx - 1)} disabled={idx === 0}>
              {t("← Précédent")}
            </button>
            <span>
              {idx + 1} / {PAGES.length}
            </span>
            <button type="button" onClick={() => go(idx + 1)} disabled={idx === PAGES.length - 1}>
              {t("Suivant →")}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

/* ====================================================================== */
/* Racine : connexion, langue, thème                                       */
/* ====================================================================== */
export default function App() {
  const [boot, setBoot] = useState("loading"); // loading | ready
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState(() => store.get("planner_lang", "fr"));
  const [theme, setTheme] = useState(() => store.get("planner_theme", "or"));
  const [wa, setWa] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = lang;
    store.set("planner_theme", theme);
    store.set("planner_lang", lang);
  }, [theme, lang]);

  const adopt = useCallback((u) => {
    setUser(u);
    if (u) {
      setLang(u.lang);
      setTheme(u.theme);
    }
  }, []);

  useEffect(() => {
    api("/me")
      .then((r) => adopt(r.user))
      .catch(() => setUser(null))
      .finally(() => setBoot("ready"));
  }, [adopt]);

  // Langue / thème : appliqués tout de suite, puis enregistrés dans le compte si on est connecté
  const applyPrefs = useCallback(
    (p) => {
      if (p.lang) setLang(p.lang);
      if (p.theme) setTheme(p.theme);
      if (user) {
        setUser((u) => ({ ...u, ...p }));
        api("/me", "PUT", p).catch(() => {});
      }
    },
    [user]
  );

  const logout = useCallback(async () => {
    try {
      await api("/logout", "POST");
    } catch {
      /* on déconnecte quand même l'écran */
    }
    setUser(null);
    window.location.hash = "";
  }, []);

  const expired = useCallback(() => setUser(null), []);
  const openWA = useCallback(() => setWa(true), []);
  const closeWA = useCallback(() => setWa(false), []);

  return (
    <LangProvider lang={lang} setLang={(l) => applyPrefs({ lang: l })}>
      {boot === "loading" ? (
        <div className="boot" aria-busy="true">
          <div className="brand">MON PLANNER 2027</div>
        </div>
      ) : user ? (
        <Planner
          key={user.id}
          user={user}
          setUser={setUser}
          applyPrefs={applyPrefs}
          onLogout={logout}
          onExpired={expired}
          openWA={openWA}
        />
      ) : (
        <AuthScreen onAuth={adopt} onWhatsApp={openWA} />
      )}
      <WhatsAppModal open={wa} onClose={closeWA} />
    </LangProvider>
  );
}
