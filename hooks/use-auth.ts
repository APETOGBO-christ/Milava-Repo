"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  authService,
  type UserProfile,
  type UserRole,
} from "@/lib/supabase/auth";
import type { User as AuthUser } from "@supabase/supabase-js";

interface UseAuthReturn {
  authUser: AuthUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    role: UserRole,
    profileData: Partial<UserProfile>,
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  isCompany: boolean;
  isCreator: boolean;
}

export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const user = await authService.getCurrentUser();
      setAuthUser(user || null);

      if (user) {
        const profile = await authService.getUserProfile(user.id);
        setUserProfile(profile);
      }

      setLoading(false);
    };

    initAuth();

    // Listen for auth changes
    const { data: subscription } = authService.onAuthStateChange(
      async (user) => {
        setAuthUser(user);
        if (user) {
          const profile = await authService.getUserProfile(user.id);
          setUserProfile(profile);
        } else {
          setUserProfile(null);
        }
      },
    );

    return () => {
      subscription?.subscription.unsubscribe();
    };
  }, []);

  const signUp = async (
    email: string,
    password: string,
    role: UserRole,
    profileData: Partial<UserProfile>,
  ) => {
    try {
      await authService.signUp(email, password, role, profileData);
      const user = await authService.getCurrentUser();
      if (user) {
        const profile = await authService.getUserProfile(user.id);
        setAuthUser(user);
        setUserProfile(profile);
        router.push(
          role === "company" ? "/company/profile" : "/creator/profile",
        );
      }
    } catch (error) {
      console.error("Sign up failed:", error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const result = await authService.signIn(email, password);
      if (result.user) {
        const profile = await authService.getUserProfile(result.user.id);
        setAuthUser(result.user);
        setUserProfile(profile);
        const redirectPath =
          profile?.role === "company"
            ? "/company/dashboard"
            : "/creator/dashboard";
        router.push(redirectPath);
      }
    } catch (error) {
      console.error("Sign in failed:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await authService.signOut();
      setAuthUser(null);
      setUserProfile(null);
      router.push("/");
    } catch (error) {
      console.error("Sign out failed:", error);
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!authUser) throw new Error("No authenticated user");
    try {
      await authService.updateUserProfile(
        authUser.id,
        userProfile?.role || "creator",
        updates,
      );
      const updatedProfile = await authService.getUserProfile(authUser.id);
      setUserProfile(updatedProfile);
    } catch (error) {
      console.error("Update profile failed:", error);
      throw error;
    }
  };

  return {
    authUser,
    userProfile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    isCompany: userProfile?.role === "company",
    isCreator: userProfile?.role === "creator",
  };
}
