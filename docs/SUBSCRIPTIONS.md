# Subscriptions and Billing (Mock)

Phase 13 introduces a mock subscription architecture that is decoupled from payment processors. This allows billing providers to be registered transparently later.

## Payment Provider Factory (`IPaymentProvider`)

```typescript
export interface IPaymentProvider {
  createOrder(amount: number, currency: string, metadata: Record<string, any>): Promise<CreateOrderResult>;
  verifyPayment(orderId: string, signature: string, payload: Record<string, any>): Promise<VerifyPaymentResult>;
  refund(transactionId: string, amount?: number): Promise<{ success: boolean; refundId: string }>;
}
```

## Mock Implementation
- Default provider is `MockPaymentProvider` (throws `PAYMENT_NOT_CONFIGURED`).
- Returning `PAYMENT_NOT_CONFIGURED` allows the frontend to show a friendly "Coming Soon" prompt directing users to contact their administrator.

## Seed Script
The backend seeds plans in the `subscription_plans` table:
- **DAILY**: ₹29 (1 day validity)
- **WEEKLY**: ₹149 (7 days validity)
- **MONTHLY**: ₹399 (30 days validity)
