"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Megaphone, Settings2, User, Wallet } from "lucide-react";
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

  // Redirect to home if not authenticated or not a creator
  useEffect(() => {
    if (!loading && (!authUser || userProfile?.role !== "creator")) {
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

  if (!authUser || userProfile?.role !== "creator") {
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

  const displayName = [userProfile.firstName, userProfile.lastName]
    .filter(Boolean)
    .join(" ");
  const identityMark = (userProfile.firstName?.[0] ?? "C").toUpperCase();

  return (
    <div className="min-h-screen bg-[#F4F4F6] lg:flex">
      <WorkspaceSidebar
        sectionLabel="Espace créateur"
        identityName={displayName || "Créateur"}
        identitySubtext="Creator studio"
        identityMark={identityMark}
        navItems={navItems}
        utilityHref="/creator/profile"
        utilityLabel="Paramètres"
        utilityIcon={Settings2}
        onLogout={() => signOut()}
        accent="creator"
        footerEyebrow="Solde disponible"
        footerValue="$0.00"
        footerCaption="En attente: $0.00"
        footerActionLabel="Gérer mon wallet"
        footerActionHref="/creator/wallet"
      />

      <div className="flex min-h-screen flex-1 flex-col">
        <main className="flex-1 px-4 py-4 pb-24 lg:px-8 lg:py-8 lg:pb-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
