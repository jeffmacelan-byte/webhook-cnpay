import type { VercelRequest, VercelResponse } from "@vercel/node";

const VERIFY_TOKEN = process.env.CNPAY_WEBHOOK_TOKEN;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const payload = req.body;

  if (!payload || !payload.token) {
    return res.status(400).json({ error: "Missing token" });
  }

  if (payload.token !== VERIFY_TOKEN) {
    return res.status(401).json({ error: "Invalid token" });
  }

  console.log("Novo webhook CN Pay recebido:", payload.event);

  try {
    // 👉 Salve no banco, atualize pedido, dispare email, etc
    console.log("Processando evento:", payload.event);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Erro ao processar webhook:", err);
    return res.status(500).json({ error: "Internal error" });
  }
}
