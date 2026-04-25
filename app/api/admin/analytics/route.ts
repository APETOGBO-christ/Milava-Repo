import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { adminAccessService } from "@/lib/supabase/admin-access";
import { paymentTransactionService } from "@/lib/supabase/payment-transactions";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
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
              // The `setAll` method was called from a Server Component.
              // This can be ignored but can be useful to see if you're using
              // Server Components in the Right way.
            }
          },
        },
      },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin access
    const access = await adminAccessService.checkAdminAccess(user.id);

    if (!access.hasAccess) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 },
      );
    }

    // Get transaction stats
    const stats = await paymentTransactionService.getTransactionStats();
    const adminSupabase = createAdminSupabaseClient();

    const [{ data: monthlyData }, { data: providerBreakdown }] =
      await Promise.all([
        adminSupabase.rpc("admin_monthly_withdrawals", { p_months: 6 }),
        adminSupabase.rpc("admin_provider_breakdown"),
      ]);

    return NextResponse.json({
      success: true,
      stats,
      monthlyData: monthlyData || [],
      providerBreakdown: providerBreakdown || [],
    });
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 },
    );
  }
}
