import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import OpenAI from 'openai';
import { FIELDS, extractLocal, isValidLead } from './extractor.js';
import { readStore, updateStore } from './store.js';

const app = express(); const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
app.use(cors()); app.use(express.json({ limit: '10mb' }));
const prompt = `Return ONLY a JSON array. Map each input object to this exact CRM schema: ${FIELDS.join(', ')}. Include every key as a string. Do not invent values. crm_status must be one of GOOD_LEAD_FOLLOW_UP, DID_NOT_CONNECT, BAD_LEAD, SALE_DONE or empty. data_source must be leads_on_demand, meridian_tower, eden_park, varah_swamy, sarjapur_plots or empty. Skip leads with neither email nor mobile.`;
async function enrich(records) {
  if (!process.env.OPENAI_API_KEY) return records.map(extractLocal).filter(isValidLead);
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }); const output = [];
  for (let i = 0; i < records.length; i += 25) {
    const response = await client.chat.completions.create({ model: process.env.OPENAI_MODEL || 'gpt-4o-mini', temperature: 0, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: prompt + ' Wrap the array in a single key named records.' }, { role: 'user', content: JSON.stringify(records.slice(i, i + 25)) }] });
    const parsed = JSON.parse(response.choices[0].message.content); output.push(...(parsed.records || []));
  }
  return output.map(item => Object.fromEntries(FIELDS.map(f => [f, String(item[f] ?? '')]))).filter(isValidLead);
}
app.post('/api/import', upload.single('file'), async (req, res, next) => {
  try { if (!req.file) return res.status(400).json({ error: 'A CSV file is required.' });
    const rows = parse(req.file.buffer, { columns: true, skip_empty_lines: true, bom: true, relax_column_count: true, trim: true });
    const records = await enrich(rows); const importedAt = new Date().toISOString();
    await updateStore(store => { store.imports.unshift({ id: crypto.randomUUID(), filename: req.file.originalname, importedAt, totalImported: records.length, totalSkipped: rows.length - records.length, records }); store.leads.push(...records.map(record => ({ id: crypto.randomUUID(), ...record, importedAt }))); store.activities.unshift({ id: crypto.randomUUID(), at: importedAt, type: 'csv_import', message: `Imported ${records.length} leads from ${req.file.originalname}` }); });
    res.json({ records, totalImported: records.length, totalSkipped: rows.length - records.length });
  } catch (error) { next(error); }
});
app.get('/api/state', async (_req, res, next) => { try { res.json(await readStore()); } catch (error) { next(error); } });
app.post('/api/leads', async (req, res, next) => { try { const lead = { id: crypto.randomUUID(), name: String(req.body.name || ''), email: String(req.body.email || ''), phone: String(req.body.phone || ''), company: String(req.body.company || ''), status: String(req.body.status || 'Not Dialed'), createdAt: new Date().toISOString() }; if (!lead.email && !lead.phone) return res.status(400).json({ error: 'An email or mobile number is required.' }); await updateStore(store => { store.leads.push(lead); store.activities.unshift({ id: crypto.randomUUID(), at: lead.createdAt, type: 'lead_created', message: `Created lead ${lead.name || lead.email || lead.phone}` }); }); res.status(201).json(lead); } catch (error) { next(error); } });
app.put('/api/workspace', async (req, res, next) => { try { const workspace = await updateStore(store => { store.workspace = { ...store.workspace, ...req.body }; return store.workspace; }); res.json(workspace); } catch (error) { next(error); } });
app.post('/api/activity', async (req, res, next) => { try { const entry = { id: crypto.randomUUID(), at: new Date().toISOString(), type: String(req.body.type || 'action'), message: String(req.body.message || 'Workspace updated'), details: req.body.details || {} }; await updateStore(store => { store.activities.unshift(entry); store.activities = store.activities.slice(0, 250); }); res.status(201).json(entry); } catch (error) { next(error); } });
app.use((err, _req, res, _next) => res.status(400).json({ error: err.message || 'Could not import this CSV.' }));
app.listen(process.env.PORT || 4000, () => console.log(`API listening on ${process.env.PORT || 4000}`));
