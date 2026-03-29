// Payment transaction logging and status tracking
import { createAdminSupabaseClient } from "./admin";

export interface PaymentTransaction {
  id: string;
  withdrawal_id: string;
  creator_id: string;
  provider_name: string;
  provider_transaction_id?: string;
  destination: string;
  amount: number;
  fee: number;
  total: number;
  status: "pending" | "processing" | "completed" | "failed" | "refunded";
  error_message?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export class PaymentTransactionService {
  private supabase = createAdminSupabaseClient();

  async logTransaction(
    transaction: Omit<PaymentTransaction, "id" | "created_at" | "updated_at">,
  ): Promise<PaymentTransaction> {
    const { data, error } = await this.supabase
      .from("payment_transactions")
      .insert([transaction])
      .select()
      .single();

    if (error) throw new Error(`Failed to log transaction: ${error.message}`);
    return data;
  }

  async updateTransactionStatus(
    transactionId: string,
    status: PaymentTransaction["status"],
    metadata?: Record<string, unknown>,
    errorMessage?: string,
  ): Promise<PaymentTransaction> {
    const updates: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === "completed") {
      updates.completed_at = new Date().toISOString();
    }

    if (metadata) {
      updates.metadata = metadata;
    }

    if (errorMessage) {
      updates.error_message = errorMessage;
    }

    const { data, error } = await this.supabase
      .from("payment_transactions")
      .update(updates)
      .eq("id", transactionId)
      .select()
      .single();

    if (error)
      throw new Error(`Failed to update transaction: ${error.message}`);
    return data;
  }

  async getTransactionByProviderId(
    providerTransactionId: string,
  ): Promise<PaymentTransaction | null> {
    const { data, error } = await this.supabase
      .from("payment_transactions")
      .select()
      .eq("provider_transaction_id", providerTransactionId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(`Failed to fetch transaction: ${error.message}`);
    }

    return data || null;
  }

  async getWithdrawalTransactions(
    withdrawalId: string,
  ): Promise<PaymentTransaction[]> {
    const { data, error } = await this.supabase
      .from("payment_transactions")
      .select()
      .eq("withdrawal_id", withdrawalId)
      .order("created_at", { ascending: false });

    if (error)
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    return data || [];
  }

  async getCreatorTransactions(
    creatorId: string,
    limit = 50,
    offset = 0,
  ): Promise<{
    transactions: PaymentTransaction[];
    total: number;
  }> {
    const { data, error, count } = await this.supabase
      .from("payment_transactions")
      .select("*", { count: "exact" })
      .eq("creator_id", creatorId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error)
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    return { transactions: data || [], total: count || 0 };
  }

  async getTransactionStats(creatorId?: string): Promise<{
    totalAmount: number;
    totalFees: number;
    completedCount: number;
    failedCount: number;
    pendingCount: number;
  }> {
    let query = this.supabase
      .from("payment_transactions")
      .select("amount, fee, status");

    if (creatorId) {
      query = query.eq("creator_id", creatorId);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Failed to fetch stats: ${error.message}`);

    const stats = {
      totalAmount: 0,
      totalFees: 0,
      completedCount: 0,
      failedCount: 0,
      pendingCount: 0,
    };

    (data || []).forEach((tx) => {
      stats.totalAmount += tx.amount || 0;
      stats.totalFees += tx.fee || 0;
      if (tx.status === "completed") stats.completedCount += 1;
      if (tx.status === "failed") stats.failedCount += 1;
      if (tx.status === "pending") stats.pendingCount += 1;
    });

    return stats;
  }
}

export const paymentTransactionService = new PaymentTransactionService();
