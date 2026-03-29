// Orange Money payment provider implementation
import {
  PaymentProvider,
  PaymentDestination,
  PaymentRequest,
  PaymentResponse,
  ProviderConfig,
} from "./base";

export class OrangeMoneyProvider extends PaymentProvider {
  private apiKey: string;
  private apiUrl: string;

  constructor(config: ProviderConfig) {
    super(config);
    this.apiKey = config.apiKey || "";
    this.apiUrl = "https://api.orange.com/orange-money";
  }

  async validateDestination(destination: PaymentDestination): Promise<boolean> {
    // Orange Money phone validation
    if (destination.type !== "phone") {
      return false;
    }

    const phoneRegex = /^\+\d{2,3}\d{7,9}$/;
    return phoneRegex.test(destination.value);
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    // Validate amount
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
        message: "Invalid phone number",
      };
    }

    try {
      const fee = this.calculateFee(request.amount);
      const total = this.calculateTotal(request.amount);

      if (this.isTestMode()) {
        return this.simulatePayment(request, fee, total);
      }

      return await this.callOrangeMoneyAPI(request, fee, total);
    } catch (error) {
      return {
        success: false,
        transactionId: "",
        status: "failed",
        amount: request.amount,
        fee: 0,
        total: 0,
        timestamp: new Date().toISOString(),
        message: `Orange Money error: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  private simulatePayment(
    request: PaymentRequest,
    fee: number,
    total: number,
  ): PaymentResponse {
    // 85% success rate in test mode
    const success = Math.random() > 0.15;

    if (success) {
      return {
        success: true,
        transactionId: `OM-${request.reference}-${Date.now()}`,
        status: "completed",
        amount: request.amount,
        fee: Math.round(fee),
        total: Math.round(total),
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: false,
      transactionId: "",
      status: "failed",
      amount: request.amount,
      fee: 0,
      total: 0,
      timestamp: new Date().toISOString(),
      message: "Simulated payment failure: Insufficient balance",
    };
  }

  private async callOrangeMoneyAPI(
    request: PaymentRequest,
    fee: number,
    total: number,
  ): Promise<PaymentResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/v1/payment`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: request.amount,
          currency: request.currency,
          phoneNumber: request.destination.value,
          reference: request.reference,
          description: request.description || "Payment",
        }),
      });

      if (!response.ok) {
        throw new Error(`Orange Money API returned ${response.status}`);
      }

      const data = (await response.json()) as {
        transactionId: string;
        status: string;
      };

      return {
        success: data.status === "completed",
        transactionId: data.transactionId,
        status: data.status as
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
        `${this.apiUrl}/v1/transactions/${transactionId}`,
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
      const response = await fetch(`${this.apiUrl}/v1/refunds`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactionId,
          reason: "User requested refund",
        }),
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
        refundId: string;
      };

      return {
        success: true,
        transactionId: data.refundId,
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
}
