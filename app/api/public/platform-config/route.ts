import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const ALLOWED_KEYS = new Set(["platform_fee_percentage"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key") || "";

  if (!ALLOWED_KEYS.has(key)) {
    return NextResponse.json({ error: "unsupported_key" }, { status: 400 });
  }

  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ value: null }, { status: 200 });
    }

    return NextResponse.json({ value: data?.value ?? null }, { status: 200 });
  } catch {
    return NextResponse.json({ value: null }, { status: 200 });
  }
}
