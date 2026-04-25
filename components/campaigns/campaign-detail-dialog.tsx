"use client";

import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  CampaignCardData,
  formatCurrency,
  formatDate,
  formatNumber,
  formatReward,
  getBudgetRemainingPercent,
  getCompanyMonogram,
  platformIconMap,
  toneStyles,
} from "@/components/campaigns/campaign-shared";
import {
  CheckCircle2,
  ExternalLink,
  Link2,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface CampaignDetailDialogProps {
  campaign: CampaignCardData;
  isApplied: boolean;
  onApply: (campaignId: string) => void;
}

function SectionTitle({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9898AA]">
        <Icon className="h-3.5 w-3.5 text-[#0047FF]" />
        <span>{title}</span>
      </div>
      {subtitle ? <p className="text-sm text-[#4A4A5A]">{subtitle}</p> : null}
    </div>
  );
}

function InfoCard({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: "primary" | "default";
}) {
  return (
    <div className="rounded-[18px] border border-[#E4EAF3] bg-[#FBFCFF] p-4 shadow-[0_10px_24px_rgba(15,15,20,0.03)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9898AA]">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 text-base font-semibold text-[#0F0F14]",
          emphasis === "primary" && "text-[#0047FF]",
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function CampaignDetailDialog({
  campaign,
  isApplied,
  onApply,
}: CampaignDetailDialogProps) {
  const tone = toneStyles[campaign.tone];
  const remainingPercent = getBudgetRemainingPercent(
    campaign.budgetRemaining,
    campaign.budgetTotal,
  );

  return (
    <DialogContent className="max-h-[calc(100vh-1rem)] p-0 sm:max-h-[calc(100vh-2rem)] sm:max-w-[760px]">
      <div className="flex max-h-[calc(100vh-1rem)] flex-col bg-[#F8F9FC] sm:max-h-[calc(100vh-2rem)]">
        <div className="overflow-y-auto">
          <div
            className={cn(
              "relative overflow-hidden px-5 pb-4 pt-5 sm:px-6",
              tone.hero,
            )}
          >
            <div
              className={cn(
                "absolute -right-12 -top-10 h-32 w-32 rounded-full blur-3xl",
                tone.glow,
              )}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0))]" />
            <div className="relative">
              {/* Top badges */}
              <div className="mb-3 flex flex-wrap items-center gap-1.5">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/92">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.20)]" />
                  {isApplied ? "Candidature envoyee" : "Actif"}
                </div>
                <div className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-medium text-white/80">
                  {campaign.objective}
                </div>
              </div>

              {/* Main content */}
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-14 w-14 shrink-0 items-center justify-center rounded-[16px] border text-sm font-bold uppercase text-white backdrop-blur",
                    tone.plate,
                  )}
                >
                  {getCompanyMonogram(campaign.company)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-semibold text-white/90">
                      {campaign.company}
                    </p>
                    {campaign.companyVerified && (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-white/70" />
                    )}
                  </div>
                  <DialogTitle className="mt-1 text-[1.65rem] leading-tight text-white">
                    {campaign.title}
                  </DialogTitle>
                  <DialogDescription className="mt-1 line-clamp-2 text-[13px] text-white/72">
                    {campaign.description}
                  </DialogDescription>
                </div>
              </div>

              {/* Key infos */}
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <div className="rounded-[14px] border border-white/10 bg-white/5 px-3 py-2.5 backdrop-blur">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/50">
                    Recompense
                  </p>
                  <p className="mt-1 text-sm font-bold text-white">
                    {formatReward(campaign.rewardType, campaign.rewardAmount)}
                  </p>
                </div>
                <div className="rounded-[14px] border border-white/10 bg-white/5 px-3 py-2.5 backdrop-blur">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/50">
                    Fin de campagne
                  </p>
                  <p className="mt-1 text-sm font-bold text-white">
                    {formatDate(campaign.endDate)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 px-5 pb-6 pt-5 sm:px-6">
            {/* Infos rapides */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-[14px] border border-[#E4EAF3] bg-white p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9898AA]">
                  Type
                </p>
                <p className="mt-1 text-xs font-semibold text-[#0F0F14]">
                  {campaign.campaignType}
                </p>
              </div>
              <div className="rounded-[14px] border border-[#E4EAF3] bg-white p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9898AA]">
                  Niche
                </p>
                <p className="mt-1 text-xs font-semibold text-[#0F0F14]">
                  {campaign.niche}
                </p>
              </div>
              <div className="rounded-[14px] border border-[#E4EAF3] bg-white p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9898AA]">
                  Min abonnes
                </p>
                <p className="mt-1 text-xs font-semibold text-[#0047FF]">
                  {formatNumber(campaign.minFollowers)}
                </p>
              </div>
              <div className="rounded-[14px] border border-[#E4EAF3] bg-white p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9898AA]">
                  Max contenus
                </p>
                <p className="mt-1 text-xs font-semibold text-[#0047FF]">
                  {campaign.maxDeliverablesPerCreator}
                </p>
              </div>
            </div>

            {/* Exigences Creatives */}
            {campaign.requirements.length > 0 && (
              <div className="rounded-[14px] border border-[#E4EAF3] bg-white p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9898AA]">
                  Exigences creatives
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[#0F0F14]">
                  {campaign.requirements.join(" • ")}
                </p>
              </div>
            )}

            {/* Plateformes */}
            <div className="rounded-[14px] border border-[#E4EAF3] bg-white p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9898AA] mb-2">
                Plateformes requises
              </p>
              <div className="flex flex-wrap gap-2">
                {campaign.requiredNetworks.map((platform) => {
                  const { icon: Icon } = platformIconMap[platform];
                  return (
                    <div
                      key={platform}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-[#E4EAF3] bg-[#F9FAFF] text-[#0047FF]"
                      title={platform}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ressources */}
            {campaign.resources.length > 0 && (
              <div className="rounded-[14px] border border-[#E4EAF3] bg-white p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9898AA] mb-2">
                  Ressources
                </p>
                <div className="space-y-2">
                  {campaign.resources.map((resource) => (
                    <a
                      key={resource.url}
                      href={resource.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center justify-between gap-2 rounded-[10px] border border-[#E7EDF8] bg-[#FBFCFF] px-3 py-2 transition-all hover:border-[#BFD3FF] hover:bg-[#F0F5FF]"
                    >
                      <span className="truncate text-xs font-medium text-[#0F0F14]">
                        {resource.label}
                      </span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[#0047FF]" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="border-t border-[#E4EAF3] bg-white/92 p-4 backdrop-blur sm:p-5">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#0F0F14]">
                Ressources et brief inclus dans cette campagne
              </p>
              <p className="text-xs text-[#4A4A5A]">
                Verifiez les exigences puis postulez en un clic.
              </p>
            </div>
            <Button
              className="h-12 w-full rounded-[14px] bg-[linear-gradient(90deg,#0047FF_0%,#1787FF_52%,#1CCF86_100%)] px-6 text-base font-semibold shadow-[0_18px_28px_rgba(0,71,255,0.18)] hover:opacity-95 sm:w-auto"
              disabled={isApplied}
              onClick={() => onApply(campaign.id)}
            >
              {isApplied ? "Candidature envoyee" : "Postuler"}
            </Button>
          </div>
        </DialogFooter>
      </div>
    </DialogContent>
  );
}
