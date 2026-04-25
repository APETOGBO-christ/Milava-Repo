"use client";

import { useEffect, useMemo, useState } from "react";
import { UnifiedCampaignCard } from "@/components/campaigns/unified-campaign-card";
import { CampaignApplyDialog } from "@/components/campaigns/campaign-apply-dialog";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Search, SlidersHorizontal, CircleHelp } from "lucide-react";

interface MarketplaceCampaign {
  id: string;
  company: string;
  title: string;
  description: string;
  rewardType: string;
  rewardAmount: number;
  budgetTotal: number;
  budgetRemaining: number;
  requiredNetworks: string[];
  niche: string;
  participantCount: number;
  isFeatured: boolean;
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

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

export default function CreatorDashboard() {
  const { authUser } = useAuth();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [campaigns, setCampaigns] = useState<MarketplaceCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [applied, setApplied] = useState<string[]>([]);
  const [applyCampaign, setApplyCampaign] =
    useState<MarketplaceCampaign | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [nicheFilter, setNicheFilter] = useState("Tout");

  useEffect(() => {
    const loadData = async () => {
      if (!authUser?.id) {
        setLoading(false);
        setCampaigns([]);
        setApplied([]);
        return;
      }

      try {
        const response = await fetch("/api/public/campaigns/active?limit=50", {
          method: "GET",
        });
        const payload = await response.json();

        const campaignRows = response.ok
          ? (payload?.campaigns as any[]) || []
          : [];

        const mappedCampaigns: MarketplaceCampaign[] = (campaignRows || []).map(
          (row: any) => {
            const companyRelation = Array.isArray(row.company)
              ? row.company[0]
              : row.company;

            return {
              id: row.id,
              company: companyRelation?.company_name || "",
              title: row.title || "",
              description: row.description || "",
              rewardType: row.reward_model || "",
              rewardAmount: Number(row.reward_value || 0),
              budgetTotal: Number(row.budget_total || 0),
              budgetRemaining: Number(row.budget_usable || 0),
              requiredNetworks: Array.isArray(row.required_networks)
                ? row.required_networks
                : [],
              niche: row.category || "",
              participantCount: Number(row.participant_count || 0),
              isFeatured: Number(row.participant_count || 0) >= 20,
            };
          },
        );

        const { data: candidatures, error: candidatureError } = await supabase
          .from("candidatures")
          .select("campaign_id")
          .eq("creator_id", authUser.id);

        if (candidatureError) throw candidatureError;

        setCampaigns(mappedCampaigns);
        setApplied((candidatures || []).map((row: any) => row.campaign_id));
      } catch {
        setCampaigns([]);
        setApplied([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [authUser?.id, supabase]);

  const niches = useMemo(() => {
    const unique = Array.from(
      new Set(campaigns.map((c) => c.niche).filter(Boolean)),
    );
    return ["Tout", ...unique];
  }, [campaigns]);

  const filtered = campaigns.filter((campaign) => {
    const q = searchQuery.trim().toLowerCase();
    const text = [
      campaign.title,
      campaign.company,
      campaign.description,
      campaign.niche,
      campaign.rewardType,
    ]
      .join(" ")
      .toLowerCase();

    return (
      (q === "" || text.includes(q)) &&
      (nicheFilter === "Tout" || campaign.niche === nicheFilter)
    );
  });

  const reset = () => {
    setSearchQuery("");
    setNicheFilter("Tout");
  };

  const submitApplication = async (
    campaign: MarketplaceCampaign,
    _payload: { contentLink: string; network: string },
  ) => {
    if (!authUser?.id) return;

    const { error } = await supabase.from("candidatures").insert({
      campaign_id: campaign.id,
      creator_id: authUser.id,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;

    setApplied((prev) =>
      prev.includes(campaign.id) ? prev : [...prev, campaign.id],
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-[#0047FF]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-[#E4E4EA] shadow-[0_2px_12px_rgba(15,15,20,0.04)] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9898AA] mb-1">
              Marketplace
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-[-0.03em] text-[#0F0F14]">
              Campagnes disponibles
            </h1>
          </div>
          <button
            type="button"
            className="inline-flex h-9 items-center gap-2 rounded-full border border-[#C7D9FF] bg-[#EEF4FF] px-4 text-xs font-semibold text-[#0047FF] hover:bg-[#ddeaff] transition-colors"
          >
            <CircleHelp className="h-3.5 w-3.5" />
            Comment je suis paye ?
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9898AA]" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une campagne, une marque..."
              className="w-full h-10 rounded-xl border border-[#E4E4EA] bg-[#F4F4F6] pl-10 pr-4 text-sm text-[#0F0F14] placeholder-[#9898AA] outline-none focus:border-[#0047FF] focus:bg-white transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-[#9898AA] flex-shrink-0" />
            <div className="flex gap-1.5 flex-wrap">
              {niches.map((niche) => (
                <button
                  key={niche}
                  onClick={() => setNicheFilter(niche)}
                  className={`h-9 px-3.5 rounded-xl text-xs font-semibold transition-all ${
                    nicheFilter === niche
                      ? "bg-[#0047FF] text-white shadow-[0_2px_8px_rgba(0,71,255,0.25)]"
                      : "bg-[#F4F4F6] text-[#4A4A5A] border border-[#E4E4EA] hover:border-[#0047FF] hover:text-[#0047FF]"
                  }`}
                >
                  {niche}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {searchQuery || nicheFilter !== "Tout" ? (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#9898AA]">
            <span className="font-semibold text-[#0F0F14]">
              {filtered.length}
            </span>{" "}
            campagne
            {filtered.length !== 1 ? "s" : ""} trouvee
            {filtered.length !== 1 ? "s" : ""}
          </p>
          <button
            onClick={reset}
            className="text-xs text-[#0047FF] hover:underline font-medium"
          >
            Reinitialiser les filtres
          </button>
        </div>
      ) : (
        <p className="text-sm text-[#9898AA]">
          <span className="font-semibold text-[#0F0F14]">
            {filtered.length}
          </span>{" "}
          campagnes actives
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-[#D6DCE8] px-6 py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#EEF4FF] flex items-center justify-center mx-auto mb-4">
            <Search className="w-5 h-5 text-[#0047FF]" />
          </div>
          <h2 className="text-lg font-bold text-[#0F0F14] mb-2">
            Aucune campagne trouvee
          </h2>
          <p className="text-sm text-[#4A4A5A] max-w-xs mx-auto mb-6">
            Essaie une autre recherche ou reinitialise les filtres.
          </p>
          <button
            onClick={reset}
            className="h-10 px-5 rounded-xl bg-[#0047FF] text-white text-sm font-semibold hover:bg-[#0038CC] transition-colors"
          >
            Voir toutes les campagnes
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((campaign) => (
            <UnifiedCampaignCard
              key={campaign.id}
              variant="marketplace"
              company={campaign.company}
              niche={campaign.niche}
              title={campaign.title}
              description={campaign.description}
              mode={rewardLabelMap[campaign.rewardType] || campaign.rewardType}
              rate={currencyFormatter.format(campaign.rewardAmount)}
              unit={rewardLabelMap[campaign.rewardType] || campaign.rewardType}
              networks={campaign.requiredNetworks}
              hot={campaign.isFeatured}
              budgetRemaining={campaign.budgetRemaining}
              budgetTotal={campaign.budgetTotal}
              participantCount={campaign.participantCount}
              isApplied={applied.includes(campaign.id)}
              applyDisabled={applied.includes(campaign.id)}
              onViewDetails={() => setApplyCampaign(campaign)}
              onApply={() => setApplyCampaign(campaign)}
            />
          ))}
        </div>
      )}

      {applyCampaign ? (
        <CampaignApplyDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) setApplyCampaign(null);
          }}
          campaignCompany={applyCampaign.company}
          campaignTitle={applyCampaign.title}
          networkOptions={applyCampaign.requiredNetworks}
          onSubmit={async (payload) => {
            await submitApplication(applyCampaign, payload);
            setApplyCampaign(null);
          }}
        />
      ) : null}
    </div>
  );
}
