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
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Eye, TrendingUp, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function CampaignsPage() {
  const { authUser } = useAuth();
  const { getCompanyCampaigns, loading } = useCampaigns();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);

  const loadCampaigns = useCallback(async () => {
    if (!authUser) return;
    setLoadingCampaigns(true);
    const userCampaigns = await getCompanyCampaigns(authUser.id);
    setCampaigns(userCampaigns);
    setLoadingCampaigns(false);
  }, [authUser, getCompanyCampaigns]);

  useEffect(() => {
    if (authUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadCampaigns();
    }
  }, [authUser, loadCampaigns]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; label: string }> =
      {
        draft: {
          bg: "bg-yellow-100",
          text: "text-yellow-700",
          label: "Brouillon",
        },
        active: { bg: "bg-green-100", text: "text-green-700", label: "Active" },
        completed: {
          bg: "bg-gray-100",
          text: "text-gray-700",
          label: "Terminée",
        },
      };
    const style = styles[status] || styles.draft;
    return <Badge className={`${style.bg} ${style.text}`}>{style.label}</Badge>;
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
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-display text-[#0F0F14]">
              Mes Campagnes
            </h1>
            <p className="text-[#4A4A5A]">
              Gérez vos campagnes d&apos;influence
            </p>
          </div>
          <Link href="/company/campaigns/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nouvelle Campagne
            </Button>
          </Link>
        </div>

        {/* Campaigns List or Empty State */}
        {campaigns.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <TrendingUp className="w-12 h-12 mx-auto text-[#9898AA]" />
              <h3 className="text-lg font-medium text-[#0F0F14]">
                Aucune campagne
              </h3>
              <p className="text-[#4A4A5A]">
                Créez votre première campagne pour trouver des créateurs
              </p>
              <Link href="/company/campaigns/new">
                <Button className="gap-2 mt-4">
                  <Plus className="w-4 h-4" />
                  Créer une Campagne
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <Card
                key={campaign.id}
                className="hover:border-[#0047FF] transition-colors"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-6">
                    {/* Campaign Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-[#0F0F14]">
                          {campaign.title}
                        </h3>
                        {getStatusBadge(campaign.status)}
                      </div>
                      <p className="text-sm text-[#4A4A5A] mb-4">
                        {campaign.description}
                      </p>

                      {/* Stats */}
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                        <div>
                          <p className="text-xs text-[#9898AA] uppercase tracking-wide">
                            Modèle
                          </p>
                          <p className="font-medium text-[#0F0F14]">
                            {campaign.reward_model}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-[#9898AA] uppercase tracking-wide">
                            Tarif
                          </p>
                          <p className="font-medium text-[#0047FF]">
                            {campaign.reward_value}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-[#9898AA] uppercase tracking-wide">
                            Budget Total
                          </p>
                          <p className="font-medium text-[#0F0F14]">
                            {(campaign.budget_total / 1000).toFixed(1)}k FCFA
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-[#9898AA] uppercase tracking-wide">
                            Disponible
                          </p>
                          <p className="font-medium text-green-600">
                            {(campaign.budget_usable / 1000).toFixed(1)}k FCFA
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-[#9898AA] uppercase tracking-wide">
                            Créée
                          </p>
                          <p className="font-medium text-[#0F0F14]">
                            {new Date(campaign.created_at).toLocaleDateString(
                              "fr-FR",
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-[#9898AA] uppercase tracking-wide">
                            Statut
                          </p>
                          <p className="font-medium text-[#0F0F14]">
                            {campaign.status === "draft"
                              ? "Brouillon"
                              : campaign.status === "active"
                                ? "Active"
                                : "Terminée"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Link href={`/company/campaigns/${campaign.id}`}>
                      <Button
                        variant="secondary"
                        className="flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Voir
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
