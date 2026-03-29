"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCampaigns } from "@/hooks/use-campaigns";
import { usePosts } from "@/hooks/use-posts";
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
import {
  DollarSign,
  TrendingUp,
  Eye,
  MousePointer,
  Users,
  Target,
  Loader2,
  ExternalLink,
  Calendar,
  Check,
  Clock,
  X,
} from "lucide-react";
import Link from "next/link";

export default function AnalyticsPage() {
  const { authUser } = useAuth();
  const { getActiveCampaigns } = useCampaigns();
  const { getCreatorPostsWithMetrics, getCreatorTotalGains } = usePosts();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [postsData, setPostsData] = useState<
    Array<{
      post: any;
      metrics: any;
      gains: any;
    }>
  >([]);
  const [totalGains, setTotalGains] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load data
  const loadData = useCallback(async () => {
    if (!authUser) return;

    try {
      // Get all campaigns (for reference)
      const allCampaigns = await getActiveCampaigns(100, 0);
      setCampaigns(allCampaigns);

      // Get creator's posts with metrics
      const posts = await getCreatorPostsWithMetrics(authUser.id);
      setPostsData(posts);

      // Get total gains
      const gains = await getCreatorTotalGains(authUser.id);
      setTotalGains(gains);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [
    authUser,
    getActiveCampaigns,
    getCreatorPostsWithMetrics,
    getCreatorTotalGains,
  ]);

  useEffect(() => {
    loadData();
  }, [authUser, loadData]);

  const getStatusBadge = (status: string) => {
    const styles: Record<
      string,
      { bg: string; text: string; icon: React.ReactNode; label: string }
    > = {
      submitted: {
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        icon: <Clock className="w-3 h-3" />,
        label: "Soumis",
      },
      approved: {
        bg: "bg-green-100",
        text: "text-green-700",
        icon: <Check className="w-3 h-3" />,
        label: "Approuvé",
      },
      auto_approved: {
        bg: "bg-green-100",
        text: "text-green-700",
        icon: <Check className="w-3 h-3" />,
        label: "Auto-approuvé",
      },
      rejected: {
        bg: "bg-red-100",
        text: "text-red-700",
        icon: <X className="w-3 h-3" />,
        label: "Rejeté",
      },
    };

    const style = styles[status] || styles.submitted;

    return (
      <Badge className={`${style.bg} ${style.text} gap-1`}>
        {style.icon}
        {style.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Get campaign map for reference
  const campaignMap = new Map(campaigns.map((c) => [c.id, c]));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Tableau de bord Analytics</h1>
        <p className="text-gray-600">
          Suivez vos performances et vos gains sur toutes les campagnes
        </p>
      </div>

      {/* Earnings Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Gains */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gains totaux</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalGains.toLocaleString("fr-FR", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}{" "}
              FCFA
            </div>
            <p className="text-xs text-gray-500 mt-1">Tous les temps</p>
          </CardContent>
        </Card>

        {/* Posts Count */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Contenus soumis
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{postsData.length}</div>
            <p className="text-xs text-gray-500 mt-1">
              {
                postsData.filter((p) =>
                  ["approved", "auto_approved"].includes(p.post.status),
                ).length
              }{" "}
              approuvés
            </p>
          </CardContent>
        </Card>

        {/* Average Engagement */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Engagement moyen
            </CardTitle>
            <Eye className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {postsData.length > 0
                ? Math.round(
                    postsData.reduce(
                      (sum, p) => sum + (p.metrics?.engagements || 0),
                      0,
                    ) / postsData.length,
                  )
                : 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Interactions totales</p>
          </CardContent>
        </Card>
      </div>

      {/* Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des contenus</CardTitle>
          <CardDescription>
            Liste complète de tous vos contenus soumis et leurs performances
          </CardDescription>
        </CardHeader>
        <CardContent>
          {postsData.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium mb-2">
                Aucun contenu soumis
              </p>
              <p className="text-gray-500 text-sm mb-6">
                Explorez le marché et soumettez du contenu pour des campagnes
              </p>
              <Link href="/creator/marketplace">
                <Button>Explorer les campagnes</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {postsData.map(({ post, metrics, gains }) => {
                const campaign = campaignMap.get(post.campaign_id);

                return (
                  <div
                    key={post.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      {/* Left: Campaign & Post Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {campaign?.title || "Campagne supprimée"}
                          </h3>
                          {getStatusBadge(post.status)}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(post.submitted_at).toLocaleDateString(
                              "fr-FR",
                            )}
                          </div>
                          <a
                            href={post.content_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-500 hover:underline"
                          >
                            Voir le contenu
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>

                      {/* Middle: Metrics */}
                      {metrics && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                          <div>
                            <p className="text-xs text-gray-500">Vues</p>
                            <p className="font-bold text-gray-900">
                              {metrics.impressions.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Clics</p>
                            <p className="font-bold text-gray-900">
                              {metrics.clicks.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Leads</p>
                            <p className="font-bold text-gray-900">
                              {metrics.leads.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Conversions</p>
                            <p className="font-bold text-gray-900">
                              {metrics.conversions.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Right: Gains */}
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Gains</p>
                        <p className="text-lg font-bold text-green-600">
                          {gains
                            ? gains.total_gain.toLocaleString("fr-FR", {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              })
                            : "N/A"}{" "}
                          FCFA
                        </p>
                        {gains && (
                          <p className="text-xs text-gray-500 mt-1">
                            {gains.reward_model}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom CTA */}
      {postsData.length > 0 && (
        <div className="mt-8 text-center">
          <Link href="/creator/marketplace">
            <Button className="bg-blue-500 hover:bg-blue-600">
              Soumettre plus de contenu
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
