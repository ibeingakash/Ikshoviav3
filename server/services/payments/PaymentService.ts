import { PaymentProvider, PaymentGatewayStatus, CreateOrderParams, ProviderOrderResult, VerifyPaymentParams, VerificationResult, WebhookEventResult, RefundParams, RefundResult } from './types.js';
import { RazorpayProvider } from './RazorpayProvider.js';

export class PaymentService {
  private providers: Map<string, PaymentProvider> = new Map();
  private activeProviderName: string = 'RAZORPAY';

  constructor() {
    const razorpay = new RazorpayProvider();
    this.providers.set(razorpay.name, razorpay);
  }

  registerProvider(provider: PaymentProvider) {
    this.providers.set(provider.name, provider);
  }

  setActiveProvider(name: string) {
    if (!this.providers.has(name)) {
      throw new Error(`Payment provider '${name}' is not registered.`);
    }
    this.activeProviderName = name;
  }

  getProvider(name?: string): PaymentProvider {
    const target = name || this.activeProviderName;
    const provider = this.providers.get(target);
    if (!provider) {
      throw new Error(`Payment provider '${target}' not found.`);
    }
    return provider;
  }

  getGatewayStatus(): PaymentGatewayStatus {
    return this.getProvider().getStatus();
  }

  async createOrder(params: CreateOrderParams): Promise<ProviderOrderResult> {
    return this.getProvider().createOrder(params);
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<VerificationResult> {
    return this.getProvider().verifyPayment(params);
  }

  async verifyWebhook(
    headers: Record<string, any>,
    rawBody: string | Buffer
  ): Promise<WebhookEventResult> {
    return this.getProvider().verifyWebhook(headers, rawBody);
  }

  async refund(params: RefundParams): Promise<RefundResult> {
    return this.getProvider().refund(params);
  }
}

export const paymentService = new PaymentService();
