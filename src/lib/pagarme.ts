// src/lib/pagarme.ts

const PAGARME_API_URL = 'https://api.pagar.me/core/v5';

// Tipos Base da API Pagar.me
export interface PagarmePhone {
  country_code: string;
  area_code: string;
  number: string;
}

export interface PagarmeCustomer {
  name: string;
  email: string;
  document?: string;
  type?: 'individual' | 'company';
  phones?: {
    mobile_phone: PagarmePhone;
  };
}

export interface PagarmeItem {
  amount: number; // Em centavos
  description: string;
  quantity: number;
}

export interface PagarmeCreditCard {
  installments?: number;
  statement_descriptor?: string;
  card: {
    number: string;
    holder_name: string;
    exp_month: number;
    exp_year: number;
    cvv: string;
    billing_address?: {
      line_1: string;
      zip_code: string;
      city: string;
      state: string;
      country: string;
    };
  };
}

export interface PagarmeDebitCard {
  statement_descriptor?: string;
  card: {
    number: string;
    holder_name: string;
    exp_month: number;
    exp_year: number;
    cvv: string;
  };
  recurrence?: boolean;
}

export interface PagarmePix {
  expires_in: number; // Em segundos
  additional_information?: Array<{ name: string; value: string }>;
}

export interface PagarmeOrderRequest {
  items: PagarmeItem[];
  customer: PagarmeCustomer;
  payments: Array<{
    payment_method: 'credit_card' | 'debit_card' | 'pix' | 'boleto';
    credit_card?: PagarmeCreditCard;
    debit_card?: PagarmeDebitCard;
    pix?: PagarmePix;
  }>;
  metadata?: Record<string, string>;
}

export interface PagarmeSubscriptionRequest {
  payment_method: 'credit_card' | 'boleto' | 'debit_card' | 'cash';
  currency: 'BRL';
  interval: 'day' | 'week' | 'month' | 'year';
  interval_count: number;
  billing_type: 'prepaid' | 'postpaid' | 'exact_day';
  installments?: number;
  statement_descriptor?: string;
  customer: PagarmeCustomer;
  card?: PagarmeCreditCard['card'];
  items: PagarmeItem[];
  metadata?: Record<string, string>;
}

// Utilitário para formatar o telefone no padrão Pagar.me PSP
export function formatPagarmePhone(telefoneBase: string): PagarmePhone | undefined {
  const digits = telefoneBase.replace(/\D/g, '');
  if (digits.length < 10) return undefined;

  // Assumindo DDI 55 (Brasil) caso não seja passado, e extraindo o DDD.
  return {
    country_code: '55',
    area_code: digits.substring(0, 2),
    number: digits.substring(2)
  };
}

// Utilitário Principal para Fetch na API Pagar.me
export async function pagarmeFetch(endpoint: string, options: RequestInit = {}) {
  const secretKey = process.env.PAGARME_SECRET_KEY;

  if (!secretKey) {
    throw new Error("PAGARME_SECRET_KEY não configurada no ambiente.");
  }

  // Basic Auth com SecretKey vazia na senha
  const basicAuth = Buffer.from(`${secretKey}:`).toString('base64');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${basicAuth}`,
    ...options.headers,
  };

  const response = await fetch(`${PAGARME_API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    // Trata erros 400, 401, 404, 422, etc, retornando a mensagem detalhada do Pagar.me
    let errorMessage = data.message || "Erro desconhecido na API de Pagamentos.";
    
    if (data.errors) {
      // Pagar.me envia detalhes de erro em um objeto "errors"
      const errorDetails = Object.values(data.errors).flat().join(', ');
      errorMessage = `${errorMessage} Detalhes: ${errorDetails}`;
    }

    throw new Error(errorMessage);
  }

  return data;
}

// Função de fachada para criar um pedido avulso (Orders) - Ideal para PIX
export async function createPagarmeOrder(payload: PagarmeOrderRequest) {
  return pagarmeFetch('/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// Função de fachada para criar uma assinatura recorrente (Subscriptions) - Ideal para Cartão
export async function createPagarmeSubscription(payload: PagarmeSubscriptionRequest) {
  return pagarmeFetch('/subscriptions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
