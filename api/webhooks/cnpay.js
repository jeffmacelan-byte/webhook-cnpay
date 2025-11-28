import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

async function readBody(req) {
  if (req.body) {
    if (typeof req.body === 'string') {
      return JSON.parse(req.body);
    }
    return req.body;
  }
  const raw = await new Promise((resolve, reject) => {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
  return raw ? JSON.parse(raw) : {};
}

function timingSafeCompare(expected, provided) {
  if (!expected) {
    return true;
  }
  if (!provided) {
    return false;
  }
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);
  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não suportado. Use POST.' });
  }
  if (!supabase) {
    return res.status(500).json({ error: 'Configuração do Supabase ausente. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.' });
  }
  let payload;
  try {
    payload = await readBody(req);
  } catch {
    return res.status(400).json({ error: 'Body inválido.' });
  }
  const providedToken = req.headers['x-cnpay-token'] || payload?.token;
  const expectedToken = process.env.CNPAY_WEBHOOK_TOKEN || '';
  if (!timingSafeCompare(expectedToken, providedToken)) {
    return res.status(401).json({ error: 'Token inválido.' });
  }
  const event = String(payload?.event || '').toUpperCase();
  const withdraw = payload?.withdraw || {};
  const clientIdentifier = String(withdraw?.clientIdentifier || '');
  if (!clientIdentifier) {
    return res.status(400).json({ error: 'clientIdentifier ausente.' });
  }
  const statusStr = String(withdraw?.status || '').toUpperCase();
  let newStatus = 'PENDING';
  if (statusStr === 'COMPLETED' || event === 'TRANSFER_COMPLETED') newStatus = 'COMPLETED';
  else if (statusStr === 'CANCELED' || event === 'TRANSFER_FAILED') newStatus = 'REJECTED';
  const sent = Array.isArray(payload?.sents) && payload.sents.length ? payload.sents[0] : null;
  const extra = sent?.endToEndId ? ` • e2e: ${sent.endToEndId}` : '';
  const { error } = await supabase
    .from('transactions')
    .update({ status: newStatus, details: (withdraw?.status ? `CNPay: ${withdraw.status}` : 'CNPay') + extra })
    .eq('id', clientIdentifier)
    .eq('type', 'WITHDRAWAL');
  if (error) {
    return res.status(500).json({ error: 'Falha ao atualizar transação.' });
  }
  return res.status(200).json({ received: true, status: newStatus, processedAt: new Date().toISOString() });
}
