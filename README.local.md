Local development: run backend, MongoDB and Caddy via Docker Compose

Prerequisites:

- Docker and Docker Compose installed
- Copy your local env vars into `backend/.env` (do NOT commit secrets)

Start services:

```bash
# from repo root (d:/starvnt-web/starvnt)
docker-compose up --build
```

Verify:

```bash
# backend health
curl -i http://localhost/health

# API health through the API prefix
curl -i http://localhost/api/health
```

Notes:

- Backend expects `DATABASE_URL` in `backend/.env`. For local use with the included MongoDB service set `DATABASE_URL=mongodb://mongo:27017/starvnt`.
- The `docker-compose.yml` mounts the `./backend` directory into the container so you can edit code locally.
- If you prefer to run the backend directly on the host (no Docker), run:

```bash
cd backend
npm ci
npm run build
node dist/src/server.js
```

Production notes:
- Ensure `DATABASE_URL` is set in your hosting environment (Render, Heroku, etc.) to a valid MongoDB connection string, for example `mongodb+srv://...`.
- The Dockerfile now sets `RUN_DIRECT=1` so the container will call the server's `start()` entrypoint automatically.
- For Render, use the included `render.yaml`, set `DATABASE_URL` to MongoDB Atlas, and keep `CLIENT_ORIGIN=https://starvnt-frontend.vercel.app`.
