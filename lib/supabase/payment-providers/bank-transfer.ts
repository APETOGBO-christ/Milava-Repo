// Bank Transfer payment provider implementation
import {
  PaymentProvider,
  PaymentDestination,
  PaymentRequest,
  PaymentResponse,
  ProviderConfig,
} from "./base";

export class BankTransferProvider extends PaymentProvider {
  constructor(config: ProviderConfig) {
    super(config);
  }

  async validateDestination(destination: PaymentDestination): Promise<boolean> {
    // Bank transfer uses IBAN
    if (destination.type !== "iban") {
      return false;
    }

    // IBAN validation (basic format check)
    const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/;
    return ibanRegex.test(destination.value.replace(/\s/g, ""));
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
        message: "Invalid IBAN format",
      };
    }

    try {
      const fee = this.calculateFee(request.amount);
      const total = this.calculateTotal(request.amount);
      return this.createBankTransferRequest(request, fee, total);
    } catch (error) {
      return {
        success: false,
        transactionId: "",
        status: "failed",
        amount: request.amount,
        fee: 0,
        total: 0,
        timestamp: new Date().toISOString(),
        message: `Bank transfer error: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  private createBankTransferRequest(
    request: PaymentRequest,
    fee: number,
    total: number,
  ): PaymentResponse {
    const transactionId = `BT-${request.reference}-${Date.now()}`;

    return {
      success: true,
      transactionId,
      status: "pending", // Requires manual processing
      amount: request.amount,
      fee: Math.round(fee),
      total: Math.round(total),
      timestamp: new Date().toISOString(),
      message:
        "Bank transfer pending - requires manual verification and processing (2-5 business days)",
    };
  }

  async getStatus(transactionId: string): Promise<string> {
    // Bank transfer status would be checked from database
    // Querying actual bank status is complex and provider-specific
    return "pending";
  }

  async refund(
    transactionId: string,
    amount: number,
  ): Promise<PaymentResponse> {
    // Bank transfer refunds require reaching out to actual bank
    // This is mostly a manual process
    return {
      success: false,
      transactionId: "",
      status: "failed",
      amount,
      fee: 0,
      total: 0,
      timestamp: new Date().toISOString(),
      message:
        "Bank transfer refunds require manual processing. Please contact support.",
    };
  }

  // Additional method for bank transfer details
  getBankTransferInstructions(
    amount: number,
    reference: string,
  ): {
    iban: string;
    swift: string;
    amount: number;
    reference: string;
  } | null {
    // These would come from configuration
    return {
      iban: "FR1420041010050500013M02606", // Placeholder
      swift: "BNPAFRPP",
      amount,
      reference,
    };
  }
}
