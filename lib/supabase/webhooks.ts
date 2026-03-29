// Webhook event processing system for payment provider callbacks
import { createAdminSupabaseClient } from "./admin";
import { paymentTransactionService } from "./payment-transactions";
import { PaymentProviderType } from "../supabase/payment-providers/base";

export interface WebhookPayload {
  provider: PaymentProviderType;
  eventType: string;
  transactionId?: string;
  payload: Record<string, unknown>;
}

export interface WebhookEvent {
  id: string;
  provider_name: string;
  event_type: string;
  transaction_id?: string;
  payload: Record<string, unknown>;
  status: "pending" | "processed" | "failed";
  error_message?: string;
  retry_count: number;
  last_retry_at?: string;
  created_at: string;
  processed_at?: string;
}

const WEBHOOK_MAX_RETRIES = 3;
const WEBHOOK_RETRY_DELAY = 5000; // 5 seconds

export class WebhookService {
  private supabase = createAdminSupabaseClient();

  async logWebhookEvent(payload: WebhookPayload): Promise<WebhookEvent> {
    const { data, error } = await this.supabase
      .from("webhook_events")
      .insert([
        {
          provider_name: payload.provider,
          event_type: payload.eventType,
          transaction_id: payload.transactionId,
          payload: payload.payload,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (error) throw new Error(`Failed to log webhook event: ${error.message}`);
    return data;
  }

  async processWebhookEvent(eventId: string): Promise<void> {
    // Fetch event
    const { data: event, error: fetchError } = await this.supabase
      .from("webhook_events")
      .select()
      .eq("id", eventId)
      .single();

    if (fetchError)
      throw new Error(`Failed to fetch webhook event: ${fetchError.message}`);

    if (!event) throw new Error("Webhook event not found");

    try {
      // Process based on event type
      await this.handleEvent(event);

      // Mark as processed
      await this.markAsProcessed(eventId);
    } catch (error) {
      await this.handleRetry(eventId, error);
    }
  }

  private async handleEvent(event: WebhookEvent): Promise<void> {
    const { event_type, transaction_id, payload } = event;

    switch (event_type) {
      case "payment.completed":
        await this.handlePaymentCompleted(transaction_id, payload);
        break;
      case "payment.failed":
        await this.handlePaymentFailed(transaction_id, payload);
        break;
      case "payment.refunded":
        await this.handlePaymentRefunded(transaction_id, payload);
        break;
      case "payment.pending":
        await this.handlePaymentPending(transaction_id, payload);
        break;
      default:
        throw new Error(`Unknown event type: ${event_type}`);
    }
  }

  private async handlePaymentCompleted(
    transactionId: string | undefined,
    payload: Record<string, unknown>,
  ): Promise<void> {
    if (!transactionId)
      throw new Error("Transaction ID required for payment.completed");

    const transaction =
      await paymentTransactionService.getTransactionByProviderId(transactionId);
    if (!transaction)
      throw new Error(`Transaction not found: ${transactionId}`);

    await paymentTransactionService.updateTransactionStatus(
      transaction.id,
      "completed",
      payload,
    );

    // Update withdrawal request status
    const { error } = await this.supabase
      .from("withdrawal_requests")
      .update({
        status: "completed",
        transaction_id: transaction.id,
      })
      .eq("id", transaction.withdrawal_id);

    if (error) throw new Error(`Failed to update withdrawal: ${error.message}`);
  }

  private async handlePaymentFailed(
    transactionId: string | undefined,
    payload: Record<string, unknown>,
  ): Promise<void> {
    if (!transactionId)
      throw new Error("Transaction ID required for payment.failed");

    const transaction =
      await paymentTransactionService.getTransactionByProviderId(transactionId);
    if (!transaction)
      throw new Error(`Transaction not found: ${transactionId}`);

    const errorMessage =
      (payload as any)?.error_message || "Payment processing failed";

    await paymentTransactionService.updateTransactionStatus(
      transaction.id,
      "failed",
      payload,
      errorMessage,
    );

    // Update withdrawal request status
    const { error } = await this.supabase
      .from("withdrawal_requests")
      .update({
        status: "failed",
        notes: errorMessage,
      })
      .eq("id", transaction.withdrawal_id);

    if (error) throw new Error(`Failed to update withdrawal: ${error.message}`);
  }

  private async handlePaymentRefunded(
    transactionId: string | undefined,
    payload: Record<string, unknown>,
  ): Promise<void> {
    if (!transactionId)
      throw new Error("Transaction ID required for payment.refunded");

    const transaction =
      await paymentTransactionService.getTransactionByProviderId(transactionId);
    if (!transaction)
      throw new Error(`Transaction not found: ${transactionId}`);

    await paymentTransactionService.updateTransactionStatus(
      transaction.id,
      "refunded",
      payload,
    );

    // Update withdrawal request - send money back to wallet
    const { error: updateError } = await this.supabase
      .from("withdrawal_requests")
      .update({
        status: "refunded",
        notes: "Payment was refunded",
      })
      .eq("id", transaction.withdrawal_id);

    if (updateError)
      throw new Error(`Failed to update withdrawal: ${updateError.message}`);

    // Add refund back to creator's wallet
    const { error: walletError } = await this.supabase
      .from("wallets")
      .update({
        balance:
          (
            await this.supabase
              .from("wallets")
              .select("balance")
              .eq("creator_id", transaction.creator_id)
              .single()
          ).data?.balance + transaction.amount,
      })
      .eq("creator_id", transaction.creator_id);

    if (walletError)
      throw new Error(`Failed to update wallet: ${walletError.message}`);
  }

  private async handlePaymentPending(
    transactionId: string | undefined,
    payload: Record<string, unknown>,
  ): Promise<void> {
    if (!transactionId)
      throw new Error("Transaction ID required for payment.pending");

    const transaction =
      await paymentTransactionService.getTransactionByProviderId(transactionId);
    if (!transaction)
      throw new Error(`Transaction not found: ${transactionId}`);

    await paymentTransactionService.updateTransactionStatus(
      transaction.id,
      "processing",
      payload,
    );

    // Update withdrawal request status
    const { error } = await this.supabase
      .from("withdrawal_requests")
      .update({
        status: "processing",
      })
      .eq("id", transaction.withdrawal_id);

    if (error) throw new Error(`Failed to update withdrawal: ${error.message}`);
  }

  private async markAsProcessed(eventId: string): Promise<void> {
    const { error } = await this.supabase
      .from("webhook_events")
      .update({
        status: "processed",
        processed_at: new Date().toISOString(),
      })
      .eq("id", eventId);

    if (error)
      throw new Error(`Failed to mark event as processed: ${error.message}`);
  }

  private async handleRetry(eventId: string, error: unknown): Promise<void> {
    const { data: event } = await this.supabase
      .from("webhook_events")
      .select()
      .eq("id", eventId)
      .single();

    const retryCount = (event?.retry_count || 0) + 1;
    const shouldRetry = retryCount < WEBHOOK_MAX_RETRIES;

    await this.supabase
      .from("webhook_events")
      .update({
        status: shouldRetry ? "pending" : "failed",
        error_message: error instanceof Error ? error.message : String(error),
        retry_count: retryCount,
        last_retry_at: new Date().toISOString(),
      })
      .eq("id", eventId);

    if (shouldRetry) {
      // Schedule retry after delay
      setTimeout(
        () => this.processWebhookEvent(eventId),
        WEBHOOK_RETRY_DELAY * retryCount,
      );
    }
  }

  async getPendingWebhooks(): Promise<WebhookEvent[]> {
    const { data, error } = await this.supabase
      .from("webhook_events")
      .select()
      .eq("status", "pending")
      .lt("retry_count", WEBHOOK_MAX_RETRIES)
      .order("created_at", { ascending: true });

    if (error)
      throw new Error(`Failed to fetch pending webhooks: ${error.message}`);
    return data || [];
  }
}

export const webhookService = new WebhookService();
