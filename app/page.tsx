"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Users, Zap, TrendingUp, ChevronRight } from "lucide-react";

export default function Home() {
  const { authUser, userProfile, loading } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && authUser && userProfile) {
      const redirectPath =
        userProfile.role === "company"
          ? "/company/dashboard"
          : "/creator/dashboard";
      router.push(redirectPath);
    }
  }, [authUser, userProfile, loading, router]);

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center p-4 bg-[#F4F4F6] min-h-screen">
        <p className="text-[#4A4A5A]">Chargement...</p>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col bg-[#F4F4F6] min-h-screen">
      {/* Header */}
      <header className="border-b border-[#E4E4EA] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold font-display text-[#0F0F14]">
            Milava
          </h1>
          <div className="flex gap-3">
            <Link href="/auth/signin">
              <Button
                variant="secondary"
                className="border-[#0047FF] text-[#0047FF]"
              >
                Se connecter
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:py-20">
        <div className="w-full max-w-2xl space-y-8 text-center">
          <div>
            <h2 className="text-4xl sm:text-5xl font-bold font-display text-[#0F0F14] mb-4">
              La plateforme de marketing d&apos;influence en Afrique de
              l&apos;Ouest
            </h2>
            <p className="text-lg text-[#4A4A5A] mb-6">
              Connectez des entreprises aux meilleurs créateurs de contenu.
              Lancez des campagnes, créez du contenu rémunéré, et mesurez
              l&apos;impact en temps réel.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
            <Link href="/auth/signup" className="block">
              <Card className="h-full hover:border-[#0047FF] transition-colors cursor-pointer">
                <CardContent className="p-6 flex flex-col items-center justify-center gap-4 text-center h-full">
                  <Building2 className="w-8 h-8 text-[#0047FF]" />
                  <div>
                    <h3 className="font-bold text-[#0F0F14] text-lg mb-2">
                      Vous êtes annonceur ?
                    </h3>
                    <p className="text-sm text-[#4A4A5A] mb-4">
                      Lancez des campagnes et trouvez les meilleurs créateurs.
                    </p>
                    <span className="inline-flex items-center text-[#0047FF] font-medium text-sm">
                      S&apos;inscrire <ChevronRight className="w-4 h-4 ml-1" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/auth/creator-signup" className="block">
              <Card className="h-full hover:border-[#0047FF] transition-colors cursor-pointer">
                <CardContent className="p-6 flex flex-col items-center justify-center gap-4 text-center h-full">
                  <Users className="w-8 h-8 text-[#0047FF]" />
                  <div>
                    <h3 className="font-bold text-[#0F0F14] text-lg mb-2">
                      Vous êtes créateur ?
                    </h3>
                    <p className="text-sm text-[#4A4A5A] mb-4">
                      Candidatez à des campagnes et gagnez en créant.
                    </p>
                    <span className="inline-flex items-center text-[#0047FF] font-medium text-sm">
                      S&apos;inscrire <ChevronRight className="w-4 h-4 ml-1" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 pt-8 border-t border-[#E4E4EA]">
            <div className="text-center">
              <Zap className="w-8 h-8 text-[#0047FF] mx-auto mb-3" />
              <h4 className="font-bold text-[#0F0F14] mb-2">Rapide & simple</h4>
              <p className="text-sm text-[#4A4A5A]">
                Inscrivez-vous, vérifiez vos réseaux, commencez à la minute.
              </p>
            </div>
            <div className="text-center">
              <TrendingUp className="w-8 h-8 text-[#0047FF] mx-auto mb-3" />
              <h4 className="font-bold text-[#0F0F14] mb-2">Transparent</h4>
              <p className="text-sm text-[#4A4A5A]">
                Tracking en temps réel, paiements automatiques, 20% de
                commission.
              </p>
            </div>
            <div className="text-center">
              <Users className="w-8 h-8 text-[#0047FF] mx-auto mb-3" />
              <h4 className="font-bold text-[#0F0F14] mb-2">Communauté</h4>
              <p className="text-sm text-[#4A4A5A]">
                Connectez-vous avec des créateurs vérifiés et des marques de
                confiance.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
