"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  BarChart3,
  Gift,
  LayoutDashboard,
  PlusCircle,
  User,
  Wallet,
} from "lucide-react";
import {
  WorkspaceSidebar,
  type WorkspaceNavItem,
} from "@/components/navigation/workspace-sidebar";

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { authUser, userProfile, loading, signOut } = useAuth();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [footerBalance, setFooterBalance] = useState("$0.00");

  // Redirect to home if not authenticated or not a company
  useEffect(() => {
    if (!loading && (!authUser || userProfile?.role !== "company")) {
      router.push("/");
    }
  }, [authUser, userProfile, loading, router]);

  useEffect(() => {
    const loadCampaignBalance = async () => {
      if (!authUser?.id) {
        setFooterBalance("$0.00");
        return;
      }

      try {
        const { data, error } = await supabase
          .from("campaigns")
          .select("budget_usable")
          .eq("company_id", authUser.id);

        if (error) throw error;

        const totalUsable = (data || []).reduce(
          (sum: number, row: any) => sum + Number(row.budget_usable || 0),
          0,
        );

        setFooterBalance(`$${totalUsable.toFixed(2)}`);
      } catch {
        setFooterBalance("$0.00");
      }
    };

    loadCampaignBalance();
  }, [authUser?.id, supabase]);

  const canRender = !!authUser && userProfile?.role === "company";

  if (!canRender && !loading) {
    return null;
  }

  const navItems: WorkspaceNavItem[] = [
    {
      label: "Tableau de bord",
      href: "/company/dashboard",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      label: "Créer campagne",
      href: "/company/campaigns/new",
      icon: PlusCircle,
    },
    { label: "Portefeuille", href: "/company/wallet", icon: Wallet },
    { label: "Performance", href: "/company/analytics", icon: BarChart3 },
    { label: "Profil marque", href: "/company/profile", icon: User },
  ];

  const companyName = userProfile?.companyName || "Entreprise";
  const identityMark = (companyName[0] ?? "M").toUpperCase();

  return (
    <div className="min-h-screen bg-[#F4F4F6] lg:flex">
      <WorkspaceSidebar
        sectionLabel="Espace marque"
        identityName={companyName}
        identitySubtext="Verified enterprise"
        identityMark={identityMark}
        navItems={navItems}
        utilityHref="/company/referrals"
        utilityLabel="Parrainages"
        utilityIcon={Gift}
        onLogout={() => signOut()}
        accent="company"
        footerAnnouncements="Annonces"
        footerBalance={footerBalance}
        footerBrandName={companyName}
      />

      <div className="flex min-h-screen flex-1 flex-col">
        <main className="flex-1 px-4 py-4 pb-24 lg:px-8 lg:py-8 lg:pb-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
