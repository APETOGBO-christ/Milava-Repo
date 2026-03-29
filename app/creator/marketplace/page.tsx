"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCampaigns } from "@/hooks/use-campaigns";
import { Campaign } from "@/lib/supabase/campaigns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  Search,
  MapPin,
  Users,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Check,
} from "lucide-react";

export default function CreatorMarketplacePage() {
  const { authUser, userProfile } = useAuth();
  const {
    getActiveCampaigns,
    createCandidature,
    getCreatorCandidatures,
    loading,
    error,
  } = useCampaigns();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [candidatures, setCandidatures] = useState<string[]>([]); // campaign IDs already applied to
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null,
  );
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [appliedLoading, setAppliedLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Load campaigns and candidatures on mount
  const loadData = useCallback(async () => {
    setLoadingCampaigns(true);
    const activeCampaigns = await getActiveCampaigns(50, 0);
    setCampaigns(activeCampaigns);

    if (authUser) {
      const creatorCandidatures = await getCreatorCandidatures(authUser.id);
      setCandidatures(creatorCandidatures.map((c) => c.campaign_id));
    }
    setLoadingCampaigns(false);
  }, [authUser, getActiveCampaigns, getCreatorCandidatures]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const handleApply = async (campaign: Campaign) => {
    if (!authUser) {
      alert("Veuillez vous connecter");
      return;
    }

    setAppliedLoading(true);
    const candidature = await createCandidature(campaign.id, authUser.id);
    setAppliedLoading(false);

    if (candidature) {
      setCandidatures([...candidatures, campaign.id]);
      setSuccessMessage("Candidature envoyée avec succès!");
      setTimeout(() => setSuccessMessage(""), 3000);
      setSelectedCampaign(null);
    }
  };

  const hasApplied = (campaignId: string) => candidatures.includes(campaignId);

  const filteredCampaigns = campaigns.filter(
    (c) =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getRewardModelLabel = (model: string) => {
    const labels: Record<string, string> = {
      CPM: "Par 1000 vues",
      CPC: "Par clic",
      CPL: "Par inscription",
      CPA: "Par action",
      "Flat Rate": "Tarif forfaitaire",
    };
    return labels[model] || model;
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
            Trouvez et candidatez à des campagnes d&apos;influence
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
                  : "Aucune campagne ne correspond à votre recherche"}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredCampaigns.map((campaign) => (
              <Card key={campaign.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-xl">
                        {campaign.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 mt-1">
                        {campaign.description}
                      </CardDescription>
                    </div>
                    {hasApplied(campaign.id) && (
                      <Badge className="bg-green-100 text-green-700">
                        <Check className="w-3 h-3 mr-1" />
                        Candidature envoyée
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-1 space-y-4">
                  {/* Reward Model & Value */}
                  <div className="grid grid-cols-2 gap-4 p-3 bg-[#F9F9FC] rounded-lg">
                    <div>
                      <p className="text-xs text-[#9898AA] uppercase tracking-wide">
                        Type de Rémunération
                      </p>
                      <p className="font-medium text-[#0F0F14]">
                        {campaign.reward_model}
                      </p>
                      <p className="text-xs text-[#4A4A5A]">
                        {getRewardModelLabel(campaign.reward_model)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#9898AA] uppercase tracking-wide">
                        Tarif
                      </p>
                      <p className="font-medium text-[#0047FF] text-lg">
                        {campaign.reward_value}
                      </p>
                    </div>
                  </div>

                  {/* Budget */}
                  <div className="flex items-center gap-3 p-3 bg-[#F9F9FC] rounded-lg">
                    <DollarSign className="w-5 h-5 text-[#0047FF]" />
                    <div>
                      <p className="text-xs text-[#9898AA] uppercase tracking-wide">
                        Budget Disponible
                      </p>
                      <p className="font-bold text-[#0F0F14] text-lg">
                        {campaign.budget_usable.toLocaleString("fr-FR")} FCFA
                      </p>
                    </div>
                  </div>

                  {/* Objectives Preview */}
                  <div>
                    <p className="text-sm font-medium text-[#0F0F14] mb-2">
                      Objectifs
                    </p>
                    <p className="text-sm text-[#4A4A5A] line-clamp-2">
                      {campaign.objectives}
                    </p>
                  </div>
                </CardContent>

                {/* Action Buttons */}
                <CardContent className="border-t border-[#E4E4EA] pt-4 space-y-3">
                  <Button
                    onClick={() => setSelectedCampaign(campaign)}
                    variant="secondary"
                    className="w-full"
                  >
                    Voir les détails
                  </Button>
                  <Button
                    onClick={() => handleApply(campaign)}
                    disabled={hasApplied(campaign.id) || appliedLoading}
                    className="w-full"
                  >
                    {appliedLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    {hasApplied(campaign.id)
                      ? "Vous avez candidaté"
                      : "Candidater"}
                  </Button>
                </CardContent>
              </Card>
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
                <h3 className="font-medium text-[#0F0F14]">Rémunération</h3>
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
                onClick={() => handleApply(selectedCampaign)}
                disabled={hasApplied(selectedCampaign.id) || appliedLoading}
                className="w-full gap-2"
              >
                {appliedLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                {hasApplied(selectedCampaign.id)
                  ? "Vous avez déjà candidaté"
                  : "Candidater"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </main>
  );
}
