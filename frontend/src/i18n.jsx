import React, { createContext, useCallback, useContext, useMemo } from "react";

/* Le français est la langue d'origine : t("texte français") renvoie le texte tel quel en français,
   et sa traduction dans le dictionnaire EN en anglais. */

export const ERR_FR = {
  required: "Complète tous les champs obligatoires",
  too_long: "Le texte est trop long",
  email_case: "Utilise uniquement des minuscules dans l’adresse e-mail",
  bad_email: "Entre une adresse e-mail valide",
  bad_name: "Entre ton vrai nom complet (lettres uniquement, 2 caractères minimum)",
  bad_phone: "Entre un numéro de téléphone valide",
  pw_short: "Le mot de passe doit contenir au moins 8 caractères",
  pw_letters_digit: "Le mot de passe doit contenir des lettres et au moins un chiffre",
  pw_easy: "Ce mot de passe est trop facile à deviner",
  pw_same: "Le nouveau mot de passe doit être différent de l’ancien",
  email_used: "Cette adresse e-mail est déjà utilisée",
  bad_login: "E-mail ou mot de passe incorrect",
  too_many: "Trop de tentatives. Réessaie dans 10 minutes.",
  wrong_current_password: "Le mot de passe actuel est incorrect",
  login_required: "Connecte-toi pour continuer",
  network: "Impossible de joindre le serveur",
  server: "Une erreur est survenue",
};

export function errText(err, t) {
  return t(ERR_FR[err && err.code] || ERR_FR.server);
}

