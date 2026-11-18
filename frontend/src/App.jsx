import React, { useCallback, useEffect, useMemo, useState } from "react";
import { PAGES } from "./data.js";
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

const API = "/api/pages";
const same = (a, b) => JSON.stringify(a ?? {}) === JSON.stringify(b ?? {});

function pageFromHash() {
  const key = decodeURIComponent(window.location.hash.replace(/^#\/?/, ""));
  const i = PAGES.findIndex((p) => p.key === key);
  return i >= 0 ? i : 0;
}

export default function App() {
  const [idx, setIdx] = useState(pageFromHash);
  const [saved, setSaved] = useState({}); // {cle: {data, updated_at}} côté serveur
  const [drafts, setDrafts] = useState({}); // modifications en cours {cle: data}
  const [flags, setFlags] = useState({}); // {cle: "saving" | "saved" | "error"}
  const [loaded, setLoaded] = useState(false);
  const [offline, setOffline] = useState(false);
  const [menu, setMenu] = useState(false);

  // Chargement initial depuis Flask
  useEffect(() => {
    fetch(API)
      .then((r) => r.json())
      .then((all) => setSaved(all))
      .catch(() => setOffline(true))
      .finally(() => setLoaded(true));
  }, []);

  // Navigation par hash (#/janvier_mois)
  useEffect(() => {
    const onHash = () => setIdx(pageFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const go = useCallback((i) => {
    const n = Math.max(0, Math.min(PAGES.length - 1, i));
    window.location.hash = `/${PAGES[n].key}`;
    setIdx(n);
    setMenu(false);
    window.scrollTo({ top: 0 });
  }, []);

  const page = PAGES[idx];
  const key = page.key;

  const data = drafts[key] ?? saved[key]?.data ?? {};
  const isDirty = (k) => k in drafts && !same(drafts[k], saved[k]?.data);

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
      const r = await fetch(`${API}/${key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: toSave }),
      });
      if (!r.ok) throw new Error("http " + r.status);
      const { updated_at } = await r.json();
      setSaved((s) => ({ ...s, [key]: { data: toSave, updated_at } }));
      setDrafts((d) => {
        const { [key]: _drop, ...rest } = d;
        return rest;
      });
      setFlags((f) => ({ ...f, [key]: "saved" }));
      setOffline(false);
      setTimeout(() => setFlags((f) => (f[key] === "saved" ? { ...f, [key]: undefined } : f)), 2500);
    } catch {
      setFlags((f) => ({ ...f, [key]: "error" }));
    }
  }, [key, drafts, saved]);

  const status = flags[key] === "saving" || flags[key] === "error" || flags[key] === "saved"
    ? flags[key]
    : isDirty(key)
    ? "dirty"
    : "clean";

  // Avertir avant de quitter avec des modifications non enregistrées
  useEffect(() => {
    const handler = (e) => {
      if (Object.keys(drafts).some(isDirty)) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  });

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
        return <Guide />;
      default:
        return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, data, set, go]);

  return (
    <div className="app">
      <button className="burger" onClick={() => setMenu((m) => !m)} aria-label="Menu">
        ☰ <span>Pages</span>
      </button>

      <nav className={`side ${menu ? "open" : ""}`}>
        <div className="side-title">MON PLANNER 2027</div>
        <ol>
          {PAGES.map((p, i) => (
            <li key={p.key}>
              <button
                type="button"
                className={`${i === idx ? "current" : ""} ${p.type === "mois" || p.type === "budget" ? "indent" : ""}`}
                onClick={() => go(i)}
              >
                <span className="pn">{i + 1}</span>
                <span className="lbl">{p.label}</span>
                {isDirty(p.key) && <span className="dot" title="Non enregistré" />}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <main className="main">
        {offline && (
          <div className="banner">
            Le serveur Flask est injoignable. Lance <code>python app.py</code> dans le dossier backend pour pouvoir
            enregistrer.
          </div>
        )}

        <article className={`sheet ${page.type === "cover" ? "cover-sheet" : ""}`}>
          {!loaded ? <p className="loading">Chargement…</p> : body}

          {page.fillable && loaded && (
            <SaveBar status={status} updatedAt={saved[key]?.updated_at} onSave={save} />
          )}

          <footer className="sheet-foot">{idx + 1}</footer>
        </article>

        <div className="pager">
          <button type="button" onClick={() => go(idx - 1)} disabled={idx === 0}>
            ← Précédent
          </button>
          <span>
            {idx + 1} / {PAGES.length}
          </span>
          <button type="button" onClick={() => go(idx + 1)} disabled={idx === PAGES.length - 1}>
            Suivant →
          </button>
        </div>
      </main>
    </div>
  );
}
