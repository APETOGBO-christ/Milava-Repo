"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  BarChart3,
  LayoutDashboard,
  PlusCircle,
  Settings2,
  User,
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

  // Redirect to home if not authenticated or not a company
  useEffect(() => {
    if (!loading && (!authUser || userProfile?.role !== "company")) {
      router.push("/");
    }
  }, [authUser, userProfile, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F4F6]">
        <p className="text-[#4A4A5A]">Chargement...</p>
      </div>
    );
  }

  if (!authUser || userProfile?.role !== "company") {
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
    { label: "Performance", href: "/company/analytics", icon: BarChart3 },
    { label: "Profil marque", href: "/company/profile", icon: User },
  ];

  const identityMark = (userProfile.companyName?.[0] ?? "M").toUpperCase();

  return (
    <div className="min-h-screen bg-[#F4F4F6] lg:flex">
      <WorkspaceSidebar
        sectionLabel="Espace marque"
        identityName={userProfile.companyName || "Entreprise"}
        identitySubtext="Verified enterprise"
        identityMark={identityMark}
        navItems={navItems}
        utilityHref="/company/profile"
        utilityLabel="Paramètres"
        utilityIcon={Settings2}
        onLogout={() => signOut()}
        accent="company"
        footerEyebrow="Commission Milava"
        footerValue="20%"
        footerCaption="Prélevée sur chaque budget déposé"
        footerActionLabel="Nouvelle campagne"
        footerActionHref="/company/campaigns/new"
      />

      <div className="flex min-h-screen flex-1 flex-col">
        <main className="flex-1 px-4 py-4 pb-24 lg:px-8 lg:py-8 lg:pb-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
