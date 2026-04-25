"use client";

import Link from "next/link";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import {
  type CampaignPlatform,
  getBudgetRemainingPercent,
  getCompanyMonogram,
  platformIconMap,
} from "@/components/campaigns/campaign-shared";

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function formatBudget(value: number) {
  return usdFormatter.format(Math.max(0, value));
}

interface UnifiedCampaignCardProps {
  company: string;
  niche: string;
  title: string;
  description: string;
  mode: string;
  rate: string;
  unit: string;
  networks: string[];
  hot?: boolean;
  budgetRemaining: number;
  budgetTotal: number;
  budgetRemainingLabel?: string;
  budgetTotalLabel?: string;
  participantCount?: number;
  variant: "showcase" | "marketplace";
  href?: string;
  isApplied?: boolean;
  isApplying?: boolean;
  applyDisabled?: boolean;
  onViewDetails?: () => void;
  onApply?: () => void;
}

export function UnifiedCampaignCard({
  company,
  niche,
  title,
  description,
  mode: _mode,
  rate,
  unit,
  networks,
  hot,
  budgetRemaining,
  budgetTotal,
  budgetRemainingLabel,
  budgetTotalLabel,
  participantCount = 0,
  variant,
  href,
  isApplied = false,
  isApplying = false,
  applyDisabled = false,
  onViewDetails,
  onApply,
}: UnifiedCampaignCardProps) {
  const isMarketplaceInteractive = variant === "marketplace" && Boolean(onViewDetails);
  const remainingPercent = getBudgetRemainingPercent(budgetRemaining, budgetTotal);
  const progressWidth = remainingPercent === 0 ? 0 : Math.max(12, remainingPercent);
  const remainingText = budgetRemainingLabel ?? formatBudget(budgetRemaining);
  const totalText = budgetTotalLabel ?? formatBudget(budgetTotal);
  const participants = Math.max(0, participantCount);
  const normalizedUnit = unit.trim().startsWith("/") ? `/ ${unit.trim().slice(1)}` : unit;

  const handleCardClick = () => {
    if (isMarketplaceInteractive) {
      onViewDetails?.();
    }
  };

  const handleCardKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (!isMarketplaceInteractive) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onViewDetails?.();
    }
  };

  const statusBadge = isApplied ? (
    <span className="text-xs font-bold text-white bg-green-600 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
      <Check className="w-3 h-3" />
      Candidat
    </span>
  ) : hot ? (
    <span className="text-xs font-bold text-white bg-amber-500 px-3 py-1 rounded-full">
      Tendance
    </span>
  ) : (
    <span className="text-xs font-bold text-[#0047FF] bg-[#0047FF]/10 px-3 py-1 rounded-full">
      ACTIF
    </span>
  );

  const content = (
    <>
      <div className="bg-gradient-to-r from-slate-700 via-slate-600 to-blue-700 px-6 py-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
              {getCompanyMonogram(company)}
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-base truncate">{company}</p>
              <p className="text-white/70 text-xs truncate">{niche}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {networks.slice(0, 3).map((platform, index) => {
              const iconData = platformIconMap[platform as CampaignPlatform];
              if (!iconData) {
                return (
                  <div
                    key={`${platform}-${index}`}
                    className="w-9 h-9 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white text-[10px] font-bold"
                    title={platform}
                    aria-label={platform}
                  >
                    {platform.charAt(0).toUpperCase() || "?"}
                  </div>
                );
              }

              const Icon = iconData.icon;
              return (
                <div
                  key={`${platform}-${index}`}
                  className="w-9 h-9 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white"
                  title={iconData.label}
                  aria-label={iconData.label}
                >
                  <Icon className="w-4 h-4" />
                </div>
              );
            })}
            {networks.length > 3 ? (
              <span className="text-white/80 text-xs font-semibold">+{networks.length - 3}</span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="px-6 py-6 flex flex-col h-full gap-6">
        <div>
          <h3 className="text-[#0F0F14] font-bold text-base leading-tight mb-2">
            {title}
          </h3>
          <p className="text-[#6B7280] text-sm line-clamp-2">{description}</p>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#C7D3EA] bg-[#E6ECF7] px-3.5 py-1.5">
            <p className="text-[#0047FF] font-bold text-lg leading-none">
              {rate}
              <span className="text-sm font-semibold ml-1 text-[#0047FF]">{normalizedUnit}</span>
            </p>
          </div>
          {statusBadge}
        </div>

        <div className="space-y-2">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs text-[#6B7280] font-medium">Budget restant</p>
              <p className="text-sm font-semibold text-[#0F0F14]">
                <span className="text-[#0047FF]">{remainingText}</span>
                <span className="text-[#6B7280]"> / {totalText}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-[#0047FF]">
                {participants.toLocaleString("fr-FR")}
              </p>
              <p className="text-[10px] text-[#6B7280]">
                {participants > 1 ? "personnes" : "personne"}
              </p>
            </div>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#0047FF] via-cyan-400 to-[#10B981] transition-all duration-500"
              style={{ width: `${progressWidth}%` }}
            />
          </div>
        </div>

        {variant === "showcase" ? (
          <div className="flex items-center justify-between mt-auto pt-4 border-t border-black/[0.06]">
            <div>
              <p className="text-[#0F0F14] font-bold text-sm">Voir la campagne</p>
              <p className="text-[#6B7280] text-xs">Details et exigences</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#0047FF] flex items-center justify-center text-white flex-shrink-0">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between mt-auto pt-4 border-t border-black/[0.06] gap-3">
            <p className="text-[#6B7280] text-xs font-medium">Cliquez pour voir details</p>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onApply?.();
              }}
              disabled={applyDisabled}
              className="h-10 px-4 rounded-lg bg-[#0047FF] text-white text-sm font-semibold hover:bg-[#0038CC] disabled:bg-gray-400 transition-colors inline-flex items-center justify-center gap-2 flex-shrink-0"
            >
              {isApplying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Postuler</span>
                </>
              ) : isApplied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Postule</span>
                </>
              ) : (
                <span>Postuler</span>
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );

  const cardClassName =
    "group relative flex flex-col h-full bg-white rounded-xl overflow-hidden border border-black/[0.08] hover:border-black/[0.12] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-200";

  if (variant === "showcase" && href) {
    return (
      <Link href={href} className={cardClassName}>
        {content}
      </Link>
    );
  }

  return (
    <article
      className={`${cardClassName} ${
        isMarketplaceInteractive
          ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047FF]"
          : ""
      }`}
      role={isMarketplaceInteractive ? "button" : undefined}
      tabIndex={isMarketplaceInteractive ? 0 : undefined}
      onClick={isMarketplaceInteractive ? handleCardClick : undefined}
      onKeyDown={isMarketplaceInteractive ? handleCardKeyDown : undefined}
    >
      {content}
    </article>
  );
}
