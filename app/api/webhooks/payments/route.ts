// Webhook handler API route for payment provider callbacks
import { NextRequest, NextResponse } from "next/server";
import { webhookService } from "@/lib/supabase/webhooks";
import { PaymentProviderType } from "@/lib/supabase/payment-providers/base";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, eventType, transactionId, payload } = body;

    // Validate required fields
    if (!provider || !eventType) {
      return NextResponse.json(
        { error: "Missing required fields: provider, eventType" },
        { status: 400 },
      );
    }

    // Log webhook event
    const webhookEvent = await webhookService.logWebhookEvent({
      provider: provider as PaymentProviderType,
      eventType,
      transactionId,
      payload: payload || {},
    });

    // Process webhook asynchronously
    webhookService.processWebhookEvent(webhookEvent.id).catch((error) => {
      console.error("Webhook processing error:", error);
    });

    return NextResponse.json({
      success: true,
      eventId: webhookEvent.id,
      message: "Webhook received and queued for processing",
    });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

// GET endpoint to check webhook status (optional)
export async function GET(request: NextRequest) {
  try {
    const eventId = request.nextUrl.searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json(
        { error: "Missing eventId parameter" },
        { status: 400 },
      );
    }

    // Return webhook event status - this is a simple check
    // In production, you'd want to fetch from database
    return NextResponse.json({
      eventId,
      message: "Webhook processing is async, check database for status",
    });
  } catch (error) {
    console.error("Webhook status check error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
