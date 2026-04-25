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

interface AuthStateSnapshot {
  authUser: AuthUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
}

interface CachedProfileEntry {
  profile: UserProfile | null;
  ts: number;
}

const PROFILE_CACHE_TTL_MS = 60 * 1000;

let authState: AuthStateSnapshot = {
  authUser: null,
  userProfile: null,
  loading: true,
};

const authListeners = new Set<(snapshot: AuthStateSnapshot) => void>();
let authInitialized = false;
let activeProfileRequest = 0;
const profileCache = new Map<string, CachedProfileEntry>();
let authSubscription: {
  subscription: {
    unsubscribe: () => void;
  };
} | null = null;

const emitAuthState = () => {
  authListeners.forEach((listener) => listener(authState));
};

const patchAuthState = (patch: Partial<AuthStateSnapshot>) => {
  authState = { ...authState, ...patch };
  emitAuthState();
};

const loadProfileForUser = async (user: AuthUser | null) => {
  const requestId = ++activeProfileRequest;

  if (!user) {
    patchAuthState({ authUser: null, userProfile: null, loading: false });
    return;
  }

  const cached = profileCache.get(user.id);
  const isFresh = cached && Date.now() - cached.ts < PROFILE_CACHE_TTL_MS;
  const hasSameUser = authState.authUser?.id === user.id;
  const hasLoadedProfile = hasSameUser && !!authState.userProfile;

  if (isFresh) {
    patchAuthState({
      authUser: user,
      userProfile: cached.profile,
      loading: false,
    });
  } else if (!hasLoadedProfile) {
    patchAuthState({ authUser: user, loading: true });
  } else {
    // Keep UI responsive when we already have a profile for the same user.
    patchAuthState({ authUser: user });
  }

  const profile = await authService.getUserProfile(user.id);

  // Ignore stale responses when auth changed while request was in flight.
  if (requestId !== activeProfileRequest) {
    return;
  }

  profileCache.set(user.id, {
    profile,
    ts: Date.now(),
  });

  patchAuthState({ userProfile: profile, loading: false });
};

const ensureAuthInitialized = () => {
  if (authInitialized) {
    return;
  }

  authInitialized = true;

  void (async () => {
    const user = await authService.getCurrentUser();
    await loadProfileForUser(user || null);
  })();

  const { data } = authService.onAuthStateChange((user) => {
    void loadProfileForUser(user);
  });

  authSubscription = data;
};

const subscribeAuth = (listener: (snapshot: AuthStateSnapshot) => void) => {
  authListeners.add(listener);

  return () => {
    authListeners.delete(listener);

    if (authListeners.size === 0 && authSubscription) {
      authSubscription.subscription.unsubscribe();
      authSubscription = null;
      authInitialized = false;
      activeProfileRequest += 1;
    }
  };
};

export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<AuthStateSnapshot>(authState);

  useEffect(() => {
    ensureAuthInitialized();
    return subscribeAuth(setSnapshot);
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
        await loadProfileForUser(user);
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
        profileCache.set(result.user.id, {
          profile,
          ts: Date.now(),
        });
        patchAuthState({
          authUser: result.user,
          userProfile: profile,
          loading: false,
        });
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
      activeProfileRequest += 1;
      profileCache.clear();
      patchAuthState({ authUser: null, userProfile: null, loading: false });
      router.push("/");
    } catch (error) {
      console.error("Sign out failed:", error);
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    const { authUser, userProfile } = authState;

    if (!authUser) throw new Error("No authenticated user");
    try {
      await authService.updateUserProfile(
        authUser.id,
        userProfile?.role || "creator",
        updates,
      );
      const updatedProfile = await authService.getUserProfile(authUser.id);
      profileCache.set(authUser.id, {
        profile: updatedProfile,
        ts: Date.now(),
      });
      patchAuthState({ userProfile: updatedProfile });
    } catch (error) {
      console.error("Update profile failed:", error);
      throw error;
    }
  };

  const { authUser, userProfile, loading } = snapshot;

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
