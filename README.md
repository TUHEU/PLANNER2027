# Mon Planner 2027 — site web (React + Flask)

Les 30 pages du PDF, dans le même ordre : couverture, objectifs, 12 mois × 2 pages
(objectif du mois + budget et bilan), bilan de l'année, notes, bonus et page finale.
Chaque page remplissable a un bouton **Enregistrer** (même design doré) ; les données
sont stockées dans SQLite (`backend/planner.db`).

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

## API
- GET  /api/pages            toutes les pages enregistrées
- GET  /api/pages/<cle>      une page (ex : janvier_budget)
- PUT  /api/pages/<cle>      enregistre {"data": {...}}
- DELETE /api/pages/<cle>    efface une page

Reste à vivre = revenus − charges fixes − charges variables − loisirs − épargne « mis de côté ».
Dans le calendrier, un clic sur un jour le marque comme date importante.
