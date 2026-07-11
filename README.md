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
