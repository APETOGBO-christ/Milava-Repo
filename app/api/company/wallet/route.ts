import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const PAYMENT_PROVIDERS = [
  "wave",
  "orange_money",
  "mtn_momo",
  "card",
  "bank_transfer",
] as const;

type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

function isPaymentProvider(value: unknown): value is PaymentProvider {
  return (
    typeof value === "string" &&
    PAYMENT_PROVIDERS.includes(value as PaymentProvider)
  );
}

async function getAuthenticatedUserId(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";

  if (token) {
    const admin = createAdminSupabaseClient();
    const {
      data: { user },
      error,
    } = await admin.auth.getUser(token);

    if (!error && user?.id) {
      return user.id;
    }
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server component context can throw while setting cookies.
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id || null;
}

async function getFundingSummary(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  companyId: string,
) {
  const [transactionsResult, campaignsResult] = await Promise.all([
    admin
      .from("company_payment_transactions")
      .select(
        "id, provider, direction, amount, status, requested_at, processed_at, external_reference",
      )
      .eq("company_id", companyId)
      .order("requested_at", { ascending: false })
      .limit(20),
    admin
      .from("campaigns")
      .select("id, title, status, gross_deposit_amount, created_at")
      .eq("company_id", companyId)
      .neq("status", "cancelled")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (transactionsResult.error) {
    throw new Error(
      `Failed to load company transactions: ${transactionsResult.error.message}`,
    );
  }

  if (campaignsResult.error) {
    throw new Error(
      `Failed to load campaign commitments: ${campaignsResult.error.message}`,
    );
  }

  const transactions = transactionsResult.data || [];
  const commitments = campaignsResult.data || [];

  const totalDeposits = transactions
    .filter((row) => row.status === "completed" && row.direction === "deposit")
    .reduce((sum, row) => sum + Number(row.amount || 0), 0);

  const totalRefunds = transactions
    .filter((row) => row.status === "completed" && row.direction === "refund")
    .reduce((sum, row) => sum + Number(row.amount || 0), 0);

  const totalCommitted = commitments.reduce(
    (sum, row) => sum + Number(row.gross_deposit_amount || 0),
    0,
  );

  const availableBalance = Math.max(
    totalDeposits + totalRefunds - totalCommitted,
    0,
  );

  return {
    availableBalance: Number(availableBalance.toFixed(2)),
    totalDeposits: Number(totalDeposits.toFixed(2)),
    totalRefunds: Number(totalRefunds.toFixed(2)),
    totalCommitted: Number(totalCommitted.toFixed(2)),
    transactions,
    commitments,
  };
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminSupabaseClient();

    const { data: profileRow, error: profileError } = await admin
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: `Impossible de verifier le profil: ${profileError.message}` },
        { status: 400 },
      );
    }

    if (profileRow?.role !== "company") {
      return NextResponse.json(
        { error: "Seules les marques peuvent consulter ce portefeuille." },
        { status: 403 },
      );
    }

    const summary = await getFundingSummary(admin, userId);

    return NextResponse.json({ success: true, summary });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur interne lors du chargement du portefeuille.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const amount = Number(body?.amount || 0);
    const provider = body?.provider;

    if (!isPaymentProvider(provider)) {
      return NextResponse.json(
        { error: "Moyen de paiement invalide." },
        { status: 400 },
      );
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Montant invalide." }, { status: 400 });
    }

    const admin = createAdminSupabaseClient();

    const { data: profileRow, error: profileError } = await admin
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: `Impossible de verifier le profil: ${profileError.message}` },
        { status: 400 },
      );
    }

    if (profileRow?.role !== "company") {
      return NextResponse.json(
        { error: "Seules les marques peuvent recharger ce portefeuille." },
        { status: 403 },
      );
    }

    const { error: insertError } = await admin
      .from("company_payment_transactions")
      .insert({
        company_id: userId,
        provider,
        direction: "deposit",
        amount,
        status: "completed",
        external_reference: `manual-${Date.now()}`,
        requested_at: new Date().toISOString(),
        processed_at: new Date().toISOString(),
      });

    if (insertError) {
      return NextResponse.json(
        { error: `Recharge impossible: ${insertError.message}` },
        { status: 400 },
      );
    }

    const summary = await getFundingSummary(admin, userId);

    return NextResponse.json({ success: true, summary });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur interne lors de la recharge.",
      },
      { status: 500 },
    );
  }
}
