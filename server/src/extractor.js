const FIELDS = ['created_at', 'name', 'email', 'country_code', 'mobile_without_country_code', 'company', 'city', 'state', 'country', 'lead_owner', 'crm_status', 'crm_note', 'data_source', 'possession_time', 'description'];
const aliases = {
  created_at: ['created', 'date', 'timestamp', 'added on', 'submitted'], name: ['name', 'customer', 'client', 'person', 'applicant', 'buyer', 'prospect'],
  email: ['email', 'mail'], country_code: ['country code', 'isd', 'dial code', 'phone code'], mobile_without_country_code: ['mobile', 'phone', 'contact number', 'telephone', 'whatsapp', 'cell'],
  company: ['company', 'organization', 'firm', 'business', 'employer', 'agency'], city: ['city', 'town', 'district', 'locality'], state: ['state', 'province', 'region'], country: ['country', 'nation'],
  lead_owner: ['owner', 'assigned', 'sales person', 'executive', 'agent', 'manager'], crm_status: ['status', 'follow up'], crm_note: ['remark', 'comment', 'note', 'feedback', 'observation'],
  data_source: ['source', 'campaign', 'origin', 'marketing', 'project', 'property', 'website', 'landing'], possession_time: ['possession', 'delivery', 'completion', 'move in', 'handover'], description: ['description', 'requirement', 'detail']
};
const clean = value => String(value ?? '').trim();
const findValue = (row, names) => {
  const key = Object.keys(row).find(k => names.some(a => k.toLowerCase().includes(a)));
  return key ? clean(row[key]) : '';
};
const normalizeStatus = value => {
  const v = value.toLowerCase();
  if (/(interested|follow.?up|call again|demo|meeting|pending)/.test(v)) return 'GOOD_LEAD_FOLLOW_UP';
  if (/(busy|no answer|call later|switched off|not reachable|disconnect)/.test(v)) return 'DID_NOT_CONNECT';
  if (/(reject|wrong|spam|duplicate|not interested|invalid|cancel)/.test(v)) return 'BAD_LEAD';
  if (/(purchas|booked|closed|won|convert|register|payment|complete)/.test(v)) return 'SALE_DONE';
  return '';
};
const normalizeSource = value => {
  const compact = value.toLowerCase().replace(/[ _-]/g, '');
  return { leadsondemand: 'leads_on_demand', meridiantower: 'meridian_tower', edenpark: 'eden_park', varahswamy: 'varah_swamy', sarjapurplots: 'sarjapur_plots' }[compact] || '';
};
const validEmail = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/ig;
export function emptyRecord() { return Object.fromEntries(FIELDS.map(field => [field, ''])); }
export function extractLocal(row) {
  const result = emptyRecord();
  for (const field of FIELDS) result[field] = findValue(row, aliases[field] || []);
  result.name = result.name.replace(/^(mr|mrs|ms|miss|dr|prof|shri|smt)\.?\s+/i, '');
  const emails = [...new Set(Object.values(row).flatMap(v => clean(v).match(validEmail) || []))];
  result.email = emails[0] || result.email;
  const phoneRaw = result.mobile_without_country_code;
  const phones = [...new Set((phoneRaw.match(/(?:\+\d{1,3}[\s.-]?)?(?:\(?\d[\d\s().-]{7,}\d)/g) || []).map(x => x.replace(/[^\d+]/g, '')))];
  if (phones[0]) { const m = phones[0].match(/^(\+\d{1,3})(\d{10})$/); result.country_code = result.country_code || (m?.[1] || ''); result.mobile_without_country_code = m?.[2] || phones[0].replace(/^\+/, ''); }
  const extras = [...emails.slice(1), ...phones.slice(1)];
  if (extras.length) result.crm_note = [result.crm_note, `Additional contacts: ${extras.join(', ')}`].filter(Boolean).join(' | ');
  result.crm_status = normalizeStatus(result.crm_status);
  result.data_source = normalizeSource(result.data_source);
  if (result.created_at && !Number.isNaN(Date.parse(result.created_at))) result.created_at = new Date(result.created_at).toISOString().slice(0, 19).replace('T', ' '); else result.created_at = '';
  return result;
}
export const isValidLead = record => Boolean(record.email || record.mobile_without_country_code);
export { FIELDS };
