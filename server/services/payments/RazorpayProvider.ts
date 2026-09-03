import crypto from 'crypto';
import Razorpay from 'razorpay';
import {
  PaymentProvider,
  PaymentGatewayStatus,
  PaymentGatewayMode,
  CreateOrderParams,
  ProviderOrderResult,
  VerifyPaymentParams,
  VerificationResult,
  WebhookEventResult,
  RefundParams,
  RefundResult,
} from './types.js';

export class RazorpayProvider implements PaymentProvider {
  readonly name = 'RAZORPAY';

  private getCredentials() {
    const keyId = (process.env.RAZORPAY_KEY_ID || '').trim();
    const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
    const webhookSecret = (process.env.RAZORPAY_WEBHOOK_SECRET || '').trim();
    return { keyId, keySecret, webhookSecret };
  }

  isConfigured(): boolean {
    const { keyId, keySecret } = this.getCredentials();
    return Boolean(keyId && keySecret);
  }

  isTestMode(): boolean {
    const { keyId } = this.getCredentials();
    if (!keyId) return true;
    return keyId.startsWith('rzp_test_');
  }

  getStatus(): PaymentGatewayStatus {
    const { keyId, keySecret, webhookSecret } = this.getCredentials();
    const isConfigured = Boolean(keyId && keySecret);
    let mode: PaymentGatewayMode = 'NOT_CONFIGURED';

    if (isConfigured) {
      mode = keyId.startsWith('rzp_live_') ? 'LIVE' : 'TEST';
    }

    return {
      provider: this.name,
      isConfigured,
      mode,
      keyId: isConfigured ? keyId : null,
      webhookConfigured: Boolean(webhookSecret),
    };
  }

