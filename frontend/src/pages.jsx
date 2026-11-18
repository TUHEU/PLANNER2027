import React, { useState } from "react";
import {
  YEAR,
  BUDGET_SECTIONS,
  monthGrid,
  prevLabel,
  budgetTotals,
  fmt,
} from "./data.js";

/* ---------- Petits composants communs ---------- */

export function SheetHeader({ children }) {
  return (
    <header className="sheet-head">
      <div className="brand">MON PLANNER {YEAR}</div>
      {children}
    </header>
  );
}

export function SaveBar({ status, updatedAt, onSave }) {
  // status : "clean" | "dirty" | "saving" | "saved" | "error"
  const label =
    status === "saving" ? "Enregistrement…" : status === "saved" ? "Enregistré ✓" : "Enregistrer";
  const note =
    status === "error"
      ? "Échec : le serveur Flask ne répond pas."
      : status === "dirty"
      ? "Modifications non enregistrées"
      : updatedAt
      ? `Dernier enregistrement : ${new Date(updatedAt).toLocaleString("fr-FR", {
          dateStyle: "short",
          timeStyle: "short",
        })}`
      : "";
  return (
    <div className="savebar">
      <span className={`save-note ${status}`}>{note}</span>
      <button
        type="button"
        className={`save-btn ${status}`}
        onClick={onSave}
        disabled={status === "saving" || status === "clean" || status === "saved"}
      >
        {label}
      </button>
    </div>
  );
}

function Box({ title, children, className = "" }) {
  return (
    <section className={`box ${className}`}>
      <h3 className="box-title">{title}</h3>
      {children}
    </section>
  );
}

