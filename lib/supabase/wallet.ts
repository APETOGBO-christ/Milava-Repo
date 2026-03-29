import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export type TransactionType =
  | "earning_pending"
  | "earning_released"
  | "withdrawal_requested"
  | "withdrawal_completed"
  | "withdrawal_failed"
  | "campaign_refund";

export type WithdrawalStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export type PaymentProvider =
  | "wave"
  | "orange_money"
  | "mtn_momo"
  | "bank_transfer"
  | "card";

export interface WalletAccount {
  creator_id: string;
  available_balance: number;
  pending_balance: number;
  currency: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  creator_id: string;
  assignment_id?: string;
  post_id?: string;
  withdrawal_request_id?: string;
  kind: TransactionType;
  amount: number;
  description: string;
  created_at: string;
}

export interface WithdrawalRequest {
  id: string;
  creator_id: string;
  provider: PaymentProvider;
  amount: number;
  status: WithdrawalStatus;
  payout_reference?: string;
  destination_label: string;
  requested_at: string;
  processed_at?: string;
}

export class WalletService {
  private supabase = createBrowserSupabaseClient();

  async getWallet(creatorId: string): Promise<WalletAccount | null> {
    const { data, error } = await this.supabase
      .from("wallet_accounts")
      .select("*")
      .eq("creator_id", creatorId)
      .single();

    if (error && error.code === "PGRST116") {
      // Wallet doesn't exist yet, create one
      return await this.initializeWallet(creatorId);
    }
    if (error) throw error;
    return data as WalletAccount;
  }

  private async initializeWallet(creatorId: string): Promise<WalletAccount> {
    const { data, error } = await this.supabase
      .from("wallet_accounts")
      .insert({
        creator_id: creatorId,
        available_balance: 0,
        pending_balance: 0,
        currency: "FCFA",
      })
      .select()
      .single();

    if (error) throw error;
    return data as WalletAccount;
  }

  async getBalance(creatorId: string): Promise<{
    available: number;
    pending: number;
    total: number;
  }> {
    const wallet = await this.getWallet(creatorId);
    return {
      available: wallet?.available_balance || 0,
      pending: wallet?.pending_balance || 0,
      total: (wallet?.available_balance || 0) + (wallet?.pending_balance || 0),
    };
  }

