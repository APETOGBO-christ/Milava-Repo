// Payment providers module exports
export {
  PaymentProvider,
  PaymentProviderRegistry,
  paymentRegistry,
} from "./base";
export type {
  PaymentProviderType,
  PaymentDestination,
  PaymentRequest,
  PaymentResponse,
  ProviderConfig,
} from "./base";

export { WaveProvider } from "./wave";
export { OrangeMoneyProvider } from "./orange-money";
export { MTNProvider } from "./mtn";
export { StripeProvider } from "./stripe";
export { BankTransferProvider } from "./bank-transfer";
export {
  PaymentProviderFactory,
  DEFAULT_PROVIDER_CONFIGS,
  initializePaymentProviders,
} from "./factory";
export {
  PaymentManager,
  getPaymentManager,
  setPaymentManager,
} from "./manager";
