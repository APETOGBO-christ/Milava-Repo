import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { User as AuthUser } from "@supabase/supabase-js";

export type UserRole = "company" | "creator" | "admin";

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  country: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
  // Company-specific
  companyName?: string;
  sector?: string;
  website?: string;
  description?: string;
  logoPath?: string;
  // Creator-specific
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatarPath?: string;
  reliabilityScore?: number;
  totalCompletedCampaigns?: number;
}

export class AuthService {
  private supabase = createBrowserSupabaseClient();

  async signUp(
    email: string,
    password: string,
    role: UserRole,
    profileData: Partial<UserProfile>,
  ) {
    try {
      // Step 1: Create auth account
      const signUpMetadata =
        role === "company"
          ? {
              role,
              company_name: profileData.companyName ?? "",
            }
          : {
              role,
              first_name: profileData.firstName ?? "",
              last_name: profileData.lastName ?? "",
            };

      const { data: authData, error: authError } =
        await this.supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: signUpMetadata,
          },
        });

      if (authError) throw authError;
      if (!authData.user) throw new Error("User creation failed");

      // Step 2: Create profiles via API route (handles server-side operations)
      const response = await fetch("/api/auth/create-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: authData.user.id,
          email,
          role,
          profileData,
        }),
      });

      if (!response.ok) {
        let message = "Failed to create user profile";
        try {
          const errorData = await response.json();
          if (errorData?.error) {
            message = errorData.error;
          }
        } catch {
          // Keep fallback message when response body is not JSON.
        }
        throw new Error(message);
      }

      return { success: true, user: authData.user };
    } catch (error) {
      console.error("Sign up error:", error);
      throw error;
    }
  }

  async signIn(email: string, password: string) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { success: true, user: data.user };
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  }

  async signOut() {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  }

  async getCurrentUser() {
    try {
      const { data, error } = await this.supabase.auth.getUser();
      if (error) throw error;
      return data.user;
    } catch (error) {
      console.error("Get current user error:", error);
      return null;
    }
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await this.supabase
        .from("profiles")
        .select(
          `
          id, email, role, country, phone, created_at, updated_at,
          company_profiles ( company_name, sector, website_url, description, logo_path ),
          creator_profiles ( first_name, last_name, bio, avatar_path, reliability_score, total_completed_campaigns )
        `,
        )
        .eq("id", userId)
        .single();

      if (error) throw error;

      const baseProfile: UserProfile = {
        id: data.id,
        email: data.email,
        role: data.role as UserRole,
        country: data.country,
        phone: data.phone,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      if (data.role === "company" && data.company_profiles[0]) {
        const cp = data.company_profiles[0];
        return {
          ...baseProfile,
          companyName: cp.company_name,
          sector: cp.sector,
          website: cp.website_url,
          description: cp.description,
          logoPath: cp.logo_path,
        };
      } else if (data.role === "creator" && data.creator_profiles[0]) {
        const cr = data.creator_profiles[0];
        return {
          ...baseProfile,
          firstName: cr.first_name,
          lastName: cr.last_name,
          bio: cr.bio,
          avatarPath: cr.avatar_path,
          reliabilityScore: cr.reliability_score,
          totalCompletedCampaigns: cr.total_completed_campaigns,
        };
      }

      return baseProfile;
    } catch (error) {
      console.error("Get user profile error:", error);
      return null;
    }
  }

  async updateUserProfile(
    userId: string,
    role: UserRole,
    updates: Partial<UserProfile>,
  ) {
    try {
      // Use API route to handle server-side updates
      const response = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          role,
          updates,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user profile");
      }

      return { success: true };
    } catch (error) {
      console.error("Update user profile error:", error);
      throw error;
    }
  }

  async resetPassword(email: string) {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Reset password error:", error);
      throw error;
    }
  }

  async updatePassword(newPassword: string) {
    try {
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Update password error:", error);
      throw error;
    }
  }

  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return this.supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null);
    });
  }
}

export const authService = new AuthService();
