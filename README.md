# Mon Planner 2027 — site web (React + Flask)

Les 30 pages du PDF, dans le même ordre : couverture, objectifs, 12 mois × 2 pages
(objectif du mois + budget et bilan), bilan de l'année, notes, bonus et page finale.
Chaque page remplissable a un bouton **Enregistrer** (même design doré) ; les données
sont stockées dans SQLite (`backend/planner.db`), **séparées par compte**.

## Comptes (mêmes règles que TaskLink)
- Page de connexion + création de compte ; on est connecté pour 7 jours.
- E-mail strict : minuscules, commence par une lettre, pas de « .. », vrai domaine ; les adresses Gmail doivent avoir 6 à 30 caractères.
- Nom réel (lettres seulement), téléphone valide (Cameroun ou format international), mot de passe de 8 caractères minimum avec lettre + chiffre, pas de mot de passe trop courant.
- 5 mots de passe faux = blocage de 10 minutes. Mots de passe hachés. Un e-mail = un seul compte.
- Les données de l'ancienne version (sans comptes) sont rattachées au **premier compte créé**.
- Pop-up « Contactez-nous sur WhatsApp » (+237 6 82 89 51 23) sur la page de connexion, dans Réglages et dans le menu.
- **Réglages** : déconnexion, langue (FR/EN), aide, modifier le profil et le mot de passe, thème (Doré / Nuit / Rose). Langue et thème suivent le compte.

## Lancer (Windows / Miniconda)
```
cd backend
pip install -r requirements.txt
python app.py
```
Puis ouvrir http://localhost:5000 — le site compilé est déjà inclus dans `frontend/dist`.

## Modifier le front (optionnel, Node 18+)
```
cd frontend
npm install
npm run dev        # http://localhost:5173 (proxy vers Flask sur :5000)
npm run build      # recompile frontend/dist
```

## API (JSON, session par cookie)
- POST /api/register · /api/login · /api/logout ; GET/PUT /api/me ; PUT /api/me/password
- GET  /api/pages            mes pages enregistrées
- GET  /api/pages/<cle>      une page (ex : janvier_budget)
- PUT  /api/pages/<cle>      enregistre {"data": {...}}
- DELETE /api/pages/<cle>    efface une page

## Serveur (VPS)
`COOKIE_SECURE=1 PORT=5050 ./update.sh` : met à jour, sauvegarde la base, recompile, redémarre PM2 et copie le site dans `/var/www/planner-2027` pour nginx.
La clé de session est créée dans `backend/.secret_key` (ne pas la publier) ou fournie par la variable `SECRET_KEY`.

Reste à vivre = revenus − charges fixes − charges variables − loisirs − épargne « mis de côté ».
Dans le calendrier, un clic sur un jour le marque comme date importante.
