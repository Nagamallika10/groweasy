# GrowEasy AI CSV Importer

A two-step CRM import flow: CSV data stays in the browser for preview, then only a confirmed file is sent to the Express API for extraction.

## Run locally

1. Install Node.js 20+ and run `npm install`, `npm install --prefix server`, and `npm install --prefix web`.
2. Copy `server/.env.example` to `server/.env`. Add `OPENAI_API_KEY` to use LLM-based extraction; without it, the app uses a safe local mapper for common CRM headers.
3. Run `npm run dev`, then open `http://localhost:3000`.

## API

`POST /api/import` accepts multipart field `file` containing a CSV and returns `{ records, totalImported, totalSkipped }`. Files are limited to 10MB. AI requests are batched in groups of 25.

## Quality notes

- Responsive, scrollable preview/result tables with sticky headers.
- Mobile/email validation and skipped-record totals.
- Status/source allowlists, date normalization, and unit tests for the local extraction fallback.

## Deploy on Render

This repository includes `render.yaml`, which creates two Render Web Services: `groweasy-api` and `groweasy-web`.

1. Push the latest code to GitHub.
2. In Render, choose **New > Blueprint**, connect `Nagamallika10/groweasy`, and select the `main` branch.
3. Create the Blueprint. Render creates both services. The API may require a paid plan because the `groweasy-data` persistent disk preserves `store.json` across deploys.
4. Open the `groweasy-api` service and copy its public URL, for example `https://groweasy-api.onrender.com`.
5. In `groweasy-web` > **Environment**, set `NEXT_PUBLIC_API_URL` to that API URL (with no trailing slash), then trigger **Manual Deploy > Deploy latest commit**.
6. In `groweasy-api` > **Environment**, optionally add `OPENAI_API_KEY` for AI extraction. Without it, the local mapping fallback remains available.

Render uses the provided commands automatically:

| Service | Root directory | Build command | Start command |
| --- | --- | --- | --- |
| API | `server` | `npm ci` | `npm start` |
| Web | `web` | `npm ci && npm run build` | `npm start` |

For local development, copy `web/.env.example` to `web/.env.local` and leave its value as `http://localhost:4000`.
