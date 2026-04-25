"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { CampaignDetailDialog } from "@/components/campaigns/campaign-detail-dialog";
import {
  CampaignCardData,
  formatCurrency,
  formatDate,
  formatReward,
  getBudgetRemainingPercent,
  getCompanyMonogram,
  platformIconMap,
  toneStyles,
} from "@/components/campaigns/campaign-shared";
import { ArrowUpRight } from "lucide-react";

interface CampaignCardProps {
  campaign: CampaignCardData;
  isApplied: boolean;
  onApply: (campaignId: string) => void;
}

export type { CampaignCardData } from "@/components/campaigns/campaign-shared";

export function CampaignCard({
  campaign,
  isApplied,
  onApply,
}: CampaignCardProps) {
  const [open, setOpen] = useState(false);
  const tone = toneStyles[campaign.tone];
  const remainingPercent = getBudgetRemainingPercent(
    campaign.budgetRemaining,
    campaign.budgetTotal,
  );
  const progressWidth =
    remainingPercent === 0 ? 0 : Math.max(12, remainingPercent);
  const statusText = isApplied
    ? "Candidature envoyee"
    : (campaign.statusLabel ?? "Actif");

  const openDialog = () => setOpen(true);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openDialog();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Card
        role="button"
        tabIndex={0}
        onClick={openDialog}
        onKeyDown={handleKeyDown}
        className="group cursor-pointer overflow-hidden border-[#E4E4EA] bg-white text-left shadow-[0_16px_36px_rgba(15,15,20,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-[#C7D9FF] hover:shadow-[0_24px_54px_rgba(0,71,255,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047FF]"
      >
        {/* Hero Background */}
        <div className={cn("relative overflow-hidden px-4 py-8", tone.hero)}>
          <div
            className={cn(
              "absolute -right-8 -top-8 h-24 w-24 rounded-full blur-3xl transition-transform duration-300 group-hover:translate-x-[-4px]",
              tone.glow,
            )}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0))]" />

          {/* Header with Company and Platforms */}
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] border text-sm font-bold uppercase text-white",
                  tone.plate,
                )}
              >
                {getCompanyMonogram(campaign.company)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white/90">
                  {campaign.company}
                </p>
                <p className="mt-0.5 text-xs text-white/60">
                  {campaign.objective}
                </p>
              </div>
            </div>

            {/* Platforms Icons */}
            <div className="flex shrink-0 items-center gap-1.5">
              {campaign.requiredNetworks.slice(0, 3).map((platform) => {
                const { icon: Icon, label } = platformIconMap[platform];

                return (
                  <div
                    key={platform}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-white/12 bg-white/10 text-white/78 transition-all group-hover:bg-white/20"
                    title={label}
                    aria-label={label}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                );
              })}
              {campaign.requiredNetworks.length > 3 && (
                <span className="ml-1 text-xs font-semibold text-white/60">
                  +{campaign.requiredNetworks.length - 3}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4 p-4">
          {/* Title & Description */}
          <div>
            <h3 className="text-lg font-bold leading-tight tracking-[-0.02em] text-[#0F0F14]">
              {campaign.title}
            </h3>
            <p className="mt-1.5 line-clamp-2 text-sm leading-5 text-[#4A4A5A]">
              {campaign.description}
            </p>
          </div>

          {/* Reward & Status Row */}
          <div className="flex items-center justify-between gap-2">
            <div className="rounded-full border border-[#DCE7FF] bg-[#EEF3FF] px-3 py-1.5 text-xs font-bold text-[#0047FF]">
              {formatReward(campaign.rewardType, campaign.rewardAmount)}
            </div>
            <Badge
              variant={isApplied ? "success" : "secondary"}
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]",
                !isApplied && "bg-[#F2F7FF] text-[#0047FF]",
              )}
            >
              {statusText}
            </Badge>
          </div>

          {/* Budget Info */}
          <div className="rounded-[14px] border border-[#E7EDF8] bg-[linear-gradient(180deg,#FBFCFF_0%,#F6F9FF_100%)] p-3">
            <div className="flex items-end justify-between gap-3 text-sm">
              <div>
                <p className="text-xs font-medium text-[#9898AA] mb-1">
                  Budget restant
                </p>
                <p className="font-semibold text-[#0F0F14]">
                  <span className="text-[#0047FF]">
                    ${(campaign.budgetRemaining / 1000).toFixed(0)}K
                  </span>
                  {" / "}
                  <span className="text-[#4A4A5A]">
                    ${(campaign.budgetTotal / 1000).toFixed(0)}K
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#0047FF]">
                  {campaign.participantCount ?? 0}
                </p>
                <p className="text-[10px] text-[#9898AA]">personnes</p>
              </div>
            </div>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[#E1E6F0]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#0047FF_0%,#1886FF_55%,#18C987_100%)] transition-all duration-500"
                style={{ width: `${progressWidth}%` }}
              />
            </div>
          </div>

          {/* CTA */}
          <div className="flex items-center justify-between gap-3 border-t border-[#EEF1F6] pt-3">
            <div>
              <p className="text-sm font-semibold text-[#0F0F14]">
                Voir la campagne
              </p>
              <p className="text-xs text-[#4A4A5A]">
                Brief, exigences & ressources
              </p>
            </div>
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#0047FF] text-white shadow-[0_12px_20px_rgba(0,71,255,0.20)] transition-all group-hover:h-10 group-hover:w-10">
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </Card>

      <CampaignDetailDialog
        campaign={campaign}
        isApplied={isApplied}
        onApply={(campaignId) => {
          onApply(campaignId);
          setOpen(false);
        }}
      />
    </Dialog>
  );
}
