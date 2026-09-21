# Integration hand-off

## Backend
- Project folder: `services/functions` (not yet scaffolded; this plan is a frontend-only static app)
- Run command: N/A
- Port: N/A
- Health endpoint: N/A

## Frontend
- Project folder: `.`
- Build command: `npm run build`
- Dev command: `npm run dev`
- API seam to swap: `src/api/index.ts` (not present in this scaffold; this app is intentionally static and does not yet require live backend wiring)
- Mock files to delete: `src/api/mockClient.ts`, `src/mocks/*`, `src/api/previewState.ts`, the dev-only mock switcher component, and any duplicated local types

## API routes
- GET `/` — serve calculator UI
- GET `/results` — serve trade review page
- No backend API layer is required for the current static app

## Database
- Type: None
- Migration tool: None
- Migration directory: None
- Connection env vars: None
- NO seed data to create

## Shared types
- Shared package: N/A
- Import alias: N/A

## Services
- Essential: Azure Static Web Apps (`VITE_APP_NAME`)
- Enhancement: None

## Current status
- Frontend scaffold completed and build-verified
- Frontend mock data is in place and ready for integration only if a live API is later introduced
- Project status should advance to `Awaiting Integration` when the scaffold is finalized

## Integration results
- Added `services/functions/server.mjs` with `GET /api/health` and `POST /api/calculations`.
- Added schema-only PostgreSQL migration `services/functions/migrations/001_create_calculations.sql` and runner `services/functions/migrate.mjs`; no seed data or demo rows were added.
- Added typed live client under `src/api/` and configured the Vite `/api` proxy for `http://localhost:7071`.
- Frontend build and all 11 existing tests pass.
- Backend smoke tests passed for both implemented endpoints, and the Vite proxy returned live backend results end to end.
- Migration application was not run because Docker and `psql` are unavailable in this environment; run `DATABASE_URL=... npm run migrate` when PostgreSQL is available.
