# StarVNT Vendor Booking Dashboard

Production-minded assessment project for StarVNT: a responsive vendor booking dashboard with authentication, vendor profile management, event inquiry management, analytics, and deployment-ready structure.

## Stack

- Frontend: React + TypeScript + Vite, React Query, Recharts, Lucide icons
- Backend: Node.js + Express + TypeScript
- Database: Prisma ORM with SQLite for fast local review
- Auth: JWT bearer tokens with bcrypt password hashing
- Deployment shape: frontend can be hosted on AWS Amplify; backend can run on EC2 with Docker

I chose a split React/Node architecture because your deployment plan mentions Amplify for the frontend and EC2 for the backend. It keeps the API independently scalable while still making the assessment easy to run locally.

## StarVNT Product Fit

The dashboard is modeled around StarVNT's current positioning: cinematic weddings, corporate MICE, concerts, Moniqui luxury gifting, FTAura styling, premium venues, and Aura+ AI-assisted event planning. The UI follows the live website's dark cinematic palette, gold CTAs, serif brand accents, and luxury event language.

## Demo Login

```txt
Email: vendor@starvnt.com
Password: Starvnt@2026
```

## Local Setup

```bash
npm install
cp backend/.env.example backend/.env
npm run prisma:generate --workspace backend
npm run prisma:migrate --workspace backend -- --name init
npm run seed
npm run dev
```

Frontend: `http://localhost:5173`
Backend: `http://localhost:4000`

## API Overview

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/me`
- `GET /api/vendor/profile`
- `PUT /api/vendor/profile`
- `GET /api/inquiries`
- `POST /api/inquiries`
- `PATCH /api/inquiries/:id/status`
- `GET /api/analytics`

## Database Design

- `User`: authenticated vendor account with role support
- `VendorProfile`: marketplace-ready partner profile, category, coverage, pricing, specialties, rating
- `Inquiry`: client event inquiry with event type, budget, date, status, priority, source

This keeps vendor identity, public profile data, and booking pipeline data separated so the model can grow into admin review, multi-user vendor teams, payments, proposal documents, and availability calendars.

## Environment

Backend:

```txt
DATABASE_URL="file:./dev.db"
JWT_SECRET="replace-with-a-long-random-secret"
PORT=4000
CLIENT_ORIGIN="http://localhost:5173"
```

Frontend:

```txt
VITE_API_URL="http://localhost:4000"
```

## Docker

```bash
docker compose up --build
```

The compose setup builds both apps. The backend container runs Prisma `db push` on boot so a fresh EC2 volume can initialize itself for review/demo environments.

## AWS Amplify Frontend

An `amplify.yml` file is included at the repository root. In Amplify:

- App root: repository root
- Build command: handled by `amplify.yml`
- Artifact directory: `frontend/dist`
- Environment variable: `VITE_API_URL=https://your-api-domain.com`

## EC2 Backend

Build and run the backend Docker image on EC2:

```bash
docker build -f backend/Dockerfile -t starvnt-vendor-api .
docker run -p 4000:4000 \
  -e DATABASE_URL="file:/app/backend/prisma/dev.db" \
  -e JWT_SECRET="replace-with-production-secret" \
  -e CLIENT_ORIGIN="https://your-amplify-domain.amplifyapp.com" \
  starvnt-vendor-api
```

For a production deployment, switch `DATABASE_URL` to PostgreSQL/MySQL and replace `prisma db push` with migration deployment.

## CI/CD

GitHub Actions CI is included in `.github/workflows/ci.yml`. It installs dependencies, generates Prisma Client, builds frontend/backend, and verifies both Docker images build successfully. Amplify can deploy the frontend automatically on pushes to the connected branch. Backend deployment can be connected to EC2 through your preferred pipeline step, such as SSH deploy, CodeDeploy, or ECR + ECS/EC2 pull.

## Production Considerations

- Replace the local SQLite database with PostgreSQL or MySQL for multi-instance production deployments.
- Store JWT secrets and database URLs in AWS Secrets Manager or SSM Parameter Store.
- Put the EC2 API behind an ALB with HTTPS.
- Add refresh tokens or short session rotation for higher security.
- Add role-gated admin endpoints for StarVNT operations teams.
- Add audit logs for inquiry status changes.
