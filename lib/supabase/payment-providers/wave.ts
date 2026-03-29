// Wave payment provider (Senegal-focused)
import {
  PaymentProvider,
  PaymentProviderType,
  PaymentDestination,
  PaymentRequest,
  PaymentResponse,
  ProviderConfig,
} from "./base";

export class WaveProvider extends PaymentProvider {
  private apiEndpoint = "https://api.wave.com/graphql";
  private testEndpoint = "https://staging-api.wave.com/graphql";

  async validateDestination(destination: PaymentDestination): Promise<boolean> {
    if (destination.type !== "phone") {
      return false;
    }

    // Validate Senegal phone number format (+221XXXXXXXX)
    const phoneRegex = /^\+221[0-9]{9}$/;
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
        message: "Invalid phone number format",
      };
    }

    try {
      const fee = this.calculateFee(request.amount);
      const total = this.calculateTotal(request.amount);

      if (this.isTestMode()) {
        return this.simulatePayment(request, fee);
      }

      // Call Wave API
      const response = await this.callWaveAPI({
        operationName: "SendMoney",
        variables: {
          input: {
            amount: request.amount,
            phone: request.destination.value,
            reference: request.reference,
            description: request.description,
          },
        },
      });

      if (response.data?.sendMoney?.transaction) {
        const transaction = response.data.sendMoney.transaction;
        return {
          success: true,
          transactionId: transaction.id,
          status: "processing",
          amount: request.amount,
          fee,
          total,
          timestamp: new Date().toISOString(),
        };
      }

      throw new Error("Transaction failed");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Payment failed";
      return {
        success: false,
        transactionId: "",
        status: "failed",
        amount: request.amount,
        fee: 0,
        total: 0,
        timestamp: new Date().toISOString(),
        message,
      };
    }
  }

  async getStatus(transactionId: string): Promise<string> {
    try {
      const response = await this.callWaveAPI({
        operationName: "GetTransaction",
        variables: {
          id: transactionId,
        },
      });

      return response.data?.transaction?.status || "unknown";
    } catch {
      return "unknown";
    }
  }

  async refund(
    transactionId: string,
    amount: number,
  ): Promise<PaymentResponse> {
    try {
      const response = await this.callWaveAPI({
        operationName: "RefundTransaction",
        variables: {
          id: transactionId,
          amount,
        },
      });

      if (response.data?.refundTransaction?.success) {
        return {
          success: true,
          transactionId: response.data.refundTransaction.refundId,
          status: "completed",
          amount,
          fee: 0,
          total: amount,
          timestamp: new Date().toISOString(),
        };
      }

      throw new Error("Refund failed");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Refund failed";
      return {
        success: false,
        transactionId: "",
        status: "failed",
        amount,
        fee: 0,
        total: 0,
        timestamp: new Date().toISOString(),
        message,
      };
    }
  }

  private async callWaveAPI(payload: any): Promise<any> {
    const endpoint = this.isTestMode() ? this.testEndpoint : this.apiEndpoint;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Wave API error: ${response.statusText}`);
    }

    return response.json();
  }

  private simulatePayment(
    request: PaymentRequest,
    fee: number,
  ): PaymentResponse {
    return {
      success: Math.random() > 0.1, // 90% success rate
      transactionId: `wave-sim-${Date.now()}`,
      status: "processing",
      amount: request.amount,
      fee,
      total: request.amount + fee,
      timestamp: new Date().toISOString(),
      message: "Simulated transaction (test mode)",
    };
  }
}
