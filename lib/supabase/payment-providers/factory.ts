// Payment provider factory and management
import {
  PaymentProvider,
  PaymentProviderRegistry,
  ProviderConfig,
  PaymentProviderType,
} from "./base";
import { WaveProvider } from "./wave";
import { OrangeMoneyProvider } from "./orange-money";
import { MTNProvider } from "./mtn";
import { StripeProvider } from "./stripe";
import { BankTransferProvider } from "./bank-transfer";

export class PaymentProviderFactory {
  static createProvider(config: ProviderConfig): PaymentProvider {
    switch (config.name) {
      case "wave":
        return new WaveProvider(config);
      case "orange_money":
        return new OrangeMoneyProvider(config);
      case "mtn_momo":
        return new MTNProvider(config);
      case "stripe":
        return new StripeProvider(config);
      case "bank_transfer":
        return new BankTransferProvider(config);
      default:
        throw new Error(`Unknown payment provider: ${config.name}`);
    }
  }
}

// Default provider configurations
export const DEFAULT_PROVIDER_CONFIGS: Record<
  PaymentProviderType,
  ProviderConfig
> = {
  wave: {
    name: "wave",
    displayName: "Wave",
    minAmount: 500,
    maxAmount: 500000,
    fee: 0.01, // 1%
    currency: "FCFA",
    isEnabled: true,
    isTestMode: true, // Development mode by default
    countries: ["SN", "GM", "CI", "ML", "BJ"],
  },
  orange_money: {
    name: "orange_money",
    displayName: "Orange Money",
    minAmount: 500,
    maxAmount: 500000,
    fee: 0.015, // 1.5%
    currency: "FCFA",
    isEnabled: false,
    isTestMode: true,
    countries: ["SN", "CI", "CM", "GN", "CD"],
  },
  mtn_momo: {
    name: "mtn_momo",
    displayName: "MTN MoMo",
    minAmount: 100,
    maxAmount: 500000,
    fee: 0.01, // 1%
    currency: "FCFA",
    isEnabled: false,
    isTestMode: true,
    countries: ["GH", "CM", "CI", "RW", "UG"],
  },
  stripe: {
    name: "stripe",
    displayName: "Stripe",
    minAmount: 5,
    maxAmount: 999999.99,
    fee: 0.035, // 3.5%
    fixedFee: 0.3,
    currency: "USD",
    isEnabled: false,
    isTestMode: true,
  },
  bank_transfer: {
    name: "bank_transfer",
    displayName: "Bank Transfer",
    minAmount: 5000,
    maxAmount: 5000000,
    fee: 0.02, // 2%
    currency: "FCFA",
    isEnabled: false,
    isTestMode: true,
  },
};

// Initialize and return configured providers
export function initializePaymentProviders(
  registry: PaymentProviderRegistry,
  customConfigs?: Partial<Record<PaymentProviderType, ProviderConfig>>,
): void {
  const configs: typeof DEFAULT_PROVIDER_CONFIGS = {
    ...DEFAULT_PROVIDER_CONFIGS,
    ...customConfigs,
  };

  for (const [, config] of Object.entries(configs)) {
    const provider = PaymentProviderFactory.createProvider(config);
    registry.register(provider);
  }
}
