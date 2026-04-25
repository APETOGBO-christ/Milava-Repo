"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Gift, Megaphone, User, Wallet } from "lucide-react";
import {
  WorkspaceSidebar,
  type WorkspaceNavItem,
} from "@/components/navigation/workspace-sidebar";

export default function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { authUser, userProfile, loading, signOut } = useAuth();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [footerBalance, setFooterBalance] = useState("$0.00");

  // Redirect to home if not authenticated or not a creator
  useEffect(() => {
    if (!loading && (!authUser || userProfile?.role !== "creator")) {
      router.push("/");
    }
  }, [authUser, userProfile, loading, router]);

  useEffect(() => {
    const loadWalletBalance = async () => {
      if (!authUser?.id) {
        setFooterBalance("$0.00");
        return;
      }

      try {
        const { data, error } = await supabase
          .from("wallet_accounts")
          .select("available_balance")
          .eq("creator_id", authUser.id)
          .maybeSingle();

        if (error) throw error;
        const value = Number(data?.available_balance || 0);
        setFooterBalance(`$${value.toFixed(2)}`);
      } catch {
        setFooterBalance("$0.00");
      }
    };

    loadWalletBalance();
  }, [authUser?.id, supabase]);

  const canRender = !!authUser && userProfile?.role === "creator";

  if (!canRender && !loading) {
    return null;
  }

  const navItems: WorkspaceNavItem[] = [
    {
      label: "Campagnes",
      href: "/creator/dashboard",
      icon: Megaphone,
      exact: true,
    },
    { label: "Portefeuille", href: "/creator/wallet", icon: Wallet },
    { label: "Profil", href: "/creator/profile", icon: User },
  ];

  const displayName = [userProfile?.firstName, userProfile?.lastName]
    .filter(Boolean)
    .join(" ");
  const identityMark = (userProfile?.firstName?.[0] ?? "C").toUpperCase();

  return (
    <div className="min-h-screen bg-[#F4F4F6] lg:flex">
      <WorkspaceSidebar
        sectionLabel="Espace créateur"
        identityName={displayName || "Créateur"}
        identitySubtext="Creator studio"
        identityMark={identityMark}
        navItems={navItems}
        utilityHref="/creator/referrals"
        utilityLabel="Parrainages"
        utilityIcon={Gift}
        onLogout={() => signOut()}
        accent="creator"
        footerAnnouncements="Annonces"
        footerBalance={footerBalance}
        footerBrandName={displayName || "Créateur"}
      />

      <div className="flex min-h-screen flex-1 flex-col">
        <main className="flex-1 px-4 py-4 pb-24 lg:px-8 lg:py-8 lg:pb-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
