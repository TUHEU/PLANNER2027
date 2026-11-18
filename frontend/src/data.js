// Structure du planner : mêmes pages, même ordre que le PDF (30 pages).

export const YEAR = 2027;

export const MONTHS = [
  { id: "janvier", name: "Janvier", holidays: [[1, "Nouvel An"]], prev: "2026" },
  { id: "fevrier", name: "Février", holidays: [[11, "Fête de la Jeunesse"]] },
  { id: "mars", name: "Mars", holidays: [[10, "Aïd el-Fitr ≈"], [26, "Vendredi Saint"]], moon: true },
  { id: "avril", name: "Avril", holidays: [] },
  {
    id: "mai",
    name: "Mai",
    holidays: [[1, "Fête du Travail"], [6, "Ascension"], [17, "Tabaski ≈"], [20, "Fête nationale"]],
    moon: true,
  },
  { id: "juin", name: "Juin", holidays: [] },
  { id: "juillet", name: "Juillet", holidays: [] },
  { id: "aout", name: "Août", holidays: [[15, "Assomption"]] },
  { id: "septembre", name: "Septembre", holidays: [] },
  { id: "octobre", name: "Octobre", holidays: [] },
  { id: "novembre", name: "Novembre", holidays: [] },
  { id: "decembre", name: "Décembre", holidays: [[25, "Noël"]] },
].map((m, i) => ({ ...m, index: i }));

// Pages dans l'ordre du PDF. Numéro de page = position + 1.
export const PAGES = [
  { key: "couverture", type: "cover", label: "Couverture" },
  { key: "objectifs", type: "objectifs", label: "Mes objectifs 2027", fillable: true },
  ...MONTHS.flatMap((m) => [
    { key: `${m.id}_mois`, type: "mois", month: m, label: `${m.name} · Objectif du mois`, fillable: true },
    { key: `${m.id}_budget`, type: "budget", month: m, label: `${m.name} · Budget et bilan`, fillable: true },
  ]),
  { key: "bilan_annee", type: "bilan", label: "Bilan de l’année 2027", fillable: true },
  { key: "notes", type: "notes", label: "Notes", fillable: true },
  { key: "bonus", type: "bonus", label: "Bonus gratuit" },
  { key: "guide", type: "guide", label: "Et maintenant ?" },
];

export const prevLabel = (m) => (m.index === 0 ? "2026" : MONTHS[m.index - 1].name.toUpperCase());

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
