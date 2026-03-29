"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useCampaigns } from "@/hooks/use-campaigns";
import { usePosts } from "@/hooks/use-posts";
import { Campaign, CandidatureWithCreator } from "@/lib/supabase/campaigns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  DollarSign,
  Users,
  TrendingUp,
  Check,
  X,
} from "lucide-react";
import Link from "next/link";

export default function CampaignDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { authUser } = useAuth();
  const {
    getCampaign,
    getCampaignCandidatures,
    acceptCandidature,
    rejectCandidature,
    updateCampaignStatus,
    loading,
  } = useCampaigns();
  const { getCampaignMetrics } = usePosts();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [candidatures, setCandidatures] = useState<CandidatureWithCreator[]>(
    [],
  );
  const [selectedCreator, setSelectedCreator] =
    useState<CandidatureWithCreator | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [metrics, setMetrics] = useState<any>(null);

  const campaignId = params.id as string;

  // Load campaign details and candidatures
  const loadData = useCallback(async () => {
    setLoadingData(true);
    const campaignData = await getCampaign(campaignId);
    setCampaign(campaignData);

    const candidaturesData = await getCampaignCandidatures(campaignId);
    setCandidatures(candidaturesData);

    // Load metrics
    try {
      const metricsData = await getCampaignMetrics(campaignId);
      setMetrics(metricsData);
    } catch (error) {
      console.error("Error loading metrics:", error);
    }

    setLoadingData(false);
  }, [campaignId, getCampaign, getCampaignCandidatures, getCampaignMetrics]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const handleAccept = async (candidatureId: string) => {
    setActionLoading(true);
    const result = await acceptCandidature(candidatureId);
    setActionLoading(false);

    if (result) {
      setSuccessMessage("Candidature acceptée!");
      setTimeout(() => loadData(), 1000);
      setTimeout(() => setSuccessMessage(""), 3000);
      setSelectedCreator(null);
    }
  };

  const handleReject = async (candidatureId: string) => {
    setActionLoading(true);
    const result = await rejectCandidature(candidatureId);
    setActionLoading(false);

    if (result) {
      setSuccessMessage("Candidature rejetée");
      setTimeout(() => loadData(), 1000);
      setTimeout(() => setSuccessMessage(""), 3000);
      setSelectedCreator(null);
    }
  };

  const handleActivate = async () => {
    if (campaign) {
      const result = await updateCampaignStatus(campaign.id, "active");
      if (result) {
        setSuccessMessage("Campagne activée!");
        setCampaign(result);
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      pending: { label: "En attente", color: "bg-yellow-100 text-yellow-700" },
      accepted: { label: "Acceptée", color: "bg-green-100 text-green-700" },
      rejected: { label: "Rejetée", color: "bg-red-100 text-red-700" },
      auto_accepted: {
        label: "Auto-acceptée (72h)",
        color: "bg-blue-100 text-blue-700",
      },
    };
    return labels[status] || labels.pending;
  };

  const pendingCandidatures = candidatures.filter(
    (c) => c.status === "pending",
  );
  const acceptedCandidatures = candidatures.filter(
    (c) => c.status === "accepted" || c.status === "auto_accepted",
  );
  const rejectedCandidatures = candidatures.filter(
    (c) => c.status === "rejected",
  );

  if (loadingData) {
    return (
      <main className="flex-1 bg-[#F4F4F6] min-h-screen p-4 sm:p-6 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#0047FF]" />
          <p className="text-[#4A4A5A]">Chargement...</p>
        </div>
      </main>
    );
  }

  if (!campaign) {
    return (
      <main className="flex-1 bg-[#F4F4F6] min-h-screen p-4 sm:p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <AlertCircle className="w-12 h-12 mx-auto text-red-600" />
            <p className="text-[#4A4A5A]">Campagne non trouvée</p>
            <Link href="/company/campaigns">
              <Button>Retour aux campagnes</Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-[#F4F4F6] min-h-screen p-4 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/company/campaigns">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
              Retour
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold font-display text-[#0F0F14]">
              {campaign.title}
            </h1>
            <p className="text-[#4A4A5A]">{campaign.description}</p>
          </div>
          <Badge
            className={
              campaign.status === "active"
                ? "bg-green-100 text-green-700"
                : campaign.status === "draft"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-gray-100 text-gray-700"
            }
          >
            {campaign.status === "active"
              ? "Active"
              : campaign.status === "draft"
                ? "Brouillon"
                : "Terminée"}
          </Badge>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <Check className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-600">{successMessage}</p>
          </div>
        )}

        {/* Campaign Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {/* Reward Model */}
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-[#9898AA] uppercase tracking-wide mb-2">
                Type de Rémunération
              </p>
              <p className="text-2xl font-bold text-[#0047FF]">
                {campaign.reward_model}
              </p>
              <p className="text-xs text-[#4A4A5A]">
                {campaign.reward_value} par unité
              </p>
            </CardContent>
          </Card>

          {/* Total Budget */}
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-[#9898AA] uppercase tracking-wide mb-2">
                Budget Total
              </p>
              <p className="text-2xl font-bold text-[#0F0F14]">
                {campaign.budget_total.toLocaleString("fr-FR")}
              </p>
              <p className="text-xs text-[#4A4A5A]">FCFA</p>
            </CardContent>
          </Card>

          {/* Available Budget */}
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-[#9898AA] uppercase tracking-wide mb-2">
                Budget Disponible
              </p>
              <p className="text-2xl font-bold text-green-600">
                {campaign.budget_usable.toLocaleString("fr-FR")}
              </p>
              <p className="text-xs text-[#4A4A5A]">
                {Math.round(
                  (campaign.budget_usable / campaign.budget_total) * 100,
                )}
                % du total
              </p>
            </CardContent>
          </Card>

          {/* Candidatures */}
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-[#9898AA] uppercase tracking-wide mb-2">
                Candidatures
              </p>
              <p className="text-2xl font-bold text-[#0F0F14]">
                {candidatures.length}
              </p>
              <p className="text-xs text-[#4A4A5A]">
                {pendingCandidatures.length} en attente
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Campaign Details */}
        <Card>
          <CardHeader>
            <CardTitle>Détails de la Campagne</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium text-[#0F0F14] mb-2">Objectifs</h3>
              <p className="text-sm text-[#4A4A5A] whitespace-pre-wrap">
                {campaign.objectives}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Candidatures Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Candidatures */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                En Attente
              </CardTitle>
              <CardDescription>
                {pendingCandidatures.length} créateurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingCandidatures.length === 0 ? (
                <p className="text-sm text-[#4A4A5A]">Aucune candidature</p>
              ) : (
                <div className="space-y-3">
                  {pendingCandidatures.map((cand) => (
                    <button
                      key={cand.id}
                      onClick={() => setSelectedCreator(cand)}
                      className="w-full p-3 border border-[#E4E4EA] rounded-lg hover:border-[#0047FF] text-left transition-all"
                    >
                      <p className="font-medium text-[#0F0F14]">
                        {cand.creator.first_name} {cand.creator.last_name}
                      </p>
                      <p className="text-xs text-[#4A4A5A]">
                        {cand.creator.follower_count.toLocaleString()} followers
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Accepted Candidatures */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Acceptées
              </CardTitle>
              <CardDescription>
                {acceptedCandidatures.length} créateurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {acceptedCandidatures.length === 0 ? (
                <p className="text-sm text-[#4A4A5A]">
                  Aucune candidature acceptée
                </p>
              ) : (
                <div className="space-y-3">
                  {acceptedCandidatures.map((cand) => (
                    <div
                      key={cand.id}
                      className="p-3 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <p className="font-medium text-[#0F0F14]">
                        {cand.creator.first_name} {cand.creator.last_name}
                      </p>
                      <p className="text-xs text-[#4A4A5A]">
                        {cand.creator.verified_networks_count} réseaux vérifiés
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rejected Candidatures */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <X className="w-5 h-5 text-red-600" />
                Rejetées
              </CardTitle>
              <CardDescription>
                {rejectedCandidatures.length} créateurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rejectedCandidatures.length === 0 ? (
                <p className="text-sm text-[#4A4A5A]">
                  Aucune candidature rejetée
                </p>
              ) : (
                <div className="space-y-3">
                  {rejectedCandidatures.map((cand) => (
                    <div
                      key={cand.id}
                      className="p-3 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <p className="font-medium text-[#0F0F14] line-clamp-1">
                        {cand.creator.first_name} {cand.creator.last_name}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Metrics Section */}
        {(campaign.status === "active" || campaign.status === "completed") &&
          metrics && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Performances de la campagne
                </CardTitle>
                <CardDescription>
                  Métriques en temps réel et gains totaux
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Metrics Summary Grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-600 font-medium">Vues</p>
                    <p className="text-2xl font-bold text-blue-900 mt-1">
                      {metrics.totalImpressions.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-xs text-purple-600 font-medium">Clics</p>
                    <p className="text-2xl font-bold text-purple-900 mt-1">
                      {metrics.totalClicks.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <p className="text-xs text-orange-600 font-medium">Leads</p>
                    <p className="text-2xl font-bold text-orange-900 mt-1">
                      {metrics.totalLeads.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-xs text-green-600 font-medium">
                      Conversions
                    </p>
                    <p className="text-2xl font-bold text-green-900 mt-1">
                      {metrics.totalConversions.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="text-xs text-emerald-600 font-medium">
                      Gains
                    </p>
                    <p className="text-2xl font-bold text-emerald-900 mt-1">
                      {metrics.totalGain.toLocaleString("fr-FR", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}{" "}
                      <span className="text-sm">FCFA</span>
                    </p>
                  </div>
                </div>

                {/* Posts Status Summary */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Total soumis</p>
                    <p className="text-xl font-bold text-gray-900">
                      {metrics.postCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Approuvés</p>
                    <p className="text-xl font-bold text-green-600">
                      {metrics.approvedCount}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

        {/* Activate Campaign Button */}
        {campaign.status === "draft" && (
          <div className="flex gap-3">
            <Button
              onClick={handleActivate}
              disabled={loading}
              className="gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Activer la Campagne
            </Button>
            <p className="text-sm text-[#4A4A5A] flex items-center">
              Une fois activée, les créateurs pourront candidater
            </p>
          </div>
        )}
      </div>

      {/* Creator Details Dialog */}
      {selectedCreator && (
        <Dialog open={true} onOpenChange={() => setSelectedCreator(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedCreator.creator.first_name}{" "}
                {selectedCreator.creator.last_name}
              </DialogTitle>
              <DialogDescription>
                Profil du créateur - Évaluation et décision
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Creator Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-[#F9F9FC] rounded-lg">
                  <p className="text-xs text-[#9898AA] uppercase">Followers</p>
                  <p className="text-2xl font-bold text-[#0F0F14]">
                    {(selectedCreator.creator.follower_count / 1000).toFixed(1)}
                    k
                  </p>
                </div>
                <div className="p-4 bg-[#F9F9FC] rounded-lg">
                  <p className="text-xs text-[#9898AA] uppercase">Engagement</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {selectedCreator.creator.engagement_rate.toFixed(1)}%
                  </p>
                </div>
                <div className="p-4 bg-[#F9F9FC] rounded-lg">
                  <p className="text-xs text-[#9898AA] uppercase">
                    Réseaux Vérifiés
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {selectedCreator.creator.verified_networks_count}
                  </p>
                </div>
              </div>

              {/* Creator Bio */}
              {selectedCreator.creator.bio && (
                <div>
                  <h3 className="font-medium text-[#0F0F14] mb-2">Bio</h3>
                  <p className="text-sm text-[#4A4A5A]">
                    {selectedCreator.creator.bio}
                  </p>
                </div>
              )}

              {/* Specialties */}
              {selectedCreator.creator.specialties.length > 0 && (
                <div>
                  <h3 className="font-medium text-[#0F0F14] mb-2">Domaines</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedCreator.creator.specialties.map((spec, idx) => (
                      <Badge key={idx} variant="secondary">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {selectedCreator.status === "pending" && (
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleReject(selectedCreator.id)}
                    variant="secondary"
                    disabled={actionLoading}
                    className="flex-1"
                  >
                    Rejeter
                  </Button>
                  <Button
                    onClick={() => handleAccept(selectedCreator.id)}
                    disabled={actionLoading}
                    className="flex-1 gap-2"
                  >
                    {actionLoading && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    Accepter
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </main>
  );
}
