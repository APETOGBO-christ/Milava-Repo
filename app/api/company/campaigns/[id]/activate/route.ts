import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getAuthenticatedUserId(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Missing campaign id" },
        { status: 400 },
      );
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

    if (profileRow?.role !== "company" && profileRow?.role !== "admin") {
      return NextResponse.json(
        { error: "Action reservee a une marque." },
        { status: 403 },
      );
    }

    const { data: existingCampaign, error: loadError } = await admin
      .from("campaigns")
      .select("id, company_id, status")
      .eq("id", id)
      .single();

    if (loadError || !existingCampaign) {
      return NextResponse.json(
        { error: "Campagne introuvable." },
        { status: 404 },
      );
    }

    const isAdmin = profileRow?.role === "admin";
    if (!isAdmin && existingCampaign.company_id !== userId) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas activer cette campagne." },
        { status: 403 },
      );
    }

    const nowIso = new Date().toISOString();

    const { data: updated, error: updateError } = await admin
      .from("campaigns")
      .update({
        status: "active",
        started_at: nowIso,
        launched_at: nowIso,
        updated_at: nowIso,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: `Activation impossible: ${updateError.message}` },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      campaign: updated,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur interne lors de l'activation.",
      },
      { status: 500 },
    );
  }
}
