"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { UnifiedCampaignCard } from "@/components/campaigns/unified-campaign-card";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

// Palette Milava
// Fond : #0f121d (gris-bleu foncé, premium)
// Surface card: #14192f -> #0f121d gradient
// Border subtil : rgba(255,255,255,0.08)
// Accent bleu : #0047FF
// Texte primaire : #F0F0F5
// Texte secondaire : #9CA3AF
//
// Design System
// • Background: Subtle gradient dark gray-blue (professional, warm)
// • Cards: Layered gradient + premium shadows
// • Spacing: 4px base unit (4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 56, 64...)
// • Rounded: 8px (small), 12px (medium), 16px (large), 20px (xlarge)
// • Border: 1px white/8%, 2px accent blue
// • Shadows: Sophisticated depth with backdrop blur
// • Colors: Sophisticated dark mode with single accent (blue)

interface LandingCampaign {
  id: string;
  brand: string;
  niche: string;
  mode: string;
  rate: string;
  unit: string;
  budgetRemaining: number;
  budgetTotal: number;
  participants: number;
  plat: string[];
  hot: boolean;
  title: string;
  description: string;
}

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("fr-FR");

const rewardUnitMap: Record<string, string> = {
  cpm: "/1K vues",
  cpc: "/clic",
  cpl: "/lead",
  cpa: "/action",
  flat_rate: "/post",
  CPM: "/1K vues",
  CPC: "/clic",
  CPL: "/lead",
  CPA: "/action",
  "Flat Rate": "/post",
};

const rewardLabelMap: Record<string, string> = {
  cpm: "CPM",
  cpc: "CPC",
  cpl: "CPL",
  cpa: "CPA",
  flat_rate: "Flat Rate",
  CPM: "CPM",
  CPC: "CPC",
  CPL: "CPL",
  CPA: "CPA",
  "Flat Rate": "Flat Rate",
};

