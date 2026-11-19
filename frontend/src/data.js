// Structure du planner : mêmes pages, même ordre que le PDF (30 pages).

export const YEAR = 2027;

// Contact WhatsApp (affiché dans une fenêtre pop-up)
export const WA_DISPLAY = "+237 6 82 89 51 23";
export const WA_NUMBER = "237682895123";

// [numéro du jour, français, anglais]
const MONTH_DEFS = [
  { id: "janvier", fr: "Janvier", en: "January", holidays: [[1, "Nouvel An", "New Year’s Day"]] },
  { id: "fevrier", fr: "Février", en: "February", holidays: [[11, "Fête de la Jeunesse", "Youth Day"]] },
  { id: "mars", fr: "Mars", en: "March", holidays: [[10, "Aïd el-Fitr ≈", "Eid al-Fitr ≈"], [26, "Vendredi Saint", "Good Friday"]], moon: true },
  { id: "avril", fr: "Avril", en: "April", holidays: [] },
  {
    id: "mai", fr: "Mai", en: "May", moon: true,
    holidays: [[1, "Fête du Travail", "Labour Day"], [6, "Ascension", "Ascension Day"], [17, "Tabaski ≈", "Eid al-Adha ≈"], [20, "Fête nationale", "National Day"]],
  },
  { id: "juin", fr: "Juin", en: "June", holidays: [] },
  { id: "juillet", fr: "Juillet", en: "July", holidays: [] },
  { id: "aout", fr: "Août", en: "August", holidays: [[15, "Assomption", "Assumption"]] },
  { id: "septembre", fr: "Septembre", en: "September", holidays: [] },
  { id: "octobre", fr: "Octobre", en: "October", holidays: [] },
  { id: "novembre", fr: "Novembre", en: "November", holidays: [] },
  { id: "decembre", fr: "Décembre", en: "December", holidays: [[25, "Noël", "Christmas"]] },
];

export const MONTHS = MONTH_DEFS.map((m, i) => ({ ...m, index: i }));

export const monthName = (m, lang) => (lang === "en" ? m.en : m.fr);

// Pages dans l'ordre du PDF. Numéro de page = position + 1.
export const PAGES = [
  { key: "couverture", type: "cover", label: ["Couverture", "Cover"] },
  { key: "objectifs", type: "objectifs", label: ["Mes objectifs 2027", "My 2027 goals"], fillable: true },
  ...MONTHS.flatMap((m) => [
    { key: `${m.id}_mois`, type: "mois", month: m, label: [`${m.fr} · Objectif du mois`, `${m.en} · Goal of the month`], fillable: true },
    { key: `${m.id}_budget`, type: "budget", month: m, label: [`${m.fr} · Budget et bilan`, `${m.en} · Budget and review`], fillable: true },
  ]),
  { key: "bilan_annee", type: "bilan", label: ["Bilan de l’année 2027", "2027 year review"], fillable: true },
  { key: "notes", type: "notes", label: ["Notes", "Notes"], fillable: true },
  { key: "bonus", type: "bonus", label: ["Bonus gratuit", "Free bonus"] },
  { key: "guide", type: "guide", label: ["Et maintenant ?", "What now?"] },
];

export const pageLabel = (p, lang) => p.label[lang === "en" ? 1 : 0];

// Mois précédent en majuscules (janvier -> "2026")
export const prevLabel = (m, lang) => (m.index === 0 ? "2026" : monthName(MONTHS[m.index - 1], lang).toUpperCase());

export const WEEKDAYS = { fr: ["L", "M", "M", "J", "V", "S", "D"], en: ["M", "T", "W", "T", "F", "S", "S"] };

// Calendrier du mois, semaine commençant le lundi. Retourne des semaines de 7 cases (null = vide).
export function monthGrid(monthIndex) {
  const first = new Date(Date.UTC(YEAR, monthIndex, 1));
  const offset = (first.getUTCDay() + 6) % 7; // lundi = 0
  const days = new Date(Date.UTC(YEAR, monthIndex + 1, 0)).getUTCDate();
  const cells = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export const BUDGET_SECTIONS = [
  { id: "revenus", title: "Revenus", first: "Source", rows: 6 },
  { id: "fixes", title: "Charges fixes", first: "Poste", rows: 7 },
  { id: "variables", title: "Charges variables", first: "Poste", rows: 6 },
  { id: "loisirs", title: "Loisirs", first: "Poste", rows: 4 },
  { id: "epargne", title: "Épargne", first: "Objectif", rows: 4 },
];

export const THEMES = [
  { id: "or", fr: "Doré", en: "Golden", swatch: ["#fffaf0", "#c39a3f", "#7b3f22"] },
  { id: "nuit", fr: "Nuit", en: "Night", swatch: ["#211812", "#d4ab54", "#8a4a28"] },
  { id: "rose", fr: "Rose", en: "Blush", swatch: ["#fff8f8", "#c76d83", "#8a3550"] },
];

export const num = (v) => {
  const n = parseFloat(String(v ?? "").replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

export const fmt = (n) => new Intl.NumberFormat("fr-FR").format(Math.round(n * 100) / 100);

export function budgetTotals(data) {
  const sum = (id) => (data?.[id] || []).reduce((s, r) => s + num(r?.montant), 0);
  const revenus = sum("revenus");
  const fixes = sum("fixes");
  const variables = sum("variables");
  const loisirs = sum("loisirs");
  const epargne = sum("epargne");
  const misDeCote = num(data?.mis_de_cote);
  // Reste à vivre = revenus − charges fixes − charges variables − loisirs − épargne réellement mise de côté
  const reste = revenus - fixes - variables - loisirs - misDeCote;
  return { revenus, fixes, variables, loisirs, epargne, misDeCote, reste };
}
