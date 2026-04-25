"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  PlusCircle,
  Users,
  Eye,
  MousePointerClick,
  DollarSign,
  ArrowRight,
  Clock,
} from "lucide-react";

interface CompanyCampaign {
  id: string;
  title: string;
  status: string;
  budgetSpent: number;
  budgetTotal: number;
  applicants: number;
  views: number;
  clicks: number;
  endDate?: string;
}

export default function CompanyDashboard() {
  const { authUser } = useAuth();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<CompanyCampaign[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!authUser?.id) {
        setCampaigns([]);
        setLoading(false);
        return;
      }

      try {
        const { data: campaignRows, error: campaignError } = await supabase
          .from("campaigns")
          .select("id, title, status, spent_amount, budget_total, end_date")
          .eq("company_id", authUser.id)
          .order("created_at", { ascending: false });

        if (campaignError) throw campaignError;

        const campaignIds = (campaignRows || []).map((row: any) => row.id);

        const [candidaturesRes, metricsRes] = await Promise.all([
          campaignIds.length
            ? supabase
                .from("candidatures")
                .select("campaign_id")
                .in("campaign_id", campaignIds)
            : Promise.resolve({ data: [], error: null } as any),
          campaignIds.length
            ? supabase
                .from("metrics")
                .select("campaign_id, impressions, clicks")
                .in("campaign_id", campaignIds)
            : Promise.resolve({ data: [], error: null } as any),
        ]);

        if (candidaturesRes.error) throw candidaturesRes.error;
        if (metricsRes.error) throw metricsRes.error;

        const applicantsByCampaign = new Map<string, number>();
        (candidaturesRes.data || []).forEach((row: any) => {
          applicantsByCampaign.set(
            row.campaign_id,
            (applicantsByCampaign.get(row.campaign_id) || 0) + 1,
          );
        });

        const metricsByCampaign = new Map<
          string,
          { views: number; clicks: number }
        >();
        (metricsRes.data || []).forEach((row: any) => {
          const previous = metricsByCampaign.get(row.campaign_id) || {
            views: 0,
            clicks: 0,
          };
          metricsByCampaign.set(row.campaign_id, {
            views: previous.views + Number(row.impressions || 0),
            clicks: previous.clicks + Number(row.clicks || 0),
          });
        });

        const mapped: CompanyCampaign[] = (campaignRows || []).map(
          (row: any) => {
            const metrics = metricsByCampaign.get(row.id) || {
              views: 0,
              clicks: 0,
            };
            return {
              id: row.id,
              title: row.title,
              status: row.status,
              budgetSpent: Number(row.spent_amount || 0),
              budgetTotal: Number(row.budget_total || 0),
              applicants: applicantsByCampaign.get(row.id) || 0,
              views: metrics.views,
              clicks: metrics.clicks,
              endDate: row.end_date,
            };
          },
        );

        setCampaigns(mapped);
      } catch {
        setCampaigns([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [authUser?.id, supabase]);

  const totalBudget = campaigns.reduce(
    (sum, campaign) => sum + campaign.budgetTotal,
    0,
  );
  const totalViews = campaigns.reduce(
    (sum, campaign) => sum + campaign.views,
    0,
  );
  const totalClicks = campaigns.reduce(
    (sum, campaign) => sum + campaign.clicks,
    0,
  );
  const activeCreators = campaigns.reduce(
    (sum, campaign) => sum + campaign.applicants,
    0,
  );

  const kpis = [
    {
      label: "Budget total depose",
      value: `$${totalBudget.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
      sub: "toutes campagnes",
      icon: DollarSign,
      color: "text-[#0047FF]",
      bg: "bg-[#EEF4FF]",
    },
    {
      label: "Vues generees",
      value: totalViews.toLocaleString("fr-FR"),
      sub: "depuis metrics",
      icon: Eye,
      color: "text-[#0047FF]",
      bg: "bg-[#EEF4FF]",
    },
    {
      label: "Clics trackes",
      value: totalClicks.toLocaleString("fr-FR"),
      sub: "depuis metrics",
      icon: MousePointerClick,
      color: "text-[#0047FF]",
      bg: "bg-[#EEF4FF]",
    },
    {
      label: "Candidatures",
      value: activeCreators.toLocaleString("fr-FR"),
      sub: "sur campagnes",
      icon: Users,
      color: "text-[#0047FF]",
      bg: "bg-[#EEF4FF]",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-[#0047FF]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9898AA] mb-1">
            Tableau de bord
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-[-0.03em] text-[#0F0F14]">
            Vue d'ensemble
          </h1>
        </div>
        <Link
          href="/company/campaigns/new"
          className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-[#0047FF] text-white text-sm font-semibold hover:bg-[#0038CC] transition-all shadow-[0_2px_12px_rgba(0,71,255,0.2)]"
        >
          <PlusCircle className="w-4 h-4" />
          Nouvelle campagne
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div
              key={i}
              className="bg-white rounded-2xl border border-[#E4E4EA] shadow-[0_2px_12px_rgba(15,15,20,0.04)] p-5"
            >
              <div
                className={`w-9 h-9 rounded-xl ${kpi.bg} flex items-center justify-center mb-3`}
              >
                <Icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <p className="text-2xl font-bold text-[#0F0F14] tracking-tight">
                {kpi.value}
              </p>
              <p className="text-xs text-[#9898AA] mt-0.5">{kpi.sub}</p>
              <p className="text-xs font-medium text-[#4A4A5A] mt-2">
                {kpi.label}
              </p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-[#E4E4EA] shadow-[0_2px_12px_rgba(15,15,20,0.04)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E4E4EA] flex items-center justify-between">
          <h2 className="font-bold text-[#0F0F14]">Mes campagnes</h2>
          <Link
            href="/company/campaigns"
            className="text-xs text-[#0047FF] font-semibold hover:underline inline-flex items-center gap-1"
          >
            Voir tout <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="divide-y divide-[#E4E4EA]">
          {campaigns.map((campaign) => {
            const pct =
              campaign.budgetTotal > 0
                ? Math.round(
                    (campaign.budgetSpent / campaign.budgetTotal) * 100,
                  )
                : 0;
            return (
              <Link
                key={campaign.id}
                href={`/company/campaigns/${campaign.id}`}
                className="flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-4 hover:bg-[#FAFBFE] transition-colors group"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${campaign.status === "active" ? "bg-emerald-400" : "bg-[#9898AA]"}`}
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-[#0F0F14] truncate group-hover:text-[#0047FF] transition-colors">
                      {campaign.title}
                    </p>
                    <p className="text-xs text-[#9898AA] flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {campaign.endDate
                        ? `Fin le ${new Date(
                            campaign.endDate,
                          ).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                          })}`
                        : "Sans date de fin"}
                    </p>
                  </div>
                </div>

                <div className="w-full sm:w-40">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-[#9898AA]">Budget</span>
                    <span className="font-semibold text-[#0F0F14]">
                      ${campaign.budgetSpent} / ${campaign.budgetTotal}
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#E4E4EA] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0047FF] rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="flex gap-4 sm:gap-6 text-xs">
                  <div className="text-center">
                    <p className="font-bold text-[#0F0F14]">
                      {campaign.applicants}
                    </p>
                    <p className="text-[#9898AA]">Candidats</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-[#0F0F14]">
                      {campaign.views.toLocaleString("fr-FR")}
                    </p>
                    <p className="text-[#9898AA]">Vues</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-[#0F0F14]">
                      {campaign.clicks.toLocaleString("fr-FR")}
                    </p>
                    <p className="text-[#9898AA]">Clics</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="px-6 py-4 border-t border-[#E4E4EA] bg-[#FAFBFE]">
          <Link
            href="/company/campaigns/new"
            className="inline-flex items-center gap-2 text-sm text-[#0047FF] font-semibold hover:gap-3 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Lancer une nouvelle campagne
          </Link>
        </div>
      </div>
    </div>
  );
}
