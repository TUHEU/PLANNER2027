import React, { useState } from "react";
import {
  YEAR,
  BUDGET_SECTIONS,
  WEEKDAYS,
  monthGrid,
  monthName,
  prevLabel,
  budgetTotals,
  fmt,
} from "./data.js";
import { useLang } from "./i18n.jsx";

/* ---------- Petits composants communs ---------- */

export function SheetHeader({ children }) {
  const { t } = useLang();
  return (
    <header className="sheet-head">
      <div className="brand">{t("MON PLANNER")} {YEAR}</div>
      {children}
    </header>
  );
}

export function SaveBar({ status, updatedAt, onSave, errorText }) {
  // status : "clean" | "dirty" | "saving" | "saved" | "error"
  const { t, lang } = useLang();
  const label =
    status === "saving" ? t("Enregistrement…") : status === "saved" ? t("Enregistré ✓") : t("Enregistrer");
  const note =
    status === "error"
      ? errorText || t("Échec : le serveur ne répond pas.")
      : status === "dirty"
      ? t("Modifications non enregistrées")
      : updatedAt
      ? `${t("Dernier enregistrement :")} ${new Date(updatedAt).toLocaleString(lang === "en" ? "en-GB" : "fr-FR", {
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

export function Box({ title, children, className = "" }) {
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
  const { t } = useLang();
  return (
    <div className="cover">
      <img src="/cover.jpg" alt={t("Mon Planner 2027 — Mes objectifs, mon budget, ma vie")} />
      <button type="button" className="gold-btn" onClick={onStart}>
        {t("Ouvrir mon planner →")}
      </button>
    </div>
  );
}

/* ---------- Mes objectifs de l'année ---------- */

export function Objectifs({ data, set }) {
  const { t } = useLang();
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
          {t("Mes objectifs")}
          <small>{t("de l’année")} {YEAR}</small>
        </h1>
      </SheetHeader>

      <Box title={t("Mes 5 objectifs")}>
        <ol className="goals">
          {objectifs.map((o, i) => (
            <li key={i}>
              <span className="num">{i + 1}</span>
              <input
                type="text"
                value={o}
                onChange={(e) => setObj(i, e.target.value)}
                aria-label={`${t("Objectif")} ${i + 1}`}
              />
            </li>
          ))}
        </ol>
      </Box>

      <Box title={`${t("Ma vision pour")} ${YEAR}`}>
        <Lines rows={5} value={data.vision} onChange={(v) => set("vision", v)} />
      </Box>

      <Box title={t("Regard sur 2026")}>
        <div className="two">
          <div>
            <h4 className="sub">{t("Ce que j’ai aimé")}</h4>
            <Lines rows={5} value={data.aime} onChange={(v) => set("aime", v)} />
          </div>
          <div>
            <h4 className="sub">{t("Ce que je n’ai pas aimé")}</h4>
            <Lines rows={5} value={data.pas_aime} onChange={(v) => set("pas_aime", v)} />
          </div>
        </div>
      </Box>

      <p className="quote">{t("Chaque petit pas compte.")}</p>
    </>
  );
}

/* ---------- Page mois : objectif ---------- */

export function MoisPage({ month, data, set }) {
  const { t, lang } = useLang();
  const weeks = monthGrid(month.index);
  const holidayDays = new Set(month.holidays.map(([d]) => d));
  const important = new Set(data.jours_importants || []);
  const name = monthName(month, lang);
  const toggleDay = (d) => {
    const next = new Set(important);
    next.has(d) ? next.delete(d) : next.add(d);
    set("jours_importants", [...next].sort((a, b) => a - b));
  };
  const hol = month.holidays.map(([d, fr, en]) => `${d} ${lang === "en" ? en : fr}`).join(" · ");
  return (
    <>
      <SheetHeader>
        <h1 className="title month">{name}</h1>
        <div className="pill">{t("OBJECTIF DU MOIS")}</div>
        <p className="holidays">
          {month.holidays.length === 0 ? t("Aucun jour férié ce mois-ci") : `${t("Jours fériés :")} ${hol}`}
        </p>
      </SheetHeader>

      <div className="top-grid">
        <table className="cal" aria-label={`${t("Calendrier")} ${name} ${YEAR}`}>
          <thead>
            <tr>
              {WEEKDAYS[lang === "en" ? "en" : "fr"].map((d, i) => (
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
                        title={important.has(d) ? t("Retirer des dates importantes") : t("Marquer comme date importante")}
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

        <Box title={t("Mon objectif du mois")}>
          <Lines rows={7} value={data.objectif} onChange={(v) => set("objectif", v)} />
        </Box>
      </div>
      {month.moon && <p className="foot-note">{t("≈ date à confirmer selon l’observation de la lune")}</p>}

      <Box title={`${t("Regard sur")} ${prevLabel(month, lang)}`}>
        <div className="two">
          <div>
            <h4 className="sub">{t("Ce que j’ai aimé")}</h4>
            <Lines rows={4} value={data.aime} onChange={(v) => set("aime", v)} />
          </div>
          <div>
            <h4 className="sub">{t("Ce que je n’ai pas aimé")}</h4>
            <Lines rows={4} value={data.pas_aime} onChange={(v) => set("pas_aime", v)} />
          </div>
        </div>
      </Box>

      <Box title={t("Ce que j’aimerais améliorer ce mois-ci")}>
        <Lines rows={3} value={data.ameliorer} onChange={(v) => set("ameliorer", v)} />
      </Box>

      <div className="two">
        <Box title={t("Mes projets du mois")}>
          <Lines rows={5} value={data.projets} onChange={(v) => set("projets", v)} />
        </Box>
        <Box title={t("Dates importantes")}>
          <Lines rows={5} value={data.dates} onChange={(v) => set("dates", v)} />
        </Box>
      </div>
    </>
  );
}

/* ---------- Page mois : budget et bilan ---------- */

function MoneyTable({ section, rows, setRows, total }) {
  const { t } = useLang();
  const list = Array.from({ length: Math.max(section.rows, rows?.length || 0) }, (_, i) => rows?.[i] || {});
  const setCell = (i, k, v) => {
    const next = list.map((r) => ({ ...r }));
    next[i][k] = v;
    setRows(next);
  };
  return (
    <Box title={t(section.title)} className="money">
      <table className="money-table">
        <thead>
          <tr>
            <th>{t(section.first)}</th>
            <th className="r">{t("Montant")}</th>
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
                  aria-label={`${t(section.title)} ${t("ligne")} ${i + 1}`}
                />
              </td>
              <td>
                <input
                  type="text"
                  inputMode="decimal"
                  className="r"
                  value={r.montant ?? ""}
                  onChange={(e) => setCell(i, "montant", e.target.value)}
                  aria-label={`${t(section.title)} ${t("montant")} ${i + 1}`}
                />
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td>{t("Total")}</td>
            <td className="r">{fmt(total)}</td>
          </tr>
        </tfoot>
      </table>
      <button type="button" className="add-row" onClick={() => setRows([...list, {}])}>
        {t("+ ajouter une ligne")}
      </button>
    </Box>
  );
}

export function BudgetPage({ month, data, set }) {
  const { t, lang } = useLang();
  const tot = budgetTotals(data);
  const totals = { revenus: tot.revenus, fixes: tot.fixes, variables: tot.variables, loisirs: tot.loisirs, epargne: tot.epargne };
  return (
    <>
      <SheetHeader>
        <h1 className="title month">{monthName(month, lang)}</h1>
        <div className="pill">{t("BUDGET ET BILAN")}</div>
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
        <Box title={t("Épargne du mois")}>
          <label className="row-field">
            <span>{t("Prévu ce mois")}</span>
            <input
              type="text"
              inputMode="decimal"
              className="r"
              value={data.prevu ?? ""}
              onChange={(e) => set("prevu", e.target.value)}
            />
          </label>
          <label className="row-field">
            <span>{t("Mis de côté")}</span>
            <input
              type="text"
              inputMode="decimal"
              className="r"
              value={data.mis_de_cote ?? ""}
              onChange={(e) => set("mis_de_cote", e.target.value)}
            />
          </label>
        </Box>
        <section className={`reste ${tot.reste < 0 ? "neg" : ""}`}>
          <span>{t("TOTAL RESTE À VIVRE")}</span>
          <strong>{fmt(tot.reste)}</strong>
          <small>{t("Revenus − charges − loisirs − épargne mise de côté")}</small>
        </section>
      </div>

      <Box title={t("Bilan du mois")}>
        <h4 className="sub">{t("Ce qui a marché")}</h4>
        <Lines rows={3} value={data.marche} onChange={(v) => set("marche", v)} />
        <h4 className="sub">{t("Mon petit pas pour le mois prochain")}</h4>
        <Lines rows={3} value={data.petit_pas} onChange={(v) => set("petit_pas", v)} />
      </Box>
    </>
  );
}

/* ---------- Bilan de l'année ---------- */

export function BilanAnnee({ data, set }) {
  const { t } = useLang();
  return (
    <>
      <SheetHeader>
        <h1 className="title">
          {t("Bilan de l’année")}
          <small>{YEAR}</small>
        </h1>
      </SheetHeader>
      <Box title={t("Mes objectifs atteints")}>
        <Lines rows={5} value={data.atteints} onChange={(v) => set("atteints", v)} />
      </Box>
      <Box title={t("Ce que j’ai aimé chez moi cette année")}>
        <Lines rows={4} value={data.aime_moi} onChange={(v) => set("aime_moi", v)} />
      </Box>
      <Box title={t("Ce que je veux améliorer en 2028")}>
        <Lines rows={4} value={data.ameliorer} onChange={(v) => set("ameliorer", v)} />
      </Box>
      <Box title={t("Ma plus grande fierté de l’année")}>
        <Lines rows={4} value={data.fierte} onChange={(v) => set("fierte", v)} />
      </Box>
      <Box title={t("Mon mot pour 2028")}>
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
  const { t } = useLang();
  return (
    <>
      <SheetHeader>
        <h1 className="title">{t("Notes")}</h1>
      </SheetHeader>
      <Lines rows={26} value={data.notes} onChange={(v) => set("notes", v)} />
    </>
  );
}

/* ---------- Pages bonus (statiques) ---------- */

export function Bonus() {
  const { t } = useLang();
  const [copied, setCopied] = useState(false);
  const message = t(
    "Bonjour ! Merci pour ton message. Voici [produit] : [prix] FCFA, livraison à [ville] en [délai], paiement : [mode de paiement]. Je te le réserve ?"
  );
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* presse-papiers indisponible */
    }
  };
  const reasons = [
    [
      t("Tu réponds trop tard"),
      t("Un client qui écrit veut souvent acheter tout de suite. Si tu réponds après plusieurs heures, il est déjà chez un autre vendeur."),
      t("réponds dans les 15 minutes, ou mets un message d’accueil automatique."),
    ],
    [
      t("Tes informations sont floues"),
      t("Quand le prix, la livraison ou le paiement ne sont pas clairs, le client pose trop de questions et finit par abandonner."),
      t("donne dès le premier message le prix, la livraison et le mode de paiement."),
    ],
    [
      t("Tu ne relances jamais"),
      t("Beaucoup de clients disent « je vais réfléchir » puis oublient. Sans relance, ces ventes sont perdues."),
      t("écris-leur un petit message poli le lendemain."),
    ],
  ];
  return (
    <>
      <SheetHeader>
        <div className="pill">{t("BONUS GRATUIT")}</div>
        <h1 className="title small">{t("Tu vends en ligne, mais les clients n’achètent pas ?")}</h1>
      </SheetHeader>
      <h3 className="box-title center">{t("3 raisons fréquentes")}</h3>
      {reasons.map(([title, p, a], i) => (
        <div className="reason" key={i}>
          <span className="num">{i + 1}</span>
          <div>
            <h4>{title}</h4>
            <p>{p}</p>
            <p>
              <strong>{t("À faire :")}</strong> {a}
            </p>
          </div>
        </div>
      ))}
      <Box title={t("Message prêt à copier")}>
        <p className="copy-text">{message}</p>
        <button type="button" className="gold-btn small" onClick={copy}>
          {copied ? t("Copié ✓") : t("Copier le message")}
        </button>
      </Box>
    </>
  );
}

export function Guide({ onWhatsApp }) {
  const { t } = useLang();
  return (
    <>
      <SheetHeader>
        <div className="pill">{t("ET MAINTENANT ?")}</div>
        <h1 className="title">{t("Lance ton premier business en ligne")}</h1>
      </SheetHeader>
      <p className="para">
        {t("Tu as ton planner pour organiser ton année. Si tu veux lancer ton premier business en ligne, je te montre comment, étape par étape, dans mon guide.")}
      </p>
      <p className="para">
        {t("Si les clients t’écrivent mais ne passent pas l’achat, je te montre aussi quoi faire, dans ce guide.")}
      </p>
      <div className="guide-card">
        <span>{t("LE GUIDE")}</span>
        <h2>{t("Vendre en ligne au Cameroun")}</h2>
        <strong>5 000 FCFA</strong>
        <small>{t("Guide PDF envoyé après paiement")}</small>
      </div>
      <Box title={t("Pour l’obtenir")}>
        <p className="para center">{t("Écris-moi sur WhatsApp là où tu as commandé ce planner.")}</p>
        <p className="para center">{t("Je te montre toutes les étapes dans ce guide.")}</p>
        <p className="center">
          <button type="button" className="gold-btn small" onClick={onWhatsApp}>
            {t("Contacter sur WhatsApp")}
          </button>
        </p>
      </Box>
    </>
  );
}
