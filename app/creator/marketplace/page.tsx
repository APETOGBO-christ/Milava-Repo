"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCampaigns } from "@/hooks/use-campaigns";
import { Campaign } from "@/lib/supabase/campaigns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UnifiedCampaignCard } from "@/components/campaigns/unified-campaign-card";
import { CampaignApplyDialog } from "@/components/campaigns/campaign-apply-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Search, TrendingUp, Check } from "lucide-react";

export default function CreatorMarketplacePage() {
  const { authUser } = useAuth();
  const { createCandidature, getCreatorCandidatures } = useCampaigns();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [candidatures, setCandidatures] = useState<string[]>([]); // campaign IDs already applied to
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null,
  );
  const [applyCampaign, setApplyCampaign] = useState<Campaign | null>(null);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [appliedLoading, setAppliedLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Load campaigns and candidatures on mount
  const loadData = useCallback(async () => {
    setLoadingCampaigns(true);
    try {
      const response = await fetch("/api/public/campaigns/active?limit=50", {
        method: "GET",
      });

      const payload = await response.json();
      if (response.ok) {
        setCampaigns((payload?.campaigns as Campaign[]) || []);
      } else {
        setCampaigns([]);
      }
    } catch {
      setCampaigns([]);
    }

    if (authUser) {
      const creatorCandidatures = await getCreatorCandidatures(authUser.id);
      setCandidatures(creatorCandidatures.map((c) => c.campaign_id));
    }
    setLoadingCampaigns(false);
  }, [authUser, getCreatorCandidatures]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const submitCandidature = async (
    campaign: Campaign,
    _payload: { contentLink: string; network: string },
  ) => {
    if (!authUser) {
      throw new Error("Veuillez vous connecter.");
    }

    setAppliedLoading(true);
    const candidature = await createCandidature(campaign.id, authUser.id);
    setAppliedLoading(false);

    if (!candidature) {
      throw new Error("Impossible d'envoyer la candidature.");
    }

    setCandidatures((prev) =>
      prev.includes(campaign.id) ? prev : [...prev, campaign.id],
    );
    setSuccessMessage("Candidature envoyee avec succes.");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const openApplyDialog = (campaign: Campaign) => {
    setApplyCampaign(campaign);
  };

  const hasApplied = (campaignId: string) => candidatures.includes(campaignId);

  const filteredCampaigns = campaigns.filter(
    (c) =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getRewardUnit = (model: string) => {
    const labels: Record<string, string> = {
      CPM: "/1K vues",
      CPC: "/clic",
      CPL: "/lead",
      CPA: "/action",
      "Flat Rate": "/post",
      cpm: "/1K vues",
      cpc: "/clic",
      cpl: "/lead",
      cpa: "/action",
      flat_rate: "/post",
    };
    return labels[model] || "";
  };

  const getRewardLabel = (model: string) => {
    const labels: Record<string, string> = {
      CPM: "CPM",
      CPC: "CPC",
      CPL: "CPL",
      CPA: "CPA",
      "Flat Rate": "Flat Rate",
      cpm: "CPM",
      cpc: "CPC",
      cpl: "CPL",
      cpa: "CPA",
      flat_rate: "Flat Rate",
    };

    return labels[model] || model;
  };

  const getCompanyName = (campaign: Campaign) => {
    const withMeta = campaign as Campaign & {
      company_name?: string;
      company?: string;
      brand?: string;
    };
    return (
      withMeta.company_name ||
      withMeta.company ||
      withMeta.brand ||
      "Marque verifiee"
    );
  };

  const getCampaignNiche = (campaign: Campaign) => {
    const withMeta = campaign as Campaign & {
      niche?: string;
      category?: string;
    };
    return withMeta.niche || withMeta.category || "Influence";
  };

  const getCampaignNetworks = (campaign: Campaign) => {
    const withMeta = campaign as Campaign & {
      required_networks?: unknown;
      networks?: unknown;
      platforms?: unknown;
    };

    const values = [
      withMeta.required_networks,
      withMeta.networks,
      withMeta.platforms,
    ];
    for (const value of values) {
      if (Array.isArray(value)) {
        const list = value
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean);

        if (list.length > 0) {
          return list;
        }
      }
    }

    return ["Instagram", "TikTok", "Facebook"];
  };

  const getParticipantCount = (campaign: Campaign) => {
    const withMeta = campaign as Campaign & {
      participant_count?: number;
      participants?: number;
    };
    const count = withMeta.participant_count ?? withMeta.participants ?? 0;
    return Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  };

  if (loadingCampaigns) {
    return (
      <main className="flex-1 bg-[#F4F4F6] min-h-screen p-4 sm:p-6 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#0047FF]" />
          <p className="text-[#4A4A5A]">Chargement des campagnes...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-[#F4F4F6] min-h-screen p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-display text-[#0F0F14]">
            Marketplace de Campagnes
          </h1>
          <p className="text-[#4A4A5A] mt-1">
            Trouvez et candidatez a des campagnes d&apos;influence
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <Check className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-600">{successMessage}</p>
          </div>
        )}

        {/* Search Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-[#9898AA]" />
              <Input
                type="text"
                placeholder="Rechercher une campagne..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Campaigns Grid */}
        {filteredCampaigns.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <TrendingUp className="w-12 h-12 mx-auto text-[#9898AA]" />
              <p className="text-[#4A4A5A]">
                {campaigns.length === 0
                  ? "Aucune campagne disponible pour le moment"
                  : "Aucune campagne ne correspond a votre recherche"}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredCampaigns.map((campaign) => (
              <UnifiedCampaignCard
                key={campaign.id}
                variant="marketplace"
                company={getCompanyName(campaign)}
                niche={getCampaignNiche(campaign)}
                title={campaign.title}
                description={campaign.description}
                mode={getRewardLabel(campaign.reward_model)}
                rate={`$${campaign.reward_value}`}
                unit={getRewardUnit(campaign.reward_model)}
                networks={getCampaignNetworks(campaign)}
                budgetRemaining={campaign.budget_usable}
                budgetTotal={campaign.budget_total}
                budgetRemainingLabel={`$${Math.round(campaign.budget_usable).toLocaleString("en-US")}`}
                budgetTotalLabel={`$${Math.round(campaign.budget_total).toLocaleString("en-US")}`}
                participantCount={getParticipantCount(campaign)}
                isApplied={hasApplied(campaign.id)}
                isApplying={appliedLoading}
                applyDisabled={hasApplied(campaign.id) || appliedLoading}
                onViewDetails={() => setSelectedCampaign(campaign)}
                onApply={() => openApplyDialog(campaign)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Campaign Details Dialog */}
      {selectedCampaign && (
        <Dialog open={true} onOpenChange={() => setSelectedCampaign(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedCampaign.title}</DialogTitle>
              <DialogDescription>
                {selectedCampaign.description}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Reward Model */}
              <div className="p-4 bg-[#F9F9FC] rounded-lg border border-[#E4E4EA] space-y-3">
                <h3 className="font-medium text-[#0F0F14]">Remuneration</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[#9898AA] uppercase tracking-wide">
                      Type
                    </p>
                    <p className="font-medium text-[#0F0F14]">
                      {selectedCampaign.reward_model}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#9898AA] uppercase tracking-wide">
                      Tarif
                    </p>
                    <p className="font-bold text-[#0047FF] text-lg">
                      {selectedCampaign.reward_value}
                    </p>
                  </div>
                </div>
              </div>

              {/* Budget */}
              <div className="p-4 bg-[#F9F9FC] rounded-lg border border-[#E4E4EA] space-y-3">
                <h3 className="font-medium text-[#0F0F14]">Budget</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[#9898AA] uppercase tracking-wide">
                      Total
                    </p>
                    <p className="font-bold text-[#0F0F14]">
                      {selectedCampaign.budget_total.toLocaleString("fr-FR")}{" "}
                      FCFA
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#9898AA] uppercase tracking-wide">
                      Disponible
                    </p>
                    <p className="font-bold text-green-600">
                      {selectedCampaign.budget_usable.toLocaleString("fr-FR")}{" "}
                      FCFA
                    </p>
                  </div>
                </div>
              </div>

              {/* Objectives */}
              <div className="space-y-2">
                <h3 className="font-medium text-[#0F0F14]">Objectifs</h3>
                <p className="text-sm text-[#4A4A5A] whitespace-pre-wrap">
                  {selectedCampaign.objectives}
                </p>
              </div>

              {/* Action Button */}
              <Button
                onClick={() => {
                  setSelectedCampaign(null);
                  openApplyDialog(selectedCampaign);
                }}
                disabled={hasApplied(selectedCampaign.id)}
                className="w-full"
              >
                {hasApplied(selectedCampaign.id)
                  ? "Vous avez deja postule"
                  : "Postuler"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {applyCampaign ? (
        <CampaignApplyDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setApplyCampaign(null);
            }
          }}
          campaignCompany={getCompanyName(applyCampaign)}
          campaignTitle={applyCampaign.title}
          networkOptions={getCampaignNetworks(applyCampaign)}
          submitting={appliedLoading}
          onSubmit={async (payload) => {
            await submitCandidature(applyCampaign, payload);
            setApplyCampaign(null);
          }}
        />
      ) : null}
    </main>
  );
}
