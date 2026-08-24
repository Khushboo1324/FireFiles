#!/bin/sh
set -eu

# Railway volumes are available at runtime, so migrations and seeding run here.
cd "$(dirname "$0")"
python -m alembic upgrade head
python -m app.seed.seeder
exec python -m uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
