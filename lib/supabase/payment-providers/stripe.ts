// Stripe payment provider implementation
import {
  PaymentProvider,
  PaymentDestination,
  PaymentRequest,
  PaymentResponse,
  ProviderConfig,
} from "./base";

export class StripeProvider extends PaymentProvider {
  private apiKey: string;
  private webhookSecret: string;

  constructor(config: ProviderConfig) {
    super(config);
    this.apiKey = config.apiKey || "";
    this.webhookSecret = config.webhookSecret || "";
  }

  async validateDestination(destination: PaymentDestination): Promise<boolean> {
    // Stripe uses email for customer identification
    if (destination.type !== "account") {
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(destination.value);
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    // Validate amount (Stripe amounts in cents)
    const amountCheck = this.validateAmount(request.amount);
    if (!amountCheck.valid) {
      return {
        success: false,
        transactionId: "",
        status: "failed",
        amount: request.amount,
        fee: 0,
        total: 0,
        timestamp: new Date().toISOString(),
        message: amountCheck.error,
      };
    }

    // Validate destination
    const isValid = await this.validateDestination(request.destination);
    if (!isValid) {
      return {
        success: false,
        transactionId: "",
        status: "failed",
        amount: request.amount,
        fee: 0,
        total: 0,
        timestamp: new Date().toISOString(),
        message: "Invalid email address",
      };
    }

    try {
      const fee = this.calculateFee(request.amount);
      const total = this.calculateTotal(request.amount);
      const amountInCents = Math.round(request.amount * 100);

      if (this.isTestMode()) {
        return {
          success: false,
          transactionId: "",
          status: "failed",
          amount: request.amount,
          fee: Math.round(fee),
          total: Math.round(total),
          timestamp: new Date().toISOString(),
          message:
            "Stripe provider is in test mode and does not run simulated payouts.",
        };
      }

      return await this.callStripeAPI(amountInCents, request, fee, total);
    } catch (error) {
      return {
        success: false,
        transactionId: "",
        status: "failed",
        amount: request.amount,
        fee: 0,
        total: 0,
        timestamp: new Date().toISOString(),
        message: `Stripe error: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }
  private async callStripeAPI(
    amountInCents: number,
    request: PaymentRequest,
    fee: number,
    total: number,
  ): Promise<PaymentResponse> {
    try {
      const response = await fetch(
        "https://api.stripe.com/v1/payment_intents",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            amount: amountInCents.toString(),
            currency: (request.currency || "usd").toLowerCase(),
            customer: request.destination.value,
            metadata: JSON.stringify({
              reference: request.reference,
              description: request.description,
            }),
            receipt_email: request.destination.value,
          }).toString(),
        },
      );

      if (!response.ok) {
        throw new Error(`Stripe API returned ${response.status}`);
      }

      const data = (await response.json()) as {
        id: string;
        status: string;
      };

      return {
        success: data.status === "succeeded",
        transactionId: data.id,
        status: (data.status === "succeeded" ? "completed" : "pending") as
          | "pending"
          | "processing"
          | "completed"
          | "failed",
        amount: request.amount,
        fee: Math.round(fee),
        total: Math.round(total),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw error;
    }
  }

  async getStatus(transactionId: string): Promise<string> {
    try {
      const response = await fetch(
        `https://api.stripe.com/v1/payment_intents/${transactionId}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        },
      );

      if (!response.ok) {
        return "unknown";
      }

      const data = (await response.json()) as { status: string };
      return data.status;
    } catch {
      return "unknown";
    }
  }

  async refund(
    transactionId: string,
    amount: number,
  ): Promise<PaymentResponse> {
    try {
      const response = await fetch("https://api.stripe.com/v1/refunds", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          payment_intent: transactionId,
          reason: "requested_by_customer",
        }).toString(),
      });

      if (!response.ok) {
        return {
          success: false,
          transactionId: "",
          status: "failed",
          amount,
          fee: 0,
          total: 0,
          timestamp: new Date().toISOString(),
          message: `Refund failed: ${response.status}`,
        };
      }

      const data = (await response.json()) as {
        id: string;
      };

      return {
        success: true,
        transactionId: data.id,
        status: "completed",
        amount,
        fee: 0,
        total: amount,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        transactionId: "",
        status: "failed",
        amount,
        fee: 0,
        total: 0,
        timestamp: new Date().toISOString(),
        message: `Refund error: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  // Verify webhook signature from Stripe
  verifyWebhookSignature(payload: string, signature: string): boolean {
    // In production, use crypto to verify HMAC-SHA256
    // This is a placeholder for the actual implementation
    return signature.length > 0 && payload.length > 0;
  }
}
