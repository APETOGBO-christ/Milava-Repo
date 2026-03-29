import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { userId, role, updates } = await request.json();

    if (!userId || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const admin = createAdminSupabaseClient();

    // Update base profile
    const { error: profileError } = await admin
      .from("profiles")
      .update({
        country: updates.country,
        phone: updates.phone,
      })
      .eq("id", userId);

    if (profileError) throw profileError;

    // Update role-specific profile
    if (role === "company") {
      const { error: companyError } = await admin
        .from("company_profiles")
        .update({
          company_name: updates.companyName,
          sector: updates.sector,
          website_url: updates.website,
          description: updates.description,
          logo_path: updates.logoPath,
        })
        .eq("profile_id", userId);

      if (companyError) throw companyError;
    } else if (role === "creator") {
      const { error: creatorError } = await admin
        .from("creator_profiles")
        .update({
          first_name: updates.firstName,
          last_name: updates.lastName,
          bio: updates.bio,
          avatar_path: updates.avatarPath,
        })
        .eq("profile_id", userId);

      if (creatorError) throw creatorError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
