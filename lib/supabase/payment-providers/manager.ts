// Payment manager - coordinates payment processing
import { createClient } from "@supabase/supabase-js";
import {
  PaymentProvider,
  PaymentProviderRegistry,
  PaymentProviderType,
  PaymentRequest,
  PaymentResponse,
  PaymentDestination,
} from "./base";
import { initializePaymentProviders } from "./factory";

interface PaymentTransaction {
  id: string;
  providerId: string;
  transactionId: string;
  creatorId: string;
  withdrawalId: string;
  amount: number;
  fee: number;
  total: number;
  status: "pending" | "processing" | "completed" | "failed";
  destination: PaymentDestination;
  timestamp: string;
  completedAt?: string;
  errorMessage?: string;
}

export class PaymentManager {
  private registry: PaymentProviderRegistry;
  private supabase: any;
  private initialized = false;

  constructor(supabase: any, registry?: PaymentProviderRegistry) {
    this.supabase = supabase;
    this.registry = registry || new PaymentProviderRegistry();
  }

  async initialize(customConfigs?: any): Promise<void> {
    if (this.initialized) return;

    // Initialize providers
    initializePaymentProviders(this.registry, customConfigs);
    this.initialized = true;
  }

  async processPayment(
    provider: PaymentProviderType,
    withdrawalId: string,
    creatorId: string,
    amount: number,
    destination: PaymentDestination,
  ): Promise<PaymentResponse> {
    // Verify manager is initialized
    if (!this.initialized) {
      await this.initialize();
    }

    // Get provider
    const paymentProvider = this.registry.getProvider(provider);
    if (!paymentProvider) {
      return {
        success: false,
        transactionId: "",
        status: "failed",
        amount,
        fee: 0,
        total: 0,
        timestamp: new Date().toISOString(),
        message: `Provider ${provider} not available`,
      };
    }

    if (!paymentProvider.isEnabled()) {
      return {
        success: false,
        transactionId: "",
        status: "failed",
        amount,
        fee: 0,
        total: 0,
        timestamp: new Date().toISOString(),
        message: `Provider ${provider} is disabled`,
      };
    }

    try {
      // Create payment request
      const request: PaymentRequest = {
        amount,
        currency: "FCFA",
        destination,
        reference: `withdrawal-${withdrawalId}`,
        description: `Withdrawal from Milava - ID: ${withdrawalId}`,
      };

      // Process payment
      const response = await paymentProvider.processPayment(request);

      // Log transaction
      await this.logTransaction({
        providerId: provider,
        withdrawalId,
        creatorId,
        response,
      });

      // Update withdrawal status
      if (response.success) {
        await this.updateWithdrawalStatus(
          withdrawalId,
          "processing",
          response.transactionId,
        );
      } else {
        await this.updateWithdrawalStatus(
          withdrawalId,
          "failed",
          "",
          response.message,
        );
      }

      return response;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Payment processing error";
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

  async getPaymentStatus(
    provider: PaymentProviderType,
    transactionId: string,
  ): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    const paymentProvider = this.registry.getProvider(provider);
    if (!paymentProvider) {
      return "unknown";
    }

    try {
      return await paymentProvider.getStatus(transactionId);
    } catch {
      return "unknown";
    }
  }

  async refundPayment(
    provider: PaymentProviderType,
    transactionId: string,
    amount: number,
  ): Promise<PaymentResponse> {
    if (!this.initialized) {
      await this.initialize();
    }

    const paymentProvider = this.registry.getProvider(provider);
    if (!paymentProvider) {
      return {
        success: false,
        transactionId: "",
        status: "failed",
        amount,
        fee: 0,
        total: 0,
        timestamp: new Date().toISOString(),
        message: "Provider not available",
      };
    }

    try {
      return await paymentProvider.refund(transactionId, amount);
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

  private async logTransaction(data: {
    providerId: string;
    withdrawalId: string;
    creatorId: string;
    response: PaymentResponse;
  }): Promise<void> {
    try {
      await this.supabase.from("payment_transactions").insert({
        provider_id: data.providerId,
        withdrawal_id: data.withdrawalId,
        creator_id: data.creatorId,
        transaction_id: data.response.transactionId,
        amount: data.response.amount,
        fee: data.response.fee,
        total: data.response.total,
        status: data.response.status,
        error_message: data.response.message,
        created_at: data.response.timestamp,
      });
    } catch (error) {
      console.error("Failed to log payment transaction:", error);
    }
  }

  private async updateWithdrawalStatus(
    withdrawalId: string,
    status: string,
    transactionId: string = "",
    errorMessage: string = "",
  ): Promise<void> {
    try {
      const updates: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (transactionId) {
        updates.payout_reference = transactionId;
      }

      if (errorMessage) {
        updates.error_message = errorMessage;
      }

      if (status === "completed") {
        updates.processed_at = new Date().toISOString();
      }

      await this.supabase
        .from("withdrawal_requests")
        .update(updates)
        .eq("id", withdrawalId);
    } catch (error) {
      console.error("Failed to update withdrawal status:", error);
    }
  }

  getEnabledProviders() {
    if (!this.initialized) {
      return [];
    }
    return this.registry.getEnabledProviders();
  }

  getAllProviders() {
    if (!this.initialized) {
      return [];
    }
    return this.registry.getAllProviders();
  }
}

// Singleton instance
let paymentManager: PaymentManager | null = null;

export function getPaymentManager(supabase?: any): PaymentManager {
  if (!paymentManager && supabase) {
    paymentManager = new PaymentManager(supabase);
  }
  return paymentManager!;
}

export function setPaymentManager(manager: PaymentManager): void {
  paymentManager = manager;
}
