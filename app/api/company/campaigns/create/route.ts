import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

type DbRewardModel = "CPM" | "CPC" | "CPL" | "CPA" | "Flat Rate";
type DbObjective = "awareness" | "traffic" | "leads" | "sales";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function addDaysIso(baseDate: Date, days: number) {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function normalizeRewardModel(value: unknown): DbRewardModel | null {
  if (typeof value !== "string") return null;

  const normalized = value.trim().toLowerCase().replace(/\s+/g, "_");

  if (normalized === "cpm") return "CPM";
  if (normalized === "cpc") return "CPC";
  if (normalized === "cpl") return "CPL";
  if (normalized === "cpa") return "CPA";
  if (normalized === "flat_rate") return "Flat Rate";

  return null;
}

function deriveObjectiveFromRewardModel(model: DbRewardModel): DbObjective {
  if (model === "CPC") return "traffic";
  if (model === "CPL") return "leads";
  if (model === "CPA") return "sales";
  return "awareness";
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
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

async function getCompanyFunding(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  companyId: string,
) {
  const [creditsResult, campaignsResult] = await Promise.all([
    admin
      .from("company_payment_transactions")
      .select("amount, direction, status")
      .eq("company_id", companyId)
      .eq("status", "completed")
      .in("direction", ["deposit", "refund"]),
    admin
      .from("campaigns")
      .select("gross_deposit_amount, status")
      .eq("company_id", companyId)
      .neq("status", "cancelled"),
  ]);

  if (creditsResult.error) {
    throw new Error(
      `Failed to load company deposits: ${creditsResult.error.message}`,
    );
  }

  if (campaignsResult.error) {
    throw new Error(
      `Failed to load campaign commitments: ${campaignsResult.error.message}`,
    );
  }

  const totalCredits = (creditsResult.data || []).reduce(
    (sum, row) => sum + Number(row.amount || 0),
    0,
  );

  const totalCommitted = (campaignsResult.data || []).reduce(
    (sum, row) => sum + Number(row.gross_deposit_amount || 0),
    0,
  );

  const available = Math.max(totalCredits - totalCommitted, 0);

  return {
    totalCredits,
    totalCommitted,
    available,
  };
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const title = String(body?.title || "").trim();
    const description = String(body?.description || "").trim();
    const objectives = String(body?.objectives || "").trim();
    const category = String(body?.category || "").trim();
    const contentType = String(body?.contentType || "").trim();
    const budgetType = body?.budgetType === "monthly" ? "monthly" : "one_time";

    const budgetTotal = Number(body?.budget_total || 0);
    const rewardValue = Number(body?.reward_value || 0);
    const minFollowers = Math.max(0, Number(body?.minFollowers || 0));
    const maxPayoutPerContent = Math.max(
      0,
      Number(body?.maxPayoutPerContent || 0),
    );
    const flatFeeBonus = Math.max(0, Number(body?.flatFeeBonus || 0));
    const platformFeeRate = clamp(Number(body?.platform_fee_rate || 0), 0, 1);

    const rewardModel = normalizeRewardModel(body?.reward_model);

    if (!title) {
      return NextResponse.json(
        { error: "Le nom de la campagne est requis." },
        { status: 400 },
      );
    }

    if (!description) {
      return NextResponse.json(
        { error: "La description est requise." },
        { status: 400 },
      );
    }

    if (!rewardModel) {
      return NextResponse.json(
        { error: "Mode de remuneration invalide." },
        { status: 400 },
      );
    }

    if (!Number.isFinite(budgetTotal) || budgetTotal < 50) {
      return NextResponse.json(
        { error: "Le budget minimum est de $50." },
        { status: 400 },
      );
    }

    if (!Number.isFinite(rewardValue) || rewardValue <= 0) {
      return NextResponse.json(
        { error: "La remuneration doit etre superieure a 0." },
        { status: 400 },
      );
    }

    const requiredNetworks = normalizeStringArray(body?.requiredNetworks);
    if (requiredNetworks.length === 0) {
      return NextResponse.json(
        { error: "Selectionnez au moins un reseau social." },
        { status: 400 },
      );
    }

    const countries = normalizeStringArray(body?.countries);
    const languages = normalizeStringArray(body?.languages);

    const commission = budgetTotal * platformFeeRate;
    const budgetUsable = Math.max(budgetTotal - commission, 0);

    if (budgetUsable <= 0) {
      return NextResponse.json(
        { error: "Le budget createurs calcule est invalide." },
        { status: 400 },
      );
    }

    const now = new Date();
    const startDate = now.toISOString().slice(0, 10);
    const endDate = addDaysIso(now, budgetType === "monthly" ? 30 : 14);

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
        { error: "Seules les marques peuvent creer des campagnes." },
        { status: 403 },
      );
    }

    const funding = await getCompanyFunding(admin, userId);

    if (funding.available < budgetTotal) {
      return NextResponse.json(
        {
          error: "Fonds insuffisants pour lancer cette campagne.",
          code: "INSUFFICIENT_FUNDS",
          requiredGross: Number(budgetTotal.toFixed(2)),
          availableBalance: Number(funding.available.toFixed(2)),
          missingAmount: Number((budgetTotal - funding.available).toFixed(2)),
        },
        { status: 402 },
      );
    }

    const objective = deriveObjectiveFromRewardModel(rewardModel);

    const { data: campaign, error: insertError } = await admin
      .from("campaigns")
      .insert({
        company_id: userId,
        title,
        objective,
        description,
        creative_brief: description,
        start_date: startDate,
        end_date: endDate,
        reward_model: rewardModel,
        reward_rate: rewardValue,
        budget_amount: budgetUsable,
        platform_fee_rate: platformFeeRate,
        platform_fee_amount: commission,
        gross_deposit_amount: budgetTotal,
        remaining_amount: budgetUsable,
        status: "draft",
        objectives,
        budget_total: budgetTotal,
        budget_usable: budgetUsable,
        reward_value: rewardValue,
        category: category || null,
        content_type: contentType || null,
        required_networks: requiredNetworks,
        countries,
        languages,
        min_followers: minFollowers,
        max_payout_per_content: maxPayoutPerContent,
        participant_count: 0,
        updated_at: new Date().toISOString(),
      })
      .select(
        "id, title, status, budget_total, budget_usable, reward_model, reward_value, created_at",
      )
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: `Creation impossible: ${insertError.message}` },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      campaign,
      funding: {
        availableAfterCreation: Number(
          (funding.available - budgetTotal).toFixed(2),
        ),
      },
      metadata: {
        maxPayoutPerContent,
        flatFeeBonus,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur interne lors de la creation de campagne.",
      },
      { status: 500 },
    );
  }
}
