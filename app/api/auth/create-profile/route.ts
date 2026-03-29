import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { userId, email, role, profileData } = await request.json();

    if (!userId || !email || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const admin = createAdminSupabaseClient();

    // Upsert base profile. The auth trigger may already have created this row.
    const { error: profileError } = await admin
      .from("profiles")
      .upsert(
        {
          id: userId,
          email,
          role,
          country: profileData.country || "",
          phone: profileData.phone,
        },
        { onConflict: "id" },
      );

    if (profileError) throw profileError;

    // Upsert role-specific profile for idempotent signup flow.
    if (role === "company") {
      const { error: companyError } = await admin
        .from("company_profiles")
        .upsert(
          {
            profile_id: userId,
            company_name: profileData.companyName || "",
            sector: profileData.sector,
            website_url: profileData.website,
            description: profileData.description,
            logo_path: profileData.logoPath,
          },
          { onConflict: "profile_id" },
        );

      if (companyError) throw companyError;
    } else if (role === "creator") {
      const { error: creatorError } = await admin
        .from("creator_profiles")
        .upsert(
          {
            profile_id: userId,
            first_name: profileData.firstName || "",
            last_name: profileData.lastName || "",
            bio: profileData.bio,
            avatar_path: profileData.avatarPath,
          },
          { onConflict: "profile_id" },
        );

      if (creatorError) throw creatorError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Profile creation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