  private getClient(): Razorpay {
    const { keyId, keySecret } = this.getCredentials();
    if (!keyId || !keySecret) {
      throw new Error('PAYMENT_CONFIGURATION_REQUIRED: Razorpay credentials are not configured on the server.');
    }
    return new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  async createOrder(params: CreateOrderParams): Promise<ProviderOrderResult> {
    if (!this.isConfigured()) {
      throw new Error('PAYMENT_CONFIGURATION_REQUIRED: Server Razorpay credentials missing.');
    }

    const { keyId } = this.getCredentials();
    const client = this.getClient();

    // Razorpay amounts are represented in the smallest currency sub-unit (paise for INR)
    const amountInPaise = Math.round(params.amount * 100);

    // Razorpay receipt has a 40 character maximum constraint
    const safeReceipt = (params.receipt || params.orderId).slice(0, 40);

    const safeNotes: Record<string, string> = {
      internal_order_id: params.orderId,
      ...(params.notes || {}),
    };

    try {
      const razorpayOrder = await client.orders.create({
        amount: amountInPaise,
        currency: params.currency || 'INR',
        receipt: safeReceipt,
        notes: safeNotes,
      });

      return {
        provider: this.name,
        providerOrderId: razorpayOrder.id,
        amount: params.amount,
        currency: params.currency || 'INR',
        keyId,
        raw: razorpayOrder,
      };
    } catch (err: any) {
      console.error('[RazorpayProvider] Order creation failed:', err.message);
      throw new Error(`Payment gateway order creation failed: ${err.message}`);
    }
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<VerificationResult> {
    const { keySecret } = this.getCredentials();

    if (!keySecret) {
      return {
        isValid: false,
        providerPaymentId: params.providerPaymentId,
        providerOrderId: params.providerOrderId,
        error: 'PAYMENT_CONFIGURATION_REQUIRED: Server key secret missing.',
      };
    }

    if (!params.providerOrderId || !params.providerPaymentId || !params.signature) {
      return {
        isValid: false,
        providerPaymentId: params.providerPaymentId,
        providerOrderId: params.providerOrderId,
        error: 'Missing required signature verification parameters.',
      };
    }

    try {
      // Official Razorpay HMAC-SHA256 signature verification:
      // payload = `${order_id}|${payment_id}`
      const body = `${params.providerOrderId}|${params.providerPaymentId}`;
      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(body)
        .digest('hex');

      const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
      const signatureBuffer = Buffer.from(params.signature, 'utf8');

      const isValid =
        expectedBuffer.length === signatureBuffer.length &&
        crypto.timingSafeEqual(expectedBuffer, signatureBuffer);

      if (!isValid) {
        return {
          isValid: false,
          providerPaymentId: params.providerPaymentId,
          providerOrderId: params.providerOrderId,
          error: 'Signature verification mismatch.',
        };
      }

      return {
        isValid: true,
        providerPaymentId: params.providerPaymentId,
        providerOrderId: params.providerOrderId,
      };
    } catch (err: any) {
      return {
        isValid: false,
        providerPaymentId: params.providerPaymentId,
        providerOrderId: params.providerOrderId,
        error: `Verification error: ${err.message}`,
      };
    }
  }

  async verifyWebhook(
    headers: Record<string, any>,
    rawBody: string | Buffer
  ): Promise<WebhookEventResult> {
    const { webhookSecret } = this.getCredentials();

    if (!webhookSecret) {
      return {
        isValid: false,
        eventId: 'unknown',
        eventType: 'unknown',
        error: 'WEBHOOK_CONFIGURATION_REQUIRED: RAZORPAY_WEBHOOK_SECRET is not configured on server.',
      };
    }

    const signature = headers['x-razorpay-signature'] || headers['X-Razorpay-Signature'];
    if (!signature || typeof signature !== 'string') {
      return {
        isValid: false,
        eventId: 'unknown',
        eventType: 'unknown',
        error: 'Missing X-Razorpay-Signature header in webhook request.',
      };
    }

    try {
      const bodyBuffer = typeof rawBody === 'string' ? Buffer.from(rawBody, 'utf8') : rawBody;
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(bodyBuffer)
        .digest('hex');

      const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
      const signatureBuffer = Buffer.from(signature, 'utf8');

      const isValid =
        expectedBuffer.length === signatureBuffer.length &&
        crypto.timingSafeEqual(expectedBuffer, signatureBuffer);

      if (!isValid) {
        return {
          isValid: false,
          eventId: 'unknown',
          eventType: 'unknown',
          error: 'Webhook cryptographic signature validation failed.',
        };
      }

      // Parse payload
      const payloadString = bodyBuffer.toString('utf8');
      const data = JSON.parse(payloadString);

      const eventId = (headers['x-razorpay-event-id'] as string) || data.id || `evt_${Date.now()}`;
      const eventType = data.event || 'unknown';

      // Extract details based on event type
      let providerOrderId: string | undefined;
      let providerPaymentId: string | undefined;
      let amount: number | undefined;
      let currency: string | undefined;
      let status: 'PAID' | 'FAILED' | 'REFUNDED' | 'OTHER' = 'OTHER';

      if (data.payload?.payment?.entity) {
        const paymentEntity = data.payload.payment.entity;
        providerPaymentId = paymentEntity.id;
        providerOrderId = paymentEntity.order_id;
        if (typeof paymentEntity.amount === 'number') {
          amount = paymentEntity.amount / 100;
        }
        currency = paymentEntity.currency;
      }

      if (data.payload?.order?.entity && !providerOrderId) {
        providerOrderId = data.payload.order.entity.id;
      }

      if (eventType === 'payment.captured' || eventType === 'order.paid') {
        status = 'PAID';
      } else if (eventType === 'payment.failed') {
        status = 'FAILED';
      } else if (eventType === 'refund.processed' || eventType === 'refund.created') {
        status = 'REFUNDED';
      }

      return {
        isValid: true,
        eventId,
        eventType,
        providerOrderId,
        providerPaymentId,
        amount,
        currency,
        status,
        rawPayload: data,
      };
    } catch (err: any) {
      return {
        isValid: false,
        eventId: 'unknown',
        eventType: 'unknown',
        error: `Webhook parsing error: ${err.message}`,
      };
    }
  }

  async refund(params: RefundParams): Promise<RefundResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        status: 'CONFIGURATION_REQUIRED',
        error: 'PAYMENT_CONFIGURATION_REQUIRED: Razorpay credentials required to process refund.',
      };
    }

    try {
      const client = this.getClient();
      const refundOptions: any = {};

      if (typeof params.amount === 'number' && params.amount > 0) {
        refundOptions.amount = Math.round(params.amount * 100);
      }

      if (params.reason) {
        refundOptions.notes = { reason: params.reason };
      }

      const refundRecord = await client.payments.refund(params.providerPaymentId, refundOptions);

      return {
        success: true,
        refundId: refundRecord.id,
        amount: typeof refundRecord.amount === 'number' ? refundRecord.amount / 100 : params.amount,
        status: refundRecord.status || 'processed',
      };
    } catch (err: any) {
      console.error('[RazorpayProvider] Refund failed:', err.message);
      return {
        success: false,
        status: 'FAILED',
        error: err.message,
      };
    }
  }
}
