"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCampaigns } from "@/hooks/use-campaigns";
import { usePosts } from "@/hooks/use-posts";
import { Campaign } from "@/lib/supabase/campaigns";
import {
  DollarSign,
  TrendingUp,
  Eye,
  MousePointer,
  Loader2,
  ExternalLink,
  Calendar,
  CheckCircle2,
  Clock,
  X,
} from "lucide-react";
import Link from "next/link";

const CREATOR_ANALYTICS_CACHE_TTL_MS = 30 * 1000;
type CreatorAnalyticsCacheEntry = {
  campaigns: Campaign[];
  postsData: Array<{ post: any; metrics: any; gains: any }>;
  totalGains: number;
  ts: number;
};
const creatorAnalyticsCache = new Map<string, CreatorAnalyticsCacheEntry>();

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending_review: {
    label: "En attente",
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  approved: {
    label: "Approuvé",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  rejected: { label: "Refusé", color: "bg-red-50 text-red-600 border-red-200" },
};

export default function AnalyticsPage() {
  const { authUser } = useAuth();
  const { getActiveCampaigns } = useCampaigns();
  const { getCreatorPostsWithMetrics, getCreatorTotalGains } = usePosts();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [postsData, setPostsData] = useState<
    Array<{ post: any; metrics: any; gains: any }>
  >([]);
  const [totalGains, setTotalGains] = useState(0);
  const [loading, setLoading] = useState(true);

  const refreshFromServer = useCallback(
    async (showMainLoader: boolean) => {
      if (!authUser) return;
      if (showMainLoader) {
        setLoading(true);
      }

      try {
        const [allCampaigns, posts, gains] = await Promise.all([
          getActiveCampaigns(100, 0),
          getCreatorPostsWithMetrics(authUser.id),
          getCreatorTotalGains(authUser.id),
        ]);
        setCampaigns(allCampaigns);
        setPostsData(posts);
        setTotalGains(gains);

        creatorAnalyticsCache.set(authUser.id, {
          campaigns: allCampaigns,
          postsData: posts,
          totalGains: gains,
          ts: Date.now(),
        });
      } catch (e) {
        console.error(e);
      } finally {
        if (showMainLoader) {
          setLoading(false);
        }
      }
    },
    [
      authUser,
      getActiveCampaigns,
      getCreatorPostsWithMetrics,
      getCreatorTotalGains,
    ],
  );

  const loadData = useCallback(async () => {
    if (!authUser) return;
    const cached = creatorAnalyticsCache.get(authUser.id);
    const isFresh =
      cached && Date.now() - cached.ts < CREATOR_ANALYTICS_CACHE_TTL_MS;

    if (isFresh) {
      setCampaigns(cached.campaigns);
      setPostsData(cached.postsData);
      setTotalGains(cached.totalGains);
      setLoading(false);
      void refreshFromServer(false);
      return;
    }

    await refreshFromServer(true);
  }, [authUser, refreshFromServer]);

  useEffect(() => {
    loadData();
  }, [authUser, loadData]);

  const totalViews = postsData.reduce(
    (s, p) => s + (p.metrics?.views_count || 0),
    0,
  );
  const totalClicks = postsData.reduce(
    (s, p) => s + (p.metrics?.clicks_count || 0),
    0,
  );
  const approvedCount = postsData.filter(
    (p) => p.post.status === "approved",
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-[#0047FF]" />
      </div>
    );
  }

  const kpis = [
    {
      label: "Gains totaux",
      value: `$${totalGains.toFixed(2)}`,
      sub: "USD validés",
      icon: DollarSign,
      accent: true,
    },
    {
      label: "Vues générées",
      value:
        totalViews >= 1000
          ? `${(totalViews / 1000).toFixed(1)}K`
          : totalViews.toString(),
      sub: "toutes campagnes",
      icon: Eye,
    },
    {
      label: "Clics trackés",
      value: totalClicks.toString(),
      sub: "via liens Milava",
      icon: MousePointer,
    },
    {
      label: "Posts approuvés",
      value: approvedCount.toString(),
      sub: `sur ${postsData.length} soumis`,
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9898AA] mb-1">
          Performance
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-[-0.03em] text-[#0F0F14]">
          Mes analytics
        </h1>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => {
          const Icon = k.icon;
          return (
            <div
              key={i}
              className={`rounded-2xl border p-5 shadow-[0_2px_12px_rgba(15,15,20,0.04)] ${k.accent ? "bg-[#0047FF] border-[#0047FF]" : "bg-white border-[#E4E4EA]"}`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${k.accent ? "bg-white/20" : "bg-[#EEF4FF]"}`}
              >
                <Icon
                  className={`w-4 h-4 ${k.accent ? "text-white" : "text-[#0047FF]"}`}
                />
              </div>
              <p
                className={`text-2xl font-bold tracking-tight ${k.accent ? "text-white" : "text-[#0F0F14]"}`}
              >
                {k.value}
              </p>
              <p
                className={`text-xs mt-0.5 ${k.accent ? "text-white/60" : "text-[#9898AA]"}`}
              >
                {k.sub}
              </p>
              <p
                className={`text-xs font-medium mt-2 ${k.accent ? "text-white/80" : "text-[#4A4A5A]"}`}
              >
                {k.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Posts list */}
      <div className="bg-white rounded-2xl border border-[#E4E4EA] shadow-[0_2px_12px_rgba(15,15,20,0.04)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E4E4EA]">
          <h2 className="font-bold text-[#0F0F14]">Mes posts soumis</h2>
        </div>

        {postsData.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#EEF4FF] flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-5 h-5 text-[#0047FF]" />
            </div>
            <p className="text-sm font-semibold text-[#0F0F14] mb-1">
              Aucun post soumis
            </p>
            <p className="text-xs text-[#9898AA] mb-5">
              Postule à des campagnes et soumets ton contenu pour voir tes stats
              ici.
            </p>
            <Link
              href="/creator/dashboard"
              className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-[#0047FF] text-white text-xs font-semibold hover:bg-[#0038CC] transition-all"
            >
              Voir les campagnes
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[#E4E4EA]">
            {postsData.map(({ post, metrics, gains }) => {
              const campaign = campaigns.find((c) => c.id === post.campaign_id);
              const st =
                STATUS_CONFIG[post.status] || STATUS_CONFIG.pending_review;
              return (
                <div
                  key={post.id}
                  className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  {/* Campaign + URL */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="font-semibold text-[#0F0F14] text-sm truncate">
                      {campaign?.title || "Campagne inconnue"}
                    </p>
                    <a
                      href={post.post_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-[#0047FF] hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Voir le post
                    </a>
                    <p className="text-xs text-[#9898AA] flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(post.submitted_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>

                  {/* Metrics */}
                  <div className="flex gap-4 sm:gap-6 text-xs">
                    <div className="text-center">
                      <p className="font-bold text-[#0F0F14]">
                        {(metrics?.views_count || 0).toLocaleString()}
                      </p>
                      <p className="text-[#9898AA]">Vues</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-[#0F0F14]">
                        {(metrics?.clicks_count || 0).toLocaleString()}
                      </p>
                      <p className="text-[#9898AA]">Clics</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-[#0047FF]">
                        ${(gains?.amount || 0).toFixed(2)}
                      </p>
                      <p className="text-[#9898AA]">Gains</p>
                    </div>
                  </div>

                  {/* Status */}
                  <span
                    className={`self-start sm:self-auto text-xs font-semibold px-3 py-1.5 rounded-full border flex-shrink-0 ${st.color}`}
                  >
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
