import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const payload = req.body;

  if (!payload) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  console.log("Webhook CN Pay recebido:", payload.event);
  console.log("Dados completos:", JSON.stringify(payload, null, 2));

  try {
    // aqui você faz o que quiser:
    // 👉 salvar no banco
    // 👉 atualizar status de compra
    // 👉 liberar acesso
    // 👉 enviar e-mail
    // 👉 etc.
    
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Erro ao processar webhook:", error);
    return res.status(500).json({ error: "Internal error" });
  }
}