  async getTransactionHistory(
    creatorId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<WalletTransaction[]> {
    const { data, error } = await this.supabase
      .from("wallet_transactions")
      .select("*")
      .eq("creator_id", creatorId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return (data || []) as WalletTransaction[];
  }

  async addTransaction(
    creatorId: string,
    kind: TransactionType,
    amount: number,
    description: string,
    postId?: string,
    withdrawalId?: string,
  ): Promise<WalletTransaction> {
    const { data, error } = await this.supabase
      .from("wallet_transactions")
      .insert({
        creator_id: creatorId,
        kind,
        amount,
        description,
        post_id: postId,
        withdrawal_request_id: withdrawalId,
      })
      .select()
      .single();

    if (error) throw error;
    return data as WalletTransaction;
  }

  async addEarning(
    creatorId: string,
    postId: string,
    gainAmount: number,
  ): Promise<void> {
    // Add to pending balance
    const wallet = await this.getWallet(creatorId);
    if (!wallet) return;

    await this.supabase
      .from("wallet_accounts")
      .update({
        pending_balance: wallet.pending_balance + gainAmount,
        updated_at: new Date().toISOString(),
      })
      .eq("creator_id", creatorId);

    // Record transaction
    await this.addTransaction(
      creatorId,
      "earning_pending",
      gainAmount,
      `Gain de post: ${postId.substring(0, 8)}...`,
      postId,
    );
  }

  async releasePendingBalance(
    creatorId: string,
    amount: number,
  ): Promise<void> {
    const wallet = await this.getWallet(creatorId);
    if (!wallet) return;

    if (wallet.pending_balance < amount) {
      throw new Error("Insufficient pending balance");
    }

    await this.supabase
      .from("wallet_accounts")
      .update({
        available_balance: wallet.available_balance + amount,
        pending_balance: wallet.pending_balance - amount,
        updated_at: new Date().toISOString(),
      })
      .eq("creator_id", creatorId);

    // Record transaction
    await this.addTransaction(
      creatorId,
      "earning_released",
      amount,
      "Libération des gains en attente",
    );
  }

  async requestWithdrawal(
    creatorId: string,
    provider: PaymentProvider,
    amount: number,
    destination: string,
  ): Promise<WithdrawalRequest> {
    // Validate available balance
    const wallet = await this.getWallet(creatorId);
    if (!wallet || wallet.available_balance < amount) {
      throw new Error("Solde insuffisant pour ce retrait");
    }

    // Create withdrawal request
    const { data, error } = await this.supabase
      .from("withdrawal_requests")
      .insert({
        creator_id: creatorId,
        provider,
        amount,
        destination_label: destination,
        status: "pending",
        requested_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    const withdrawalRequest = data as WithdrawalRequest;

    // Record transaction
    await this.addTransaction(
      creatorId,
      "withdrawal_requested",
      -amount,
      `Demande de retrait via ${provider}: ${amount} FCFA`,
      undefined,
      withdrawalRequest.id,
    );

    return withdrawalRequest;
  }

  async getWithdrawalRequests(
    creatorId: string,
    status?: WithdrawalStatus,
  ): Promise<WithdrawalRequest[]> {
    let query = this.supabase
      .from("withdrawal_requests")
      .select("*")
      .eq("creator_id", creatorId);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query.order("requested_at", {
      ascending: false,
    });

    if (error) throw error;
    return (data || []) as WithdrawalRequest[];
  }

  async getWithdrawalRequest(id: string): Promise<WithdrawalRequest | null> {
    const { data, error } = await this.supabase
      .from("withdrawal_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (error && error.code === "PGRST116") return null;
    if (error) throw error;
    return data as WithdrawalRequest;
  }

  async updateWithdrawalStatus(
    withdrawalId: string,
    status: WithdrawalStatus,
    payoutReference?: string,
  ): Promise<WithdrawalRequest> {
    const { data, error } = await this.supabase
      .from("withdrawal_requests")
      .update({
        status,
        payout_reference: payoutReference,
        processed_at:
          status === "completed" || status === "failed"
            ? new Date().toISOString()
            : null,
      })
      .eq("id", withdrawalId)
      .select()
      .single();

    if (error) throw error;
    return data as WithdrawalRequest;
  }

  async confirmWithdrawalCompletion(
    withdrawalId: string,
    payoutReference: string,
  ): Promise<void> {
    const withdrawal = await this.getWithdrawalRequest(withdrawalId);
    if (!withdrawal) throw new Error("Withdrawal not found");

    // Update withdrawal request
    await this.updateWithdrawalStatus(
      withdrawalId,
      "completed",
      payoutReference,
    );

    // Deduct from available balance
    const wallet = await this.getWallet(withdrawal.creator_id);
    if (wallet) {
      await this.supabase
        .from("wallet_accounts")
        .update({
          available_balance: Math.max(
            0,
            wallet.available_balance - withdrawal.amount,
          ),
          updated_at: new Date().toISOString(),
        })
        .eq("creator_id", withdrawal.creator_id);
    }

    // Record transaction
    await this.addTransaction(
      withdrawal.creator_id,
      "withdrawal_completed",
      -withdrawal.amount,
      `Retrait complété via ${withdrawal.provider}: ${withdrawal.amount} FCFA`,
      undefined,
      withdrawalId,
    );
  }

  async cancelWithdrawal(withdrawalId: string, reason: string): Promise<void> {
    const withdrawal = await this.getWithdrawalRequest(withdrawalId);
    if (!withdrawal) throw new Error("Withdrawal not found");

    // Update status
    await this.updateWithdrawalStatus(withdrawalId, "cancelled");

    // Reverse the transaction (add back to available balance if it was deducted)
    const wallet = await this.getWallet(withdrawal.creator_id);
    if (wallet) {
      await this.supabase
        .from("wallet_accounts")
        .update({
          available_balance: wallet.available_balance + withdrawal.amount,
          updated_at: new Date().toISOString(),
        })
        .eq("creator_id", withdrawal.creator_id);
    }

    // Record cancellation
    await this.addTransaction(
      withdrawal.creator_id,
      "withdrawal_failed",
      withdrawal.amount,
      `Retrait annulé: ${reason}`,
    );
  }

  async getWalletStats(creatorId: string): Promise<{
    totalEarned: number;
    totalWithdrawn: number;
    pendingWithdrawal: number;
  }> {
    const [earnedData, withdrawnData, pendingData] = await Promise.all([
      this.supabase
        .from("wallet_transactions")
        .select("amount")
        .eq("creator_id", creatorId)
        .eq("kind", "earning_released"),

      this.supabase
        .from("wallet_transactions")
        .select("amount")
        .eq("creator_id", creatorId)
        .eq("kind", "withdrawal_completed"),

      this.supabase
        .from("withdrawal_requests")
        .select("amount")
        .eq("creator_id", creatorId)
        .eq("status", "processing"),
    ]);

    const totalEarned = (earnedData.data || []).reduce(
      (sum: number, t: any) => sum + (t.amount || 0),
      0,
    );
    const totalWithdrawn = Math.abs(
      (withdrawnData.data || []).reduce(
        (sum: number, t: any) => sum + (t.amount || 0),
        0,
      ),
    );
    const pendingWithdrawal = (pendingData.data || []).reduce(
      (sum: number, r: any) => sum + (r.amount || 0),
      0,
    );

    return {
      totalEarned,
      totalWithdrawn,
      pendingWithdrawal,
    };
  }
}
