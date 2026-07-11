import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
const path = join(directory, 'store.json');
const defaults = { leads: [], imports: [], activities: [], workspace: { name: 'Test Corp', ownerEmail: 'owner@testcorp.com', ownerAccess: true, plan: 'Growth' } };
export async function readStore() {
  try { return { ...defaults, ...JSON.parse(await readFile(path, 'utf8')) }; }
  catch { await writeStore(defaults); return structuredClone(defaults); }
}
export async function writeStore(data) {
  await mkdir(directory, { recursive: true });
  const temporary = `${path}.tmp`; await writeFile(temporary, `${JSON.stringify(data, null, 2)}\n`, 'utf8'); await rename(temporary, path);
}
export async function updateStore(update) { const store = await readStore(); const result = await update(store); await writeStore(store); return result ?? store; }