const EN = {
  // Général
  "MON PLANNER": "MY PLANNER",
  "Enregistrement…": "Saving…",
  "Enregistré ✓": "Saved ✓",
  "Enregistrer": "Save",
  "Échec : le serveur ne répond pas.": "Failed: the server is not responding.",
  "Modifications non enregistrées": "Unsaved changes",
  "Dernier enregistrement :": "Last saved:",
  "Mon Planner 2027 — Mes objectifs, mon budget, ma vie": "My 2027 Planner — My goals, my budget, my life",
  "Ouvrir mon planner →": "Open my planner →",
  "Pages": "Pages",
  "Non enregistré": "Not saved",
  "Chargement…": "Loading…",
  "← Précédent": "← Previous",
  "Suivant →": "Next →",
  "Le serveur est injoignable. Vérifie ta connexion puis réessaie.": "The server cannot be reached. Check your connection and try again.",

  // Objectifs
  "Mes objectifs": "My goals",
  "de l’année": "of the year",
  "Mes 5 objectifs": "My 5 goals",
  "Objectif": "Goal",
  "Ma vision pour": "My vision for",
  "Regard sur 2026": "Looking back at 2026",
  "Ce que j’ai aimé": "What I liked",
  "Ce que je n’ai pas aimé": "What I didn’t like",
  "Chaque petit pas compte.": "Every small step counts.",

  // Mois
  "OBJECTIF DU MOIS": "GOAL OF THE MONTH",
  "Aucun jour férié ce mois-ci": "No public holiday this month",
  "Jours fériés :": "Public holidays:",
  "Calendrier": "Calendar",
  "Retirer des dates importantes": "Remove from important dates",
  "Marquer comme date importante": "Mark as an important date",
  "Mon objectif du mois": "My goal for the month",
  "≈ date à confirmer selon l’observation de la lune": "≈ date to be confirmed according to the moon sighting",
  "Regard sur": "Looking back at",
  "Ce que j’aimerais améliorer ce mois-ci": "What I’d like to improve this month",
  "Mes projets du mois": "My projects this month",
  "Dates importantes": "Important dates",

  // Budget
  "BUDGET ET BILAN": "BUDGET AND REVIEW",
  "Revenus": "Income",
  "Charges fixes": "Fixed expenses",
  "Charges variables": "Variable expenses",
  "Loisirs": "Leisure",
  "Épargne": "Savings",
  "Source": "Source",
  "Poste": "Item",
  "Montant": "Amount",
  "ligne": "row",
  "montant": "amount",
  "Total": "Total",
  "+ ajouter une ligne": "+ add a row",
  "Épargne du mois": "Savings this month",
  "Prévu ce mois": "Planned this month",
  "Mis de côté": "Set aside",
  "TOTAL RESTE À VIVRE": "TOTAL LEFT TO LIVE ON",
  "Revenus − charges − loisirs − épargne mise de côté": "Income − expenses − leisure − savings set aside",
  "Bilan du mois": "Review of the month",
  "Ce qui a marché": "What worked",
  "Mon petit pas pour le mois prochain": "My small step for next month",

  // Bilan année / notes
  "Bilan de l’année": "Year review",
  "Mes objectifs atteints": "Goals I reached",
  "Ce que j’ai aimé chez moi cette année": "What I liked about myself this year",
  "Ce que je veux améliorer en 2028": "What I want to improve in 2028",
  "Ma plus grande fierté de l’année": "My greatest pride this year",
  "Mon mot pour 2028": "My word for 2028",
  "Notes": "Notes",

  // Bonus et guide
  "Bonjour ! Merci pour ton message. Voici [produit] : [prix] FCFA, livraison à [ville] en [délai], paiement : [mode de paiement]. Je te le réserve ?":
    "Hello! Thank you for your message. Here is [product]: [price] FCFA, delivery to [city] in [time], payment: [payment method]. Shall I reserve it for you?",
  "Tu réponds trop tard": "You reply too late",
  "Un client qui écrit veut souvent acheter tout de suite. Si tu réponds après plusieurs heures, il est déjà chez un autre vendeur.":
    "A customer who writes often wants to buy right away. If you reply after several hours, they are already with another seller.",
  "réponds dans les 15 minutes, ou mets un message d’accueil automatique.": "reply within 15 minutes, or set up an automatic welcome message.",
  "Tes informations sont floues": "Your information is unclear",
  "Quand le prix, la livraison ou le paiement ne sont pas clairs, le client pose trop de questions et finit par abandonner.":
    "When the price, delivery or payment are unclear, the customer asks too many questions and gives up.",
  "donne dès le premier message le prix, la livraison et le mode de paiement.": "give the price, delivery and payment method in your first message.",
  "Tu ne relances jamais": "You never follow up",
  "Beaucoup de clients disent « je vais réfléchir » puis oublient. Sans relance, ces ventes sont perdues.":
    "Many customers say “I’ll think about it” and then forget. Without a follow-up, those sales are lost.",
  "écris-leur un petit message poli le lendemain.": "send them a short, polite message the next day.",
  "BONUS GRATUIT": "FREE BONUS",
  "Tu vends en ligne, mais les clients n’achètent pas ?": "You sell online, but customers don’t buy?",
  "3 raisons fréquentes": "3 common reasons",
  "À faire :": "To do:",
  "Message prêt à copier": "Ready-to-copy message",
  "Copié ✓": "Copied ✓",
  "Copier le message": "Copy the message",
  "ET MAINTENANT ?": "WHAT NOW?",
  "Lance ton premier business en ligne": "Launch your first online business",
  "Tu as ton planner pour organiser ton année. Si tu veux lancer ton premier business en ligne, je te montre comment, étape par étape, dans mon guide.":
    "You have your planner to organise your year. If you want to launch your first online business, I’ll show you how, step by step, in my guide.",
  "Si les clients t’écrivent mais ne passent pas l’achat, je te montre aussi quoi faire, dans ce guide.":
    "If customers write to you but don’t go through with the purchase, I also show you what to do in this guide.",
  "LE GUIDE": "THE GUIDE",
  "Vendre en ligne au Cameroun": "Selling online in Cameroon",
  "Guide PDF envoyé après paiement": "PDF guide sent after payment",
  "Pour l’obtenir": "How to get it",
  "Écris-moi sur WhatsApp là où tu as commandé ce planner.": "Write to me on WhatsApp where you ordered this planner.",
  "Je te montre toutes les étapes dans ce guide.": "I show you every step in this guide.",
  "Contacter sur WhatsApp": "Contact on WhatsApp",

  // WhatsApp
  "Bonjour, j’ai besoin d’aide pour mon Planner 2027.": "Hello, I need help with my 2027 Planner.",
  "Fermer": "Close",
  "Contactez-nous sur WhatsApp": "Contact us on WhatsApp",
  "Une question, un mot de passe oublié ou un souci avec ton compte ? Écris-nous sur ce numéro :":
    "A question, a forgotten password or a problem with your account? Write to us on this number:",
  "Ouvrir WhatsApp": "Open WhatsApp",
  "Copier le numéro": "Copy the number",
  "Contact WhatsApp": "WhatsApp contact",

  // Connexion / inscription
  "Au moins 8 caractères, avec une lettre et un chiffre": "At least 8 characters, with a letter and a digit",
  "Masquer": "Hide",
  "Afficher": "Show",
  "Les deux mots de passe ne sont pas identiques": "The two passwords are not the same",
  "Connexion": "Log in",
  "Créer mon compte": "Create my account",
  "Content de te revoir": "Good to see you again",
  "Commence ton année 2027": "Start your 2027 year",
  "ACCÈS À MON PLANNER": "ACCESS MY PLANNER",
  "NOUVEAU COMPTE": "NEW ACCOUNT",
  "Nom complet": "Full name",
  "Lettres uniquement (accents, espace, tiret et apostrophe acceptés)": "Letters only (accents, space, hyphen and apostrophe allowed)",
  "Ton nom complet": "Your full name",
  "Téléphone": "Phone number",
  "Exemple : +237 677 12 34 56": "Example: +237 677 12 34 56",
  "Adresse e-mail": "Email address",
  "Exemple : nom@exemple.com (minuscules uniquement, commence par une lettre, pas de double point)":
    "Example: name@example.com (lowercase only, must start with a letter, no double dots)",
  "Mot de passe": "Password",
  "8 caractères minimum, avec une lettre et un chiffre": "At least 8 characters, with a letter and a digit",
  "Confirmer le mot de passe": "Confirm the password",
  "Veuillez patienter…": "Please wait…",
  "Se connecter": "Log in",
  "Pas encore de compte ?": "No account yet?",
  "Créer un compte": "Create an account",
  "Mot de passe oublié ?": "Forgot your password?",
  "Tu as déjà un compte ?": "Already have an account?",

  // Réglages
  "Réglages": "Settings",
  "Mon compte": "My account",
  "Se déconnecter maintenant ?": "Log out now?",
  "Oui, me déconnecter": "Yes, log me out",
  "Annuler": "Cancel",
  "Se déconnecter": "Log out",
  "Tu as des modifications non enregistrées. Te déconnecter quand même ?": "You have unsaved changes. Log out anyway?",
  "Langue": "Language",
  "Aide : comment fonctionne le planner": "Help: how the planner works",
  "Besoin d’aide ?": "Need help?",
  "Modifier mon profil": "Edit my profile",
  "Changer mon mot de passe": "Change my password",
  "Mot de passe actuel": "Current password",
  "Nouveau mot de passe": "New password",
  "Thème": "Theme",
  "Les pages": "The pages",
  "Le planner reprend les 30 pages du PDF : objectifs, 12 mois (objectif du mois + budget et bilan), bilan de l’année et notes. Utilise le menu à gauche (bouton « Pages » sur téléphone) ou les boutons Précédent / Suivant.":
    "The planner has the 30 pages of the PDF: goals, 12 months (goal of the month + budget and review), year review and notes. Use the menu on the left (the “Pages” button on a phone) or the Previous / Next buttons.",
  "Rien n’est sauvegardé tant que tu n’as pas cliqué sur « Enregistrer » en bas de la page. Un point orange dans le menu signale une page modifiée. Ton travail est rangé dans ton compte : tu le retrouves sur tous tes appareils.":
    "Nothing is saved until you click “Save” at the bottom of the page. An orange dot in the menu shows a page with changes. Your work is stored in your account, so you find it on all your devices.",
  "Le calendrier": "The calendar",
  "Clique sur un jour pour le marquer comme date importante, clique encore pour l’enlever. Les jours fériés sont en couleur foncée.":
    "Click a day to mark it as an important date, click again to remove it. Public holidays are shown in a dark colour.",
  "Le budget": "The budget",
  "Remplis tes revenus et tes charges : les totaux se calculent tout seuls. Reste à vivre = revenus − charges fixes − charges variables − loisirs − épargne mise de côté. Le lien « + ajouter une ligne » ajoute une ligne à un tableau.":
    "Fill in your income and expenses: the totals calculate themselves. Left to live on = income − fixed expenses − variable expenses − leisure − savings set aside. The “+ add a row” link adds a row to a table.",
  "Ici tu peux changer ta langue, ton thème, tes informations et ton mot de passe. Tes pages sont privées : personne d’autre ne peut les voir.":
    "Here you can change your language, theme, details and password. Your pages are private: nobody else can see them.",

  // Erreurs serveur
  [ERR_FR.required]: "Please fill in all required fields",
  [ERR_FR.too_long]: "The text is too long",
  [ERR_FR.email_case]: "Use lowercase letters only in the email address",
  [ERR_FR.bad_email]: "Enter a valid email address",
  [ERR_FR.bad_name]: "Enter your real full name (letters only, at least 2 characters)",
  [ERR_FR.bad_phone]: "Enter a valid phone number",
  [ERR_FR.pw_short]: "The password must contain at least 8 characters",
  [ERR_FR.pw_letters_digit]: "The password must contain letters and at least one digit",
  [ERR_FR.pw_easy]: "This password is too easy to guess",
  [ERR_FR.pw_same]: "The new password must be different from the old one",
  [ERR_FR.email_used]: "This email address is already in use",
  [ERR_FR.bad_login]: "Wrong email or password",
  [ERR_FR.too_many]: "Too many attempts. Try again in 10 minutes.",
  [ERR_FR.wrong_current_password]: "The current password is incorrect",
  [ERR_FR.login_required]: "Please log in to continue",
  [ERR_FR.network]: "Cannot reach the server",
  [ERR_FR.server]: "Something went wrong",
};

export const EN_DICTIONARY = EN;

const Ctx = createContext({ lang: "fr", t: (s) => s, setLang: () => {} });

export function LangProvider({ lang, setLang, children }) {
  const t = useCallback((fr) => (lang === "en" ? EN[fr] ?? fr : fr), [lang]);
  const value = useMemo(() => ({ lang, t, setLang }), [lang, t, setLang]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx);
