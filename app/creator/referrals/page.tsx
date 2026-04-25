"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Building2, Check, Copy, Users } from "lucide-react";

type ReferralLinkRow = {
  id: string;
  invitee_type: "creator" | "company";
  commission_rate: number;
  code: string;
};

type ReferralEventRow = {
  referral_link_id: string;
  commission_amount: number;
};

export default function ReferralsPage() {
  const { userProfile } = useAuth();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const [links, setLinks] = useState<ReferralLinkRow[]>([]);
  const [events, setEvents] = useState<ReferralEventRow[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    const loadReferrals = async () => {
      if (!userProfile?.id) return;

      try {
        const { data: linksData, error: linksError } = await supabase
          .from("referral_links")
          .select("id, invitee_type, commission_rate, code")
          .eq("owner_id", userProfile.id)
          .order("created_at", { ascending: true });

        if (linksError) throw linksError;

        const linkRows = (linksData || []) as ReferralLinkRow[];
        setLinks(linkRows);

        if (linkRows.length === 0) {
          setEvents([]);
          return;
        }

        const { data: eventsData, error: eventsError } = await supabase
          .from("referral_events")
          .select("referral_link_id, commission_amount")
          .in(
            "referral_link_id",
            linkRows.map((l) => l.id),
          );

        if (eventsError) throw eventsError;
        setEvents((eventsData || []) as ReferralEventRow[]);
      } catch {
        setLinks([]);
        setEvents([]);
      }
    };

    loadReferrals();
  }, [supabase, userProfile?.id]);

  const statsByLink = useMemo(() => {
    const map = new Map<string, { count: number; commission: number }>();
    events.forEach((event) => {
      const previous = map.get(event.referral_link_id) || {
        count: 0,
        commission: 0,
      };
      map.set(event.referral_link_id, {
        count: previous.count + 1,
        commission: previous.commission + Number(event.commission_amount || 0),
      });
    });
    return map;
  }, [events]);

  const totalReferrals = Array.from(statsByLink.values()).reduce(
    (sum, item) => sum + item.count,
    0,
  );
  const totalCommission = Array.from(statsByLink.values()).reduce(
    (sum, item) => sum + item.commission,
    0,
  );

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://milava.app";

  const copyReferralLink = async (code: string) => {
    const value = `${baseUrl}/ref/${code}`;
    await navigator.clipboard.writeText(value);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#0F0F14]">Parrainages</h1>
        <p className="mt-2 text-[#4A4A5A]">
          Invitez des createurs et des marques pour gagner des commissions.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {links.map((link) => {
          const stats = statsByLink.get(link.id) || { count: 0, commission: 0 };
          const isCreatorInvite = link.invitee_type === "creator";

          return (
            <div
              key={link.id}
              className="rounded-[24px] border border-[#E4EAF3] bg-white p-6 shadow-[0_18px_44px_rgba(15,15,20,0.05)]"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EEF3FF]">
                    {isCreatorInvite ? (
                      <Users className="h-6 w-6 text-[#0047FF]" />
                    ) : (
                      <Building2 className="h-6 w-6 text-[#0047FF]" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#0F0F14]">
                      {isCreatorInvite ? "Createurs" : "Marques"}
                    </h3>
                  </div>
                </div>
                <div className="rounded-[12px] bg-[#F0F5FF] px-3 py-1.5">
                  <p className="text-xs font-bold text-[#0047FF]">
                    {Number(link.commission_rate || 0).toFixed(2)}%
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={`${baseUrl}/ref/${link.code}`}
                  readOnly
                  className="flex-1 rounded-[12px] border border-[#E4EAF3] bg-[#F9FAFF] px-4 py-3 text-xs font-mono text-[#0F0F14]"
                />
                <button
                  onClick={() => copyReferralLink(link.code)}
                  className="rounded-[12px] bg-[#0047FF] px-4 py-3 font-semibold text-white transition-opacity hover:opacity-90 whitespace-nowrap inline-flex items-center gap-1.5"
                >
                  {copiedCode === link.code ? (
                    <>
                      <Check className="w-4 h-4" /> Copie
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> Copier
                    </>
                  )}
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-[12px] border border-[#E4EAF3] bg-[#F9FAFF] p-3">
                  <p className="text-[10px] font-semibold uppercase text-[#9898AA]">
                    Parraines
                  </p>
                  <p className="mt-2 text-lg font-bold text-[#0F0F14]">
                    {stats.count}
                  </p>
                </div>
                <div className="rounded-[12px] border border-[#E4EAF3] bg-[#F9FAFF] p-3">
                  <p className="text-[10px] font-semibold uppercase text-[#9898AA]">
                    Commission
                  </p>
                  <p className="mt-2 text-lg font-bold text-[#0047FF]">
                    ${stats.commission.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-[24px] border border-[#E4EAF3] bg-white p-6 shadow-[0_18px_44px_rgba(15,15,20,0.05)]">
        <h3 className="text-lg font-semibold text-[#0F0F14]">Total</h3>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="rounded-[14px] border border-[#E4EAF3] bg-[#F9FAFF] p-4">
            <p className="text-[11px] font-semibold uppercase text-[#9898AA]">
              Total parraines
            </p>
            <p className="mt-2 text-2xl font-bold text-[#0F0F14]">
              {totalReferrals}
            </p>
          </div>
          <div className="rounded-[14px] border border-[#E4EAF3] bg-[#F9FAFF] p-4">
            <p className="text-[11px] font-semibold uppercase text-[#9898AA]">
              Commission totale
            </p>
            <p className="mt-2 text-2xl font-bold text-[#0047FF]">
              ${totalCommission.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {links.length === 0 ? (
        <div className="rounded-[18px] border border-[#CFE0FF] bg-[#F6F9FF] p-4 text-sm text-[#0047FF]">
          Aucun lien de parrainage n'est configure pour ce compte.
        </div>
      ) : null}
    </div>
  );
}