function Lines({ value, onChange, rows = 4, placeholder = "" }) {
  return (
    <textarea
      className="lines"
      rows={rows}
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/* ---------- Couverture ---------- */

export function Cover({ onStart }) {
  return (
    <div className="cover">
      <img src="/cover.jpg" alt="Mon Planner 2027 — Mes objectifs, mon budget, ma vie" />
      <button type="button" className="gold-btn" onClick={onStart}>
        Ouvrir mon planner →
      </button>
    </div>
  );
}

/* ---------- Mes objectifs de l'année ---------- */

export function Objectifs({ data, set }) {
  const objectifs = data.objectifs || ["", "", "", "", ""];
  const setObj = (i, v) => {
    const next = [...objectifs];
    next[i] = v;
    set("objectifs", next);
  };
  return (
    <>
      <SheetHeader>
        <h1 className="title">
          Mes objectifs
          <small>de l’année {YEAR}</small>
        </h1>
      </SheetHeader>

      <Box title="Mes 5 objectifs">
        <ol className="goals">
          {objectifs.map((o, i) => (
            <li key={i}>
              <span className="num">{i + 1}</span>
              <input
                type="text"
                value={o}
                onChange={(e) => setObj(i, e.target.value)}
                aria-label={`Objectif ${i + 1}`}
              />
            </li>
          ))}
        </ol>
      </Box>

      <Box title={`Ma vision pour ${YEAR}`}>
        <Lines rows={5} value={data.vision} onChange={(v) => set("vision", v)} />
      </Box>

      <Box title="Regard sur 2026">
        <div className="two">
          <div>
            <h4 className="sub">Ce que j’ai aimé</h4>
            <Lines rows={5} value={data.aime} onChange={(v) => set("aime", v)} />
          </div>
          <div>
            <h4 className="sub">Ce que je n’ai pas aimé</h4>
            <Lines rows={5} value={data.pas_aime} onChange={(v) => set("pas_aime", v)} />
          </div>
        </div>
      </Box>

      <p className="quote">Chaque petit pas compte.</p>
    </>
  );
}

/* ---------- Page mois : objectif ---------- */

export function MoisPage({ month, data, set }) {
  const weeks = monthGrid(month.index);
  const holidayDays = new Set(month.holidays.map(([d]) => d));
  const important = new Set(data.jours_importants || []);
  const toggleDay = (d) => {
    const next = new Set(important);
    next.has(d) ? next.delete(d) : next.add(d);
    set("jours_importants", [...next].sort((a, b) => a - b));
  };
  return (
    <>
      <SheetHeader>
        <h1 className="title month">{month.name}</h1>
        <div className="pill">OBJECTIF DU MOIS</div>
        <p className="holidays">
          {month.holidays.length === 0
            ? "Aucun jour férié ce mois-ci"
            : `Jours fériés : ${month.holidays.map(([d, n]) => `${d} ${n}`).join(" · ")}`}
        </p>
      </SheetHeader>

      <div className="top-grid">
        <table className="cal" aria-label={`Calendrier ${month.name} ${YEAR}`}>
          <thead>
            <tr>
              {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
                <th key={i}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((w, wi) => (
              <tr key={wi}>
                {w.map((d, di) => (
                  <td key={di}>
                    {d && (
                      <button
                        type="button"
                        className={`day ${holidayDays.has(d) ? "hol" : ""} ${important.has(d) ? "imp" : ""}`}
                        onClick={() => toggleDay(d)}
                        title={important.has(d) ? "Retirer des dates importantes" : "Marquer comme date importante"}
                      >
                        {d}
                      </button>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <Box title="Mon objectif du mois">
          <Lines rows={7} value={data.objectif} onChange={(v) => set("objectif", v)} />
        </Box>
      </div>
      {month.moon && <p className="foot-note">≈ date à confirmer selon l’observation de la lune</p>}

      <Box title={`Regard sur ${prevLabel(month)}`}>
        <div className="two">
          <div>
            <h4 className="sub">Ce que j’ai aimé</h4>
            <Lines rows={4} value={data.aime} onChange={(v) => set("aime", v)} />
          </div>
          <div>
            <h4 className="sub">Ce que je n’ai pas aimé</h4>
            <Lines rows={4} value={data.pas_aime} onChange={(v) => set("pas_aime", v)} />
          </div>
        </div>
      </Box>

      <Box title="Ce que j’aimerais améliorer ce mois-ci">
        <Lines rows={3} value={data.ameliorer} onChange={(v) => set("ameliorer", v)} />
      </Box>

      <div className="two">
        <Box title="Mes projets du mois">
          <Lines rows={5} value={data.projets} onChange={(v) => set("projets", v)} />
        </Box>
        <Box title="Dates importantes">
          <Lines rows={5} value={data.dates} onChange={(v) => set("dates", v)} />
        </Box>
      </div>
    </>
  );
}

/* ---------- Page mois : budget et bilan ---------- */

function MoneyTable({ section, rows, setRows, total }) {
  const list = Array.from({ length: Math.max(section.rows, rows?.length || 0) }, (_, i) => rows?.[i] || {});
  const setCell = (i, k, v) => {
    const next = list.map((r) => ({ ...r }));
    next[i][k] = v;
    setRows(next);
  };
  return (
    <Box title={section.title} className="money">
      <table className="money-table">
        <thead>
          <tr>
            <th>{section.first}</th>
            <th className="r">Montant</th>
          </tr>
        </thead>
        <tbody>
          {list.map((r, i) => (
            <tr key={i}>
              <td>
                <input
                  type="text"
                  value={r.label ?? ""}
                  onChange={(e) => setCell(i, "label", e.target.value)}
                  aria-label={`${section.title} ligne ${i + 1}`}
                />
              </td>
              <td>
                <input
                  type="text"
                  inputMode="decimal"
                  className="r"
                  value={r.montant ?? ""}
                  onChange={(e) => setCell(i, "montant", e.target.value)}
                  aria-label={`${section.title} montant ${i + 1}`}
                />
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td>Total</td>
            <td className="r">{fmt(total)}</td>
          </tr>
        </tfoot>
      </table>
      <button type="button" className="add-row" onClick={() => setRows([...list, {}])}>
        + ajouter une ligne
      </button>
    </Box>
  );
}

export function BudgetPage({ month, data, set }) {
  const t = budgetTotals(data);
  const totals = { revenus: t.revenus, fixes: t.fixes, variables: t.variables, loisirs: t.loisirs, epargne: t.epargne };
  return (
    <>
      <SheetHeader>
        <h1 className="title month">{month.name}</h1>
        <div className="pill">BUDGET ET BILAN</div>
      </SheetHeader>

      <div className="two">
        <div className="stack">
          {BUDGET_SECTIONS.slice(0, 2).map((s) => (
            <MoneyTable key={s.id} section={s} rows={data[s.id]} setRows={(v) => set(s.id, v)} total={totals[s.id]} />
          ))}
        </div>
        <div className="stack">
          {BUDGET_SECTIONS.slice(2, 4).map((s) => (
            <MoneyTable key={s.id} section={s} rows={data[s.id]} setRows={(v) => set(s.id, v)} total={totals[s.id]} />
          ))}
          <MoneyTable
            section={BUDGET_SECTIONS[4]}
            rows={data.epargne}
            setRows={(v) => set("epargne", v)}
            total={totals.epargne}
          />
        </div>
      </div>

      <div className="two">
        <Box title="Épargne du mois">
          <label className="row-field">
            <span>Prévu ce mois</span>
            <input
              type="text"
              inputMode="decimal"
              className="r"
              value={data.prevu ?? ""}
              onChange={(e) => set("prevu", e.target.value)}
            />
          </label>
          <label className="row-field">
            <span>Mis de côté</span>
            <input
              type="text"
              inputMode="decimal"
              className="r"
              value={data.mis_de_cote ?? ""}
              onChange={(e) => set("mis_de_cote", e.target.value)}
            />
          </label>
        </Box>
        <section className={`reste ${t.reste < 0 ? "neg" : ""}`}>
          <span>TOTAL RESTE À VIVRE</span>
          <strong>{fmt(t.reste)}</strong>
          <small>Revenus − charges − loisirs − épargne mise de côté</small>
        </section>
      </div>

      <Box title="Bilan du mois">
        <h4 className="sub">Ce qui a marché</h4>
        <Lines rows={3} value={data.marche} onChange={(v) => set("marche", v)} />
        <h4 className="sub">Mon petit pas pour le mois prochain</h4>
        <Lines rows={3} value={data.petit_pas} onChange={(v) => set("petit_pas", v)} />
      </Box>
    </>
  );
}

/* ---------- Bilan de l'année ---------- */

export function BilanAnnee({ data, set }) {
  return (
    <>
      <SheetHeader>
        <h1 className="title">
          Bilan de l’année
          <small>{YEAR}</small>
        </h1>
      </SheetHeader>
      <Box title="Mes objectifs atteints">
        <Lines rows={5} value={data.atteints} onChange={(v) => set("atteints", v)} />
      </Box>
      <Box title="Ce que j’ai aimé chez moi cette année">
        <Lines rows={4} value={data.aime_moi} onChange={(v) => set("aime_moi", v)} />
      </Box>
      <Box title="Ce que je veux améliorer en 2028">
        <Lines rows={4} value={data.ameliorer} onChange={(v) => set("ameliorer", v)} />
      </Box>
      <Box title="Ma plus grande fierté de l’année">
        <Lines rows={4} value={data.fierte} onChange={(v) => set("fierte", v)} />
      </Box>
      <Box title="Mon mot pour 2028">
        <input
          type="text"
          className="big-word"
          value={data.mot ?? ""}
          onChange={(e) => set("mot", e.target.value)}
        />
      </Box>
    </>
  );
}

/* ---------- Notes ---------- */

export function Notes({ data, set }) {
  return (
    <>
      <SheetHeader>
        <h1 className="title">Notes</h1>
      </SheetHeader>
      <Lines rows={26} value={data.notes} onChange={(v) => set("notes", v)} />
    </>
  );
}

/* ---------- Pages bonus (statiques) ---------- */

const MESSAGE =
  "Bonjour ! Merci pour ton message. Voici [produit] : [prix] FCFA, livraison à [ville] en [délai], paiement : [mode de paiement]. Je te le réserve ?";

export function Bonus() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(MESSAGE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* presse-papiers indisponible */
    }
  };
  const reasons = [
    [
      "Tu réponds trop tard",
      "Un client qui écrit veut souvent acheter tout de suite. Si tu réponds après plusieurs heures, il est déjà chez un autre vendeur.",
      "réponds dans les 15 minutes, ou mets un message d’accueil automatique.",
    ],
    [
      "Tes informations sont floues",
      "Quand le prix, la livraison ou le paiement ne sont pas clairs, le client pose trop de questions et finit par abandonner.",
      "donne dès le premier message le prix, la livraison et le mode de paiement.",
    ],
    [
      "Tu ne relances jamais",
      "Beaucoup de clients disent « je vais réfléchir » puis oublient. Sans relance, ces ventes sont perdues.",
      "écris-leur un petit message poli le lendemain.",
    ],
  ];
  return (
    <>
      <SheetHeader>
        <div className="pill">BONUS GRATUIT</div>
        <h1 className="title small">Tu vends en ligne, mais les clients n’achètent pas ?</h1>
      </SheetHeader>
      <h3 className="box-title center">3 raisons fréquentes</h3>
      {reasons.map(([t, p, a], i) => (
        <div className="reason" key={i}>
          <span className="num">{i + 1}</span>
          <div>
            <h4>{t}</h4>
            <p>{p}</p>
            <p>
              <strong>À faire :</strong> {a}
            </p>
          </div>
        </div>
      ))}
      <Box title="Message prêt à copier">
        <p className="copy-text">{MESSAGE}</p>
        <button type="button" className="gold-btn small" onClick={copy}>
          {copied ? "Copié ✓" : "Copier le message"}
        </button>
      </Box>
    </>
  );
}

export function Guide() {
  return (
    <>
      <SheetHeader>
        <div className="pill">ET MAINTENANT ?</div>
        <h1 className="title">Lance ton premier business en ligne</h1>
      </SheetHeader>
      <p className="para">
        Tu as ton planner pour organiser ton année. Si tu veux lancer ton premier business en ligne, je te montre
        comment, étape par étape, dans mon guide.
      </p>
      <p className="para">
        Si les clients t’écrivent mais ne passent pas l’achat, je te montre aussi quoi faire, dans ce guide.
      </p>
      <div className="guide-card">
        <span>LE GUIDE</span>
        <h2>Vendre en ligne au Cameroun</h2>
        <strong>5 000 FCFA</strong>
        <small>Guide PDF envoyé après paiement</small>
      </div>
      <Box title="Pour l’obtenir">
        <p className="para center">Écris-moi sur WhatsApp là où tu as commandé ce planner.</p>
        <p className="para center">Je te montre toutes les étapes dans ce guide.</p>
      </Box>
    </>
  );
}