// Main
export default function Home() {
  const { authUser, userProfile, loading } = useAuth();
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const [activeNiche, setActiveNiche] = useState("Tout");
  const [showFilters, setShowFilters] = useState(false);
  const [campaigns, setCampaigns] = useState<LandingCampaign[]>([]);
  const [marketLoading, setMarketLoading] = useState(true);

  const niches = useMemo(() => {
    const uniqueNiches = Array.from(
      new Set(campaigns.map((campaign) => campaign.niche).filter(Boolean)),
    );
    return ["Tout", ...uniqueNiches];
  }, [campaigns]);

  useEffect(() => {
    if (!loading && authUser && userProfile) {
      router.push(
        userProfile.role === "company"
          ? "/company/dashboard"
          : "/creator/dashboard",
      );
    }
  }, [authUser, userProfile, loading, router]);

  useEffect(() => {
    const loadMarketplace = async () => {
      try {
        const { data, error } = await supabase
          .from("campaigns")
          .select(
            `
              id,
              title,
              description,
              reward_model,
              reward_value,
              budget_usable,
              budget_total,
              participant_count,
              category,
              required_networks,
              company:company_profiles(company_name)
            `,
          )
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(24);

        if (error) throw error;

        const mappedCampaigns: LandingCampaign[] = (data || []).map(
          (row: any) => {
            const companyRelation = Array.isArray(row.company)
              ? row.company[0]
              : row.company;

            return {
              id: row.id,
              brand: companyRelation?.company_name || "",
              niche: row.category || "",
              mode: rewardLabelMap[row.reward_model] || row.reward_model || "",
              rate: usdFormatter.format(Number(row.reward_value || 0)),
              unit: rewardUnitMap[row.reward_model] || "",
              budgetRemaining: Number(row.budget_usable || 0),
              budgetTotal: Number(row.budget_total || 0),
              participants: Number(row.participant_count || 0),
              plat: Array.isArray(row.required_networks)
                ? row.required_networks
                : [],
              hot: Number(row.participant_count || 0) >= 20,
              title: row.title || "",
              description: row.description || "",
            };
          },
        );

        setCampaigns(mappedCampaigns);
      } catch {
        setCampaigns([]);
      } finally {
        setMarketLoading(false);
      }
    };

    loadMarketplace();
  }, [supabase]);

  const filtered =
    activeNiche === "Tout"
      ? campaigns
      : campaigns.filter((c) => c.niche === activeNiche);

  const totalBudget = campaigns.reduce(
    (sum, campaign) => sum + campaign.budgetRemaining,
    0,
  );
  const totalParticipants = campaigns.reduce(
    (sum, campaign) => sum + campaign.participants,
    0,
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F4F4F6] flex items-center justify-center">
        <div className="flex gap-2">
          {[0, 120, 240].map((d) => (
            <div
              key={d}
              className="w-1.5 h-1.5 rounded-full bg-[#0047FF] animate-bounce"
              style={{ animationDelay: `${d}ms` }}
            />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F4F4F6] text-[#0F0F14] flex flex-col">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-black/[0.08] bg-white/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 h-16 flex items-center justify-between">
          <span className="text-2xl font-black tracking-tight text-[#0F0F14]">
            Milava<span className="text-[#0047FF]">.</span>
          </span>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/signin"
              className="text-sm font-medium text-[#6B7280] hover:text-[#0F0F14] px-4 py-2 transition-colors hidden sm:block"
            >
              Connexion
            </Link>
            <Link
              href="/auth/creator-signup"
              className="text-sm font-semibold border border-black/[0.12] text-[#0F0F14] px-4 py-2 rounded-lg hover:border-black/20 hover:bg-black/[0.02] transition-all hidden sm:flex"
            >
              Créateur
            </Link>
            <Link
              href="/auth/signup"
              className="text-sm font-bold bg-[#0047FF] text-white px-5 py-2 rounded-lg hover:bg-[#0038CC] transition-colors"
            >
              Marque
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative px-6 sm:px-8 pt-24 pb-16 max-w-6xl mx-auto w-full">
        {/* Subtle background glow */}
        <div className="absolute -top-40 right-0 w-80 h-80 bg-[#0047FF] opacity-[0.02] blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2.5 border border-black/[0.12] text-[#6B7280] text-xs font-semibold px-4 py-2 rounded-full mb-8">
            <span className="flex gap-1.5">
              <span className="w-1 h-1 rounded-full bg-[#0047FF]" />
              <span>{campaigns.length} campagnes actives</span>
            </span>
            <span className="text-black/30">·</span>
            <span>Afrique de l&apos;Ouest</span>
          </div>

          {/* Main Headline */}
          <h1
            className="font-black text-[#0F0F14] leading-[1.1] tracking-[-0.03em] mb-8"
            style={{ fontSize: "clamp(48px, 7vw, 72px)" }}
          >
            La plateforme où les créateurs
            <br />
            <span className="text-[#0047FF]">monétisent réellement.</span>
          </h1>

          {/* Subheading */}
          <p className="text-[#6B7280] text-lg leading-relaxed max-w-2xl mb-10 font-light">
            Rejoignez une communauté de créateurs gagnant en USD. Campagnes
            vérifiées, paiements garantis, sans négociation.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/auth/creator-signup"
              className="inline-flex items-center justify-center gap-2 h-13 px-8 rounded-lg bg-[#0047FF] text-white font-bold text-sm hover:bg-[#0038CC] transition-all shadow-[0_0_24px_rgba(0,71,255,0.25)]"
            >
              Commencer gratuitement
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center gap-2 h-13 px-8 rounded-lg border border-black/[0.12] text-[#0F0F14] font-semibold text-sm hover:border-black/20 hover:bg-black/[0.02] transition-all"
            >
              Lancer une campagne
            </Link>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-6 sm:gap-12 mt-16 pt-12 border-t border-black/[0.08]">
            <div>
              <p className="text-[#0047FF] font-black text-2xl">
                {usdFormatter.format(totalBudget)}
              </p>
              <p className="text-[#6B7280] text-xs font-medium mt-1">
                Budget campagnes actives
              </p>
            </div>
            <div>
              <p className="text-[#0047FF] font-black text-2xl">
                {numberFormatter.format(totalParticipants)}
              </p>
              <p className="text-[#6B7280] text-xs font-medium mt-1">
                Participants actifs
              </p>
            </div>
            <div>
              <p className="text-[#0047FF] font-black text-2xl">
                {numberFormatter.format(campaigns.length)}
              </p>
              <p className="text-[#6B7280] text-xs font-medium mt-1">
                Opportunités en cours
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* MARKETPLACE */}
      <section className="flex-1 px-6 sm:px-8 py-20 max-w-6xl mx-auto w-full">
        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14">
          <div>
            <h2 className="text-[#0F0F14] font-black text-3xl tracking-tight mb-2">
              Campagnes vedettes
            </h2>
            <p className="text-[#6B7280] text-sm">
              {filtered.length} campagnes disponibles · Paiements USD garantis
            </p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-sm font-semibold text-[#0047FF] hover:text-[#0038CC] transition-colors inline-flex items-center gap-2 self-start sm:self-auto"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            Filtrer par niche
          </button>
        </div>

        {/* Filters - collapsible */}
        {showFilters && (
          <div className="flex gap-2 flex-wrap mb-10 pb-8 border-b border-black/[0.08]">
            {niches.map((n) => (
              <button
                key={n}
                onClick={() => setActiveNiche(n)}
                className={`h-9 px-4 rounded-lg text-xs font-semibold border transition-all ${
                  activeNiche === n
                    ? "bg-[#0047FF] text-white border-[#0047FF]"
                    : "bg-transparent text-[#6B7280] border-black/[0.12] hover:border-black/20 hover:text-[#0F0F14]"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        )}

        {/* Campaigns Grid */}
        {marketLoading ? (
          <div className="text-sm text-[#6B7280]">
            Chargement des campagnes...
          </div>
        ) : null}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((c) => (
            <UnifiedCampaignCard
              key={c.id}
              variant="showcase"
              href="/auth/creator-signup"
              company={c.brand}
              niche={c.niche}
              title={c.title}
              description={c.description}
              mode={c.mode}
              rate={c.rate}
              unit={c.unit}
              networks={c.plat}
              hot={c.hot}
              budgetRemaining={c.budgetRemaining}
              budgetTotal={c.budgetTotal}
              participantCount={c.participants}
            />
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.08] px-6 sm:px-8 py-12 bg-gradient-to-t from-[#0a0e1a] to-[#0f121d]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <span className="font-black text-white text-xl tracking-tight">
              Milava<span className="text-[#0047FF]">.</span>
            </span>
            <div className="flex gap-8 text-xs text-[#9CA3AF]">
              <Link
                href="/auth/signin"
                className="hover:text-[#F0F0F5] transition-colors"
              >
                Connexion
              </Link>
              <Link
                href="/auth/creator-signup"
                className="hover:text-[#F0F0F5] transition-colors"
              >
                Créateur
              </Link>
              <Link
                href="/auth/signup"
                className="hover:text-[#F0F0F5] transition-colors"
              >
                Marque
              </Link>
            </div>
            <p className="text-xs text-[#9CA3AF]">© 2026 Milava</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
