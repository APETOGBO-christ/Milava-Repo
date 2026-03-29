import { PaymentProvider, WithdrawalRequest } from "@/lib/supabase/wallet";

export interface PaymentProviderConfig {
  name: string;
  code: PaymentProvider;
  minAmount: number;
  maxAmount: number;
  feePercentage: number;
  currencySupport: string[];
  requiresPhone: boolean;
  phoneFormat?: string;
  displayName: string;
  logo?: string;
  description: string;
}

export class PaymentService {
  private providers: Map<PaymentProvider, PaymentProviderConfig> = new Map([
    [
      "wave",
      {
        name: "Wave",
        code: "wave",
        minAmount: 500,
        maxAmount: 500000,
        feePercentage: 1,
        currencySupport: ["FCFA", "XOF"],
        requiresPhone: true,
        phoneFormat: "+221XXXXXXXXX or XXXXXXXXX (Senegal)",
        displayName: "Wave Money",
        description: "Mobile money service for West Africa",
      },
    ],
    [
      "orange_money",
      {
        name: "Orange Money",
        code: "orange_money",
        minAmount: 500,
        maxAmount: 500000,
        feePercentage: 1.5,
        currencySupport: ["FCFA", "XOF"],
        requiresPhone: true,
        phoneFormat: "+221XXXXXXXXX or XXXXXXXXX",
        displayName: "Orange Money",
        description: "Mobile money service across Africa",
      },
    ],
    [
      "mtn_momo",
      {
        name: "MTN MoMo",
        code: "mtn_momo",
        minAmount: 100,
        maxAmount: 500000,
        feePercentage: 1,
        currencySupport: ["FCFA", "XOF"],
        requiresPhone: true,
        phoneFormat: "+221XXXXXXXXX or XXXXXXXXX",
        displayName: "MTN Mobile Money",
        description: "MTN mobile money across Africa",
      },
    ],
    [
      "bank_transfer",
      {
        name: "Bank Transfer",
        code: "bank_transfer",
        minAmount: 5000,
        maxAmount: 5000000,
        feePercentage: 2,
        currencySupport: ["FCFA", "XOF", "USD"],
        requiresPhone: false,
        displayName: "Bank Transfer",
        description: "Direct bank account transfer",
      },
    ],
    [
      "card",
      {
        name: "Stripe Card",
        code: "card",
        minAmount: 5,
        maxAmount: 100000,
        feePercentage: 3.5,
        currencySupport: ["USD"],
        requiresPhone: false,
        displayName: "Credit/Debit Card",
        description: "Visa, Mastercard via Stripe",
      },
    ],
  ]);

  getProviderConfig(provider: PaymentProvider): PaymentProviderConfig | null {
    return this.providers.get(provider) || null;
  }

  getAllProviders(): PaymentProviderConfig[] {
    return Array.from(this.providers.values());
  }

  validateDestination(
    provider: PaymentProvider,
    destination: string,
  ): {
    valid: boolean;
    error?: string;
  } {
    const config = this.getProviderConfig(provider);
    if (!config) {
      return { valid: false, error: "Provider not found" };
    }

    if (config.requiresPhone) {
      // Validate phone number format (simplified)
      const phoneRegex = /^(\+?221|0)?[0-9]{9}$/;
      if (!phoneRegex.test(destination.replace(/\s/g, ""))) {
        return {
          valid: false,
          error: `Format de téléphone invalide pour ${config.displayName}`,
        };
      }
    } else if (provider === "bank_transfer") {
      // Very basic bank account validation
      if (destination.length < 10) {
        return {
          valid: false,
          error: "Numéro de compte bancaire invalide",
        };
      }
    }

    return { valid: true };
  }

