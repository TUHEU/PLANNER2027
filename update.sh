#!/usr/bin/env bash
# update.sh — met à jour et (re)démarre le Planner 2027 sur un serveur Linux (ex. VPS).
# Usage :  ./update.sh            (depuis la racine du projet)
# Variables optionnelles :  PORT=5000  APP_NAME=planner-2027  SKIP_FRONT=1 (ne pas recompiler le front)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_NAME="${APP_NAME:-planner-2027}"
PORT="${PORT:-5000}"
cd "$ROOT"

echo "==> 1/5 Récupération du code"
if [ -d .git ]; then
  git pull --ff-only
else
  echo "    (pas de dépôt git : étape ignorée)"
fi

echo "==> 2/5 Sauvegarde de la base de données"
if [ -f backend/planner.db ]; then
  mkdir -p backups
  cp backend/planner.db "backups/planner-$(date +%Y%m%d-%H%M%S).db"
  # garde les 10 sauvegardes les plus récentes
  ls -1t backups/planner-*.db 2>/dev/null | tail -n +11 | xargs -r rm --
  echo "    sauvegarde créée dans backups/"
else
  echo "    (aucune base existante)"
fi

echo "==> 3/5 Backend Flask (venv + dépendances)"
if [ ! -d backend/.venv ]; then
  python3 -m venv backend/.venv
fi
backend/.venv/bin/pip install --quiet --upgrade pip
backend/.venv/bin/pip install --quiet -r backend/requirements.txt

echo "==> 4/5 Frontend React"
if [ "${SKIP_FRONT:-0}" = "1" ]; then
  echo "    SKIP_FRONT=1 : on garde frontend/dist tel quel"
elif command -v npm >/dev/null 2>&1; then
  (cd frontend && npm install --no-audit --no-fund && npm run build)
else
  echo "    npm introuvable : on garde le frontend/dist déjà compilé"
fi

echo "==> 5/5 Redémarrage"
export PORT
if command -v pm2 >/dev/null 2>&1; then
  if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
    pm2 restart "$APP_NAME" --update-env
  else
    pm2 start backend/app.py --name "$APP_NAME" --interpreter "$ROOT/backend/.venv/bin/python"
  fi
  pm2 save >/dev/null 2>&1 || true
  echo "    PM2 : $APP_NAME actif sur le port $PORT"
else
  echo "    PM2 absent. Pour lancer à la main :"
  echo "      cd backend && PORT=$PORT .venv/bin/python app.py"
fi

echo "Terminé."
