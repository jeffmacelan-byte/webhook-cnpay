import crypto from 'node:crypto';

/**
 * Faz a leitura do corpo da requisição caso o Vercel ainda não tenha feito o parse.
 * @param {import('@vercel/node').VercelRequest} req
 */
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
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });

  return raw ? JSON.parse(raw) : {};
}

function timingSafeCompare(expected, provided) {
  if (!expected) {
    console.warn('CNPAY_WEBHOOK_TOKEN não configurado. Configure um token para validar os webhooks.');
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

/**
 * Manipulador principal do webhook da CN Pay.
 * @param {import('@vercel/node').VercelRequest} req
 * @param {import('@vercel/node').VercelResponse} res
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não suportado. Use POST.' });
  }

  let payload;
  try {
    payload = await readBody(req);
  } catch (error) {
    console.error('Erro ao ler o corpo do webhook:', error);
    return res.status(400).json({ error: 'Body inválido.' });
  }

  const providedToken = req.headers['x-cnpay-token'] || payload?.token;
  const expectedToken = process.env.CNPAY_WEBHOOK_TOKEN || '';

  if (!timingSafeCompare(expectedToken, providedToken)) {
    return res.status(401).json({ error: 'Token inválido.' });
  }

  if (!payload?.event) {
    return res.status(400).json({ error: 'Evento não informado.' });
  }

  // Aqui você pode implementar suas regras específicas para cada evento.
  switch (payload.event) {
    case 'TRANSACTION_CREATED':
      console.info('Transação criada:', payload.transaction?.id);
      break;
    case 'TRANSACTION_PAID':
      console.info('Transação paga:', payload.transaction?.id);
      break;
    case 'TRANSACTION_CANCELED':
      console.info('Transação cancelada:', payload.transaction?.id);
      break;
    case 'TRANSACTION_REFUNDED':
      console.info('Transação estornada:', payload.transaction?.id);
      break;
    default:
      console.info('Evento não mapeado:', payload.event);
  }

  // Exemplo de resposta customizada para a CN Pay
  return res.status(200).json({
    received: true,
    processedAt: new Date().toISOString()
  });
}