  calculateFee(
    amount: number,
    provider: PaymentProvider,
  ): {
    amount: number;
    fee: number;
    total: number;
  } {
    const config = this.getProviderConfig(provider);
    if (!config) {
      throw new Error("Provider not found");
    }

    if (amount < config.minAmount || amount > config.maxAmount) {
      throw new Error(
        `Amount must be between ${config.minAmount} and ${config.maxAmount} FCFA`,
      );
    }

    const fee = amount * (config.feePercentage / 100);
    return {
      amount,
      fee: Math.round(fee * 100) / 100,
      total: amount + fee,
    };
  }

  async validateWithdrawal(
    withdrawal: WithdrawalRequest,
  ): Promise<{ valid: boolean; error?: string }> {
    // Validate provider exists
    if (!this.getProviderConfig(withdrawal.provider)) {
      return { valid: false, error: "Payment provider not supported" };
    }

    // Validate amount
    const config = this.getProviderConfig(withdrawal.provider)!;
    if (withdrawal.amount < config.minAmount) {
      return {
        valid: false,
        error: `Montant minimum: ${config.minAmount} FCFA`,
      };
    }
    if (withdrawal.amount > config.maxAmount) {
      return {
        valid: false,
        error: `Montant maximum: ${config.maxAmount} FCFA`,
      };
    }

    // Validate destination
    const destValidation = this.validateDestination(
      withdrawal.provider,
      withdrawal.destination_label,
    );
    if (!destValidation.valid) {
      return destValidation;
    }

    return { valid: true };
  }

  async initiatePayment(
    withdrawal: WithdrawalRequest,
  ): Promise<{ success: boolean; reference?: string; error?: string }> {
    // Validate withdrawal
    const validation = await this.validateWithdrawal(withdrawal);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // In production, this would call the actual payment provider API
    // For now, return a mock response

    // Simulate different provider behaviors
    switch (withdrawal.provider) {
      case "wave":
        return this.initiateWavePayment(withdrawal);
      case "orange_money":
        return this.initiateOrangeMoneyPayment(withdrawal);
      case "mtn_momo":
        return this.initiateMTNPayment(withdrawal);
      case "bank_transfer":
        return this.initiateBankTransfer(withdrawal);
      case "card":
        return this.initiateCardPayment(withdrawal);
      default:
        return { success: false, error: "Unknown provider" };
    }
  }

  private async initiateWavePayment(
    withdrawal: WithdrawalRequest,
  ): Promise<{ success: boolean; reference?: string; error?: string }> {
    // Mock: In production, call Wave API
    // POST https://api.wave.com/graphql with GraphQL mutation
    const reference = `WAVE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      success: true,
      reference,
    };
  }

  private async initiateOrangeMoneyPayment(
    withdrawal: WithdrawalRequest,
  ): Promise<{ success: boolean; reference?: string; error?: string }> {
    // Mock: In production, call Orange Money API
    const reference = `ORANGE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      success: true,
      reference,
    };
  }

  private async initiateMTNPayment(
    withdrawal: WithdrawalRequest,
  ): Promise<{ success: boolean; reference?: string; error?: string }> {
    // Mock: In production, call MTN API
    const reference = `MTN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      success: true,
      reference,
    };
  }

  private async initiateBankTransfer(
    withdrawal: WithdrawalRequest,
  ): Promise<{ success: boolean; reference?: string; error?: string }> {
    // Mock: In production, integrate with banking system
    const reference = `BANK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      success: true,
      reference,
    };
  }

  private async initiateCardPayment(
    withdrawal: WithdrawalRequest,
  ): Promise<{ success: boolean; reference?: string; error?: string }> {
    // Mock: In production, call Stripe API
    const reference = `STRIPE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      success: true,
      reference,
    };
  }

  getPaymentProviderIcon(provider: PaymentProvider): string {
    const icons: Record<PaymentProvider, string> = {
      wave: "💳",
      orange_money: "🟠",
      mtn_momo: "🟡",
      bank_transfer: "🏦",
      card: "💰",
    };
    return icons[provider] || "💳";
  }
}
