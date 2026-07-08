/**
 * Payment Provider Abstraction Layer
 *
 * This module defines the interface for payment gateway integration.
 * Payment gateways can be integrated by implementing IPaymentProvider
 * and registering them in PaymentProviderFactory.
 *
 * Currently uses MockPaymentProvider as placeholder until a real gateway
 * (Razorpay, Stripe, PayU, etc.) is configured.
 */

export interface CreateOrderResult {
  orderId: string;
  amount: number;
  currency: string;
  metadata: Record<string, any>;
}

export interface VerifyPaymentResult {
  success: boolean;
  transactionId: string;
  metadata: Record<string, any>;
}

export interface IPaymentProvider {
  createOrder(amount: number, currency: string, metadata: Record<string, any>): Promise<CreateOrderResult>;
  verifyPayment(orderId: string, signature: string, payload: Record<string, any>): Promise<VerifyPaymentResult>;
  refund(transactionId: string, amount?: number): Promise<{ success: boolean; refundId: string }>;
}

/**
 * Mock payment provider — placeholder that throws until a real gateway is configured.
 * Replace with a real implementation when payment gateway details are provided.
 */
class MockPaymentProvider implements IPaymentProvider {
  async createOrder(_amount: number, _currency: string, _metadata: Record<string, any>): Promise<CreateOrderResult> {
    throw new Error('Payment gateway not configured. Please contact the administrator.');
  }

  async verifyPayment(_orderId: string, _signature: string, _payload: Record<string, any>): Promise<VerifyPaymentResult> {
    throw new Error('Payment gateway not configured. Please contact the administrator.');
  }

  async refund(_transactionId: string, _amount?: number): Promise<{ success: boolean; refundId: string }> {
    throw new Error('Payment gateway not configured. Please contact the administrator.');
  }
}

/**
 * Factory — returns the configured payment provider.
 * To integrate a payment gateway, set PAYMENT_PROVIDER env var and add the implementation here.
 */
export class PaymentProviderFactory {
  static getProvider(): IPaymentProvider {
    const provider = process.env.PAYMENT_PROVIDER || 'mock';
    switch (provider) {
      case 'mock':
      default:
        return new MockPaymentProvider();
      // Future integrations:
      // case 'razorpay': return new RazorpayProvider();
      // case 'stripe': return new StripeProvider();
    }
  }
}
