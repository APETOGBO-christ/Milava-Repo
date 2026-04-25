import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const limitParam = Number(request.nextUrl.searchParams.get("limit") || 50);
    const limit = Number.isFinite(limitParam)
      ? Math.min(Math.max(limitParam, 1), 100)
      : 50;

    const admin = createAdminSupabaseClient();

    const { data, error } = await admin
      .from("campaigns")
      .select(
        `
        *,
        company:company_profiles(company_name)
      `,
      )
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json(
        { error: `Active campaigns load failed: ${error.message}` },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true, campaigns: data || [] });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur interne lors du chargement des campagnes actives.",
      },
      { status: 500 },
    );
  }
}
