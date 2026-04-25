"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TrendingUp,
  Eye,
  MousePointerClick,
  DollarSign,
  Loader2,
} from "lucide-react";

type NetworkStats = {
  network: string;
  views: number;
  percentage: number;
};

export default function CompanyAnalytics() {
  const { authUser } = useAuth();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const [loading, setLoading] = useState(true);
  const [budgetSpent, setBudgetSpent] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [networkStats, setNetworkStats] = useState<NetworkStats[]>([]);

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!authUser?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data: campaigns, error: campaignsError } = await supabase
          .from("campaigns")
          .select("id, spent_amount, required_networks")
          .eq("company_id", authUser.id);

        if (campaignsError) throw campaignsError;

        const campaignIds = (campaigns || []).map((c: any) => c.id);
        const spent = (campaigns || []).reduce(
          (sum: number, c: any) => sum + Number(c.spent_amount || 0),
          0,
        );
        setBudgetSpent(spent);

        if (campaignIds.length === 0) {
          setTotalViews(0);
          setTotalClicks(0);
          setNetworkStats([]);
          return;
        }

        const { data: metrics, error: metricsError } = await supabase
          .from("metrics")
          .select("campaign_id, impressions, clicks")
          .in("campaign_id", campaignIds);

        if (metricsError) throw metricsError;

        const views = (metrics || []).reduce(
          (sum: number, m: any) => sum + Number(m.impressions || 0),
          0,
        );
        const clicks = (metrics || []).reduce(
          (sum: number, m: any) => sum + Number(m.clicks || 0),
          0,
        );

        setTotalViews(views);
        setTotalClicks(clicks);

        const viewsByCampaign = new Map<string, number>();
        (metrics || []).forEach((m: any) => {
          viewsByCampaign.set(
            m.campaign_id,
            (viewsByCampaign.get(m.campaign_id) || 0) +
              Number(m.impressions || 0),
          );
        });

        const viewsByNetwork = new Map<string, number>();
        (campaigns || []).forEach((campaign: any) => {
          const campaignViews = viewsByCampaign.get(campaign.id) || 0;
          const networks: string[] = Array.isArray(campaign.required_networks)
            ? campaign.required_networks
            : [];

          if (networks.length === 0) return;

          const splitViews = campaignViews / networks.length;
          networks.forEach((network) => {
            viewsByNetwork.set(
              network,
              (viewsByNetwork.get(network) || 0) + splitViews,
            );
          });
        });

        const list = Array.from(viewsByNetwork.entries())
          .map(([network, networkViews]) => ({
            network,
            views: Math.round(networkViews),
            percentage:
              views > 0 ? Math.round((networkViews / views) * 100) : 0,
          }))
          .sort((a, b) => b.views - a.views);

        setNetworkStats(list);
      } catch {
        setBudgetSpent(0);
        setTotalViews(0);
        setTotalClicks(0);
        setNetworkStats([]);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [authUser?.id, supabase]);

  if (!authUser) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-6 h-6 animate-spin text-[#0047FF]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-[#0F0F14]">
          Analytics Globaux
        </h1>
        <p className="text-[#4A4A5A]">
          Apercu des performances de toutes vos campagnes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#0F0F14] text-white border-none">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-8">
              <div className="p-3 bg-white/10 rounded-xl">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Budget Total Depense</p>
              <h2 className="text-4xl font-bold font-display">
                $
                {budgetSpent.toLocaleString("en-US", {
                  maximumFractionDigits: 2,
                })}
              </h2>
            </div>
            <div className="mt-6 pt-6 border-t border-white/10 flex items-center gap-2 text-green-400">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">Donnees en temps reel</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-8">
              <div className="p-3 bg-blue-50 rounded-xl">
                <Eye className="w-6 h-6 text-[#0047FF]" />
              </div>
            </div>
            <div>
              <p className="text-sm text-[#4A4A5A] mb-1">
                Vues Totales Generees
              </p>
              <h2 className="text-4xl font-bold font-display text-[#0F0F14]">
                {totalViews.toLocaleString("fr-FR")}
              </h2>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-8">
              <div className="p-3 bg-blue-50 rounded-xl">
                <MousePointerClick className="w-6 h-6 text-[#0047FF]" />
              </div>
            </div>
            <div>
              <p className="text-sm text-[#4A4A5A] mb-1">
                Clics Totaux (Trafic)
              </p>
              <h2 className="text-4xl font-bold font-display text-[#0F0F14]">
                {totalClicks.toLocaleString("fr-FR")}
              </h2>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performances par reseau social</CardTitle>
          <CardDescription>Repartition des vues</CardDescription>
        </CardHeader>
        <CardContent>
          {networkStats.length === 0 ? (
            <p className="text-sm text-[#4A4A5A]">
              Aucune donnee reseau disponible.
            </p>
          ) : (
            <div className="space-y-6">
              {networkStats.map((item) => (
                <div key={item.network}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-[#0F0F14]">
                      {item.network}
                    </span>
                    <span className="text-[#4A4A5A]">
                      {item.percentage}% ({item.views.toLocaleString("fr-FR")}{" "}
                      vues)
                    </span>
                  </div>
                  <div className="h-3 w-full bg-[#E4E4EA] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0047FF]"
                      style={{ width: `${Math.max(item.percentage, 2)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
