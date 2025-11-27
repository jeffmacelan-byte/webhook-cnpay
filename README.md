# Webhook de Pagamentos CN Pay

Este projeto implementa um endpoint de webhook pronto para ser hospedado na **Vercel**. Ele recebe notificações da CN Pay sobre eventos de pagamento (como *TRANSACTION_PAID*, *TRANSACTION_CREATED*, etc.) e valida o token enviado para garantir autenticidade.

## Arquitetura

- `api/webhooks/cnpay.js`: função serverless (Node 18) que processa os webhooks.
- `vercel.json`: força o uso do runtime `nodejs18.x`.
- `CNPAY_WEBHOOK_TOKEN`: variável de ambiente usada para validar o token enviado pela CN Pay.

## Pré-requisitos

- Node.js 18 ou superior.
- Conta na [Vercel](https://vercel.com/).
- Token gerado no painel da CN Pay ao cadastrar seu webhook.

## Como rodar localmente

```bash
npm install
copy env.example .env.local   # Windows PowerShell
vercel dev --listen 3000
```

Envie um POST para `http://localhost:3000/api/webhooks/cnpay` com o JSON de exemplo fornecido na documentação e inclua o header `x-cnpay-token` com o mesmo valor configurado em `CNPAY_WEBHOOK_TOKEN`.

Exemplo usando `curl` no PowerShell:

```bash
curl -Method POST http://localhost:3000/api/webhooks/cnpay `
  -ContentType "application/json" `
  -Headers @{"x-cnpay-token"="troque-por-um-token-seguro"} `
  -Body '{"event":"TRANSACTION_PAID","transaction":{"id":"123"}}'
```

## Deploy na Vercel

1. Faça login: `vercel login`
2. Importe o projeto: `vercel`
3. Configure a variável de ambiente `CNPAY_WEBHOOK_TOKEN` no painel da Vercel (`Project Settings > Environment Variables`).
4. Faça o deploy de produção: `vercel --prod`
5. Use a URL final (ex.: `https://seu-projeto.vercel.app/api/webhooks/cnpay`) ao cadastrar o webhook no painel da CN Pay.

## Personalização

No arquivo `api/webhooks/cnpay.js`, ajuste o `switch (payload.event)` para implementar o fluxo de negócios desejado (ex.: atualizar sua base de dados, disparar e-mails, etc.). Basta garantir que a função retorne um status `2xx` quando o processamento for bem-sucedido.

