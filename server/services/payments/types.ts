export type PaymentStatus =
  | 'CREATED'
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'VERIFICATION_PENDING';

export type PaymentGatewayMode = 'TEST' | 'LIVE' | 'NOT_CONFIGURED';

export interface PaymentGatewayStatus {
  provider: string;
  isConfigured: boolean;
  mode: PaymentGatewayMode;
  keyId: string | null;
  webhookConfigured: boolean;
}

export interface CreateOrderParams {
  orderId: string; // internal local order ID
  amount: number; // in standard currency units (e.g. INR 2499.00)
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
  customer?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ProviderOrderResult {
  provider: string;
  providerOrderId: string;
  amount: number;
  currency: string;
  keyId?: string;
  raw?: any;
}

export interface VerifyPaymentParams {
  providerOrderId: string;
  providerPaymentId: string;
  signature?: string;
  rawPayload?: any;
}

export interface VerificationResult {
  isValid: boolean;
  providerPaymentId: string;
  providerOrderId: string;
  amount?: number;
  currency?: string;
  method?: string;
  error?: string;
}

export interface WebhookEventResult {
  isValid: boolean;
  eventId: string;
  eventType: string;
  providerOrderId?: string;
  providerPaymentId?: string;
  amount?: number;
  currency?: string;
  status?: 'PAID' | 'FAILED' | 'REFUNDED' | 'OTHER';
  rawPayload?: any;
  error?: string;
}

export interface RefundParams {
  providerPaymentId: string;
  amount?: number; // optional partial refund amount in standard currency
  currency?: string;
  reason?: string;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  amount?: number;
  status: string;
  error?: string;
}

export interface PaymentProvider {
  readonly name: string;
  isConfigured(): boolean;
  isTestMode(): boolean;
  getStatus(): PaymentGatewayStatus;
  createOrder(params: CreateOrderParams): Promise<ProviderOrderResult>;
  verifyPayment(params: VerifyPaymentParams): Promise<VerificationResult>;
  verifyWebhook(headers: Record<string, any>, rawBody: string | Buffer): Promise<WebhookEventResult>;
  refund(params: RefundParams): Promise<RefundResult>;
}
