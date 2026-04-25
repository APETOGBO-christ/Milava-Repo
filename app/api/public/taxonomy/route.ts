import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminSupabaseClient();
    const type = request.nextUrl.searchParams.get("type");

    if (!type) {
      return NextResponse.json(
        { error: "Missing query parameter: type" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("app_taxonomy_items")
      .select("value, sort_order")
      .eq("taxonomy_type", type)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: "Failed to load taxonomy values" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      type,
      values: (data || []).map((item) => item.value),
    });
  } catch {
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 },
    );
  }
}
