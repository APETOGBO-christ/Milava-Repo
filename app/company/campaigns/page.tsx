"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Campaign } from "@/lib/supabase/campaigns";
import {
  Loader2,
  Plus,
  Eye,
  TrendingUp,
  Clock,
  DollarSign,
  Users,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

const STATUS_CONFIG: Record<
  string,
  { label: string; dot: string; badge: string }
> = {
  draft: {
    label: "Brouillon",
    dot: "bg-[#9898AA]",
    badge: "bg-[#F4F4F6] text-[#4A4A5A] border-[#E4E4EA]",
  },
  active: {
    label: "En cours",
    dot: "bg-emerald-400",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  pending_funding: {
    label: "En attente de fonds",
    dot: "bg-amber-400",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
  },
  paused: {
    label: "En pause",
    dot: "bg-amber-400",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
  },
  completed: {
    label: "Terminée",
    dot: "bg-[#C7D9FF]",
    badge: "bg-[#EEF4FF] text-[#0047FF] border-[#C7D9FF]",
  },
  cancelled: {
    label: "Annulée",
    dot: "bg-red-300",
    badge: "bg-red-50 text-red-600 border-red-200",
  },
};

export default function CampaignsPage() {
  const { authUser } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const load = useCallback(async () => {
    if (!authUser) return;
    setLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setCampaigns([]);
        return;
      }

      const response = await fetch("/api/company/campaigns", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const payload = await response.json();

      if (!response.ok) {
        setCampaigns([]);
        return;
      }

      setCampaigns((payload?.campaigns as Campaign[]) || []);
    } catch {
      setCampaigns([]);
    }
    setLoading(false);
  }, [authUser]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (authUser) load();
  }, [authUser, load]);

  const tabs = [
    { key: "all", label: "Toutes", count: campaigns.length },
    {
      key: "active",
      label: "En cours",
      count: campaigns.filter((c) => c.status === "active").length,
    },
    {
      key: "draft",
      label: "Brouillons",
      count: campaigns.filter((c) => c.status === "draft").length,
    },
    {
      key: "completed",
      label: "Terminées",
      count: campaigns.filter((c) => c.status === "completed").length,
    },
  ];

  const filtered =
    filter === "all" ? campaigns : campaigns.filter((c) => c.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-[#0047FF]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9898AA] mb-1">
            Espace marque
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-[-0.03em] text-[#0F0F14]">
            Mes campagnes
          </h1>
        </div>
        <Link
          href="/company/campaigns/new"
          className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-[#0047FF] text-white text-sm font-semibold hover:bg-[#0038CC] transition-all shadow-[0_2px_12px_rgba(0,71,255,0.2)]"
        >
          <Plus className="w-4 h-4" />
          Nouvelle campagne
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`h-9 px-4 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              filter === t.key
                ? "bg-[#0047FF] text-white shadow-[0_2px_8px_rgba(0,71,255,0.2)]"
                : "bg-white border border-[#E4E4EA] text-[#4A4A5A] hover:border-[#0047FF] hover:text-[#0047FF]"
            }`}
          >
            {t.label}
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${filter === t.key ? "bg-white/20 text-white" : "bg-[#F4F4F6] text-[#9898AA]"}`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-[#D6DCE8] px-6 py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#EEF4FF] flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-5 h-5 text-[#0047FF]" />
          </div>
          <h2 className="text-lg font-bold text-[#0F0F14] mb-2">
            {filter === "all"
              ? "Aucune campagne"
              : `Aucune campagne "${tabs.find((t) => t.key === filter)?.label.toLowerCase()}"`}
          </h2>
          <p className="text-sm text-[#4A4A5A] mb-6 max-w-xs mx-auto">
            {filter === "all"
              ? "Créez votre première campagne pour commencer à travailler avec des créateurs."
              : "Aucune campagne dans cette catégorie."}
          </p>
          {filter === "all" && (
            <Link
              href="/company/campaigns/new"
              className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-[#0047FF] text-white text-sm font-semibold hover:bg-[#0038CC] transition-all"
            >
              <Plus className="w-4 h-4" />
              Créer une campagne
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E4E4EA] shadow-[0_2px_12px_rgba(15,15,20,0.04)] overflow-hidden">
          <div className="divide-y divide-[#E4E4EA]">
            {filtered.map((c) => {
              const st = STATUS_CONFIG[c.status] || STATUS_CONFIG.draft;
              const endDate =
                (c as Campaign & { ends_at?: string; end_date?: string })
                  .ends_at ||
                (c as Campaign & { ends_at?: string; end_date?: string })
                  .end_date ||
                c.ended_at;
              const spent =
                (
                  c as Campaign & {
                    spent_budget?: number;
                    spent_amount?: number;
                  }
                ).spent_amount ||
                (
                  c as Campaign & {
                    spent_budget?: number;
                    spent_amount?: number;
                  }
                ).spent_budget ||
                0;
              const pct =
                c.budget_total > 0
                  ? Math.round((spent / c.budget_total) * 100)
                  : 0;
              return (
                <Link
                  key={c.id}
                  href={`/company/campaigns/${c.id}`}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-4 hover:bg-[#FAFBFE] transition-colors group"
                >
                  {/* Status + title */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${st.dot}`}
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-[#0F0F14] truncate group-hover:text-[#0047FF] transition-colors">
                        {c.title}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-[#9898AA]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {endDate
                            ? new Date(endDate).toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "short",
                              })
                            : "—"}
                        </span>
                        <span className="capitalize">{c.reward_model}</span>
                      </div>
                    </div>
                  </div>

                  {/* Budget bar */}
                  <div className="w-full sm:w-36">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#9898AA]">Budget</span>
                      <span className="font-semibold text-[#0F0F14]">
                        ${spent.toFixed(0)}/${c.budget_total}
                      </span>
                    </div>
                    <div className="h-1.5 bg-[#E4E4EA] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0047FF] rounded-full"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Status badge + arrow */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${st.badge}`}
                    >
                      {st.label}
                    </span>
                    <ArrowRight className="w-4 h-4 text-[#9898AA] group-hover:text-[#0047FF] group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
