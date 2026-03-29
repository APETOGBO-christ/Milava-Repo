// Base class for payment providers

export type PaymentProviderType =
  | "wave"
  | "orange_money"
  | "mtn_momo"
  | "stripe"
  | "bank_transfer";

export interface PaymentDestination {
  type: "phone" | "account" | "card" | "iban";
  value: string;
  [key: string]: any;
}

export interface PaymentRequest {
  amount: number;
  currency: "USD" | "FCFA";
  destination: PaymentDestination;
  reference: string;
  description?: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId: string;
  status: "pending" | "processing" | "completed" | "failed";
  amount: number;
  fee: number;
  total: number;
  timestamp: string;
  message?: string;
}

export interface ProviderConfig {
  name: PaymentProviderType;
  displayName: string;
  minAmount: number;
  maxAmount: number;
  fee: number;
  fixedFee?: number;
  currency: string;
  isEnabled: boolean;
  isTestMode: boolean;
  apiKey?: string;
  secretKey?: string;
  webhookSecret?: string;
  countries?: string[];
}

export abstract class PaymentProvider {
  protected config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  abstract validateDestination(
    destination: PaymentDestination,
  ): Promise<boolean>;
  abstract processPayment(request: PaymentRequest): Promise<PaymentResponse>;
  abstract getStatus(transactionId: string): Promise<string>;
  abstract refund(
    transactionId: string,
    amount: number,
  ): Promise<PaymentResponse>;

  getName(): PaymentProviderType {
    return this.config.name;
  }

  getConfig(): ProviderConfig {
    return this.config;
  }

  calculateFee(amount: number): number {
    const percentageFee = amount * this.config.fee;
    const fixed = this.config.fixedFee || 0;
    return percentageFee + fixed;
  }

  calculateTotal(amount: number): number {
    return amount + this.calculateFee(amount);
  }

  isEnabled(): boolean {
    return this.config.isEnabled;
  }

  isTestMode(): boolean {
    return this.config.isTestMode;
  }

  validateAmount(amount: number): { valid: boolean; error?: string } {
    if (amount < this.config.minAmount) {
      return {
        valid: false,
        error: `Minimum amount is ${this.config.minAmount} ${this.config.currency}`,
      };
    }

    if (amount > this.config.maxAmount) {
      return {
        valid: false,
        error: `Maximum amount is ${this.config.maxAmount} ${this.config.currency}`,
      };
    }

    return { valid: true };
  }
}

// Payment provider registry
export class PaymentProviderRegistry {
  private providers = new Map<PaymentProviderType, PaymentProvider>();

  register(provider: PaymentProvider): void {
    this.providers.set(provider.getName(), provider);
  }

  getProvider(name: PaymentProviderType): PaymentProvider | undefined {
    return this.providers.get(name);
  }

  getEnabledProviders(): PaymentProvider[] {
    return Array.from(this.providers.values()).filter((p) => p.isEnabled());
  }

  getAllProviders(): PaymentProvider[] {
    return Array.from(this.providers.values());
  }

  hasProvider(name: PaymentProviderType): boolean {
    return this.providers.has(name);
  }
}

// Global registry instance
export const paymentRegistry = new PaymentProviderRegistry();
