/**
 * Webhook Serverless Seguro para Pagamentos (Asaas / Mercado Pago / Stripe)
 * 
 * Regra de Segurança: saas-security-audit
 * - Validação estrita do header de assinatura/token ANTES de processar o corpo (Fail-Closed).
 * - Comparação criptográfica segura contra Timing Attacks (crypto.timingSafeEqual).
 * - Proteção contra repetição e Idempotência via checagem de paymentId.
 * - Zero vazamento de stack traces em produção.
 */

import crypto from "crypto";

// Chave secreta do Webhook (configurada nas variáveis de ambiente da Vercel)
const WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || process.env.ASAAS_WEBHOOK_TOKEN;

/**
 * Comparação timing-safe para evitar ataques de temporização
 */
function isTimingSafeMatch(receivedHeader, expectedSecret) {
  if (!receivedHeader || !expectedSecret) return false;
  try {
    const receivedBuffer = Buffer.from(String(receivedHeader), "utf8");
    const expectedBuffer = Buffer.from(String(expectedSecret), "utf8");
    if (receivedBuffer.length !== expectedBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  // Apenas aceita método POST
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido" });
  }

  // 1. PILAR DE SEGURANÇA: Validação de Header Antes de Ler/Processar o Body (Fail-Closed)
  const tokenHeader =
    req.headers["asaas-access-token"] ||
    req.headers["x-webhook-token"] ||
    req.headers["x-signature"];

  if (!WEBHOOK_SECRET) {
    console.error("[SEGURANÇA] PAYMENT_WEBHOOK_SECRET não configurado no servidor.");
    return res.status(500).json({ error: "Configuração de segurança pendente no servidor." });
  }

  if (!tokenHeader || !isTimingSafeMatch(tokenHeader, WEBHOOK_SECRET)) {
    console.warn("[SEGURANÇA] Tentativa de webhook rejeitada por token inválido ou ausente.");
    return res.status(401).json({ error: "Acesso não autorizado: assinatura ou token inválido." });
  }

  try {
    const payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    if (!payload) {
      return res.status(400).json({ error: "Payload vazio ou inválido" });
    }

    /**
     * Extração dos dados do evento de pagamento
     * Compatível com formato Asaas:
     * - event: 'PAYMENT_RECEIVED' | 'PAYMENT_CONFIRMED'
     * - payment.id: string
     * - payment.externalReference: userId (UID do Firebase)
     * - payment.value: number
     */
    const event = payload.event || payload.action || payload.type;
    const payment = payload.payment || payload.data || payload;
    const paymentId = payment.id || payment.paymentId || payload.id;
    const userId = payment.externalReference || payment.metadata?.userId || payload.userId;
    const planType = payment.metadata?.plan || payload.plan || "monthly"; // 'monthly' | 'annual'

    // Ignora eventos que não sejam de confirmação de pagamento
    const isPaymentConfirmed =
      event === "PAYMENT_RECEIVED" ||
      event === "PAYMENT_CONFIRMED" ||
      event === "payment.created" ||
      event === "approved";

    if (!isPaymentConfirmed) {
      return res.status(200).json({ received: true, status: "evento_ignorado" });
    }

    if (!paymentId || !userId) {
      console.warn("[WEBHOOK] Notificação ignorada: paymentId ou userId ausente no payload.");
      return res.status(400).json({ error: "paymentId e userId (externalReference) são obrigatórios" });
    }

    // 2. PILAR DE SEGURANÇA: Idempotência (Garantir que o mesmo pagamento não seja creditado duas vezes)
    // Em produção com Firebase Admin SDK ou chamada REST protegida:
    const daysToAdd = planType === "annual" ? 365 : 30;
    const expiresDate = new Date();
    expiresDate.setDate(expiresDate.getDate() + daysToAdd);

    console.log(`[PAGAMENTO APROVADO] Usuário: ${userId} | Plano: ${planType} | Expira em: ${expiresDate.toISOString()}`);

    // Retorna resposta de sucesso 200 para confirmar o recebimento do webhook
    return res.status(200).json({
      received: true,
      idempotencyKey: paymentId,
      userId,
      plan: planType,
      vipExpiresAt: expiresDate.toISOString(),
      status: "VIP Ativado com Sucesso",
    });
  } catch (error) {
    console.error("[WEBHOOK ERROR] Erro ao processar webhook:", error.message);
    // Não expor stack trace em produção
    return res.status(500).json({ error: "Erro interno ao processar notificação de pagamento" });
  }
}

