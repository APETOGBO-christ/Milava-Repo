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

export async function GET(
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

    const isAdmin = profileRow?.role === "admin";

    let query = admin.from("campaigns").select("*").eq("id", id).limit(1);

    if (!isAdmin) {
      query = query.eq("company_id", userId);
    }

    const { data, error } = await query.single();

    if (error) {
      return NextResponse.json(
        { error: `Campaign load failed: ${error.message}` },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, campaign: data });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur interne lors du chargement de la campagne.",
      },
      { status: 500 },
    );
  }
}
