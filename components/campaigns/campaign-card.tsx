'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { CampaignDetailDialog } from '@/components/campaigns/campaign-detail-dialog';
import {
  CampaignCardData,
  formatCurrency,
  formatDate,
  formatReward,
  getBudgetRemainingPercent,
  getCompanyMonogram,
  platformIconMap,
  toneStyles,
} from '@/components/campaigns/campaign-shared';
import { ArrowUpRight, Building2 } from 'lucide-react';

interface CampaignCardProps {
  campaign: CampaignCardData;
  isApplied: boolean;
  onApply: (campaignId: string) => void;
}

export type { CampaignCardData } from '@/components/campaigns/campaign-shared';

export function CampaignCard({
  campaign,
  isApplied,
  onApply,
}: CampaignCardProps) {
  const [open, setOpen] = useState(false);
  const tone = toneStyles[campaign.tone];
  const remainingPercent = getBudgetRemainingPercent(
    campaign.budgetRemaining,
    campaign.budgetTotal
  );
  const progressWidth =
    remainingPercent === 0 ? 0 : Math.max(12, remainingPercent);
  const statusText = isApplied
    ? 'Candidature envoyee'
    : campaign.statusLabel ?? 'Actif';

  const openDialog = () => setOpen(true);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
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
        <div className={cn('relative overflow-hidden px-4 pb-4 pt-3', tone.hero)}>
          <div
            className={cn(
              'absolute -right-8 -top-8 h-24 w-24 rounded-full blur-3xl transition-transform duration-300 group-hover:translate-x-[-4px]',
              tone.glow
            )}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0))]" />

          <div className="relative space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/90">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.20)]" />
                Actif
              </div>
              <div className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-white/82">
                {campaign.objective}
              </div>
            </div>

            <div className="flex items-end justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border text-sm font-bold uppercase text-white',
                    tone.plate
                  )}
                >
                  {getCompanyMonogram(campaign.company)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-white/62">
                    <Building2 className="h-3.5 w-3.5" />
                    <span>{campaign.isFeatured ? 'En vedette' : 'Entreprise'}</span>
                  </div>
                  <p className="truncate text-base font-semibold text-white">
                    {campaign.company}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {campaign.requiredNetworks.slice(0, 3).map((platform) => {
                  const { icon: Icon, label } = platformIconMap[platform];

                  return (
                    <div
                      key={platform}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-white/12 bg-white/10 text-white/78"
                      title={label}
                      aria-label={label}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-4">
          <div className="space-y-2">
            <h3 className="text-xl font-bold leading-[1.08] tracking-[-0.03em] text-[#0F0F14] font-display">
              {campaign.title}
            </h3>
            <p className="h-10 overflow-hidden text-sm leading-5 text-[#4A4A5A]">
              {campaign.description}
            </p>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="rounded-full border border-[#DCE7FF] bg-[#EEF3FF] px-3 py-2 text-sm font-bold text-[#0047FF]">
              {formatReward(campaign.rewardType, campaign.rewardAmount)}
            </div>
            <Badge
              variant={isApplied ? 'success' : 'secondary'}
              className={cn(
                'rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]',
                !isApplied && 'bg-[#F2F7FF] text-[#0047FF]'
              )}
            >
              {statusText}
            </Badge>
          </div>

          <div className="space-y-2 rounded-[16px] border border-[#E7EDF8] bg-[linear-gradient(180deg,#FBFCFF_0%,#F6F9FF_100%)] p-3.5">
            <div className="flex items-center justify-between gap-3 text-[13px]">
              <p className="font-medium text-[#4A4A5A]">
                <span className="font-bold text-[#0047FF]">
                  {formatCurrency(campaign.budgetRemaining)}
                </span>{' '}
                sur{' '}
                <span className="font-semibold text-[#0F0F14]">
                  {formatCurrency(campaign.budgetTotal)}
                </span>{' '}
                encore disponible
              </p>
              <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.14em] text-[#9898AA]">
                {remainingPercent.toFixed(0)}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#E1E6F0]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#0047FF_0%,#1886FF_55%,#18C987_100%)] transition-all duration-500"
                style={{ width: `${progressWidth}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[14px] border border-[#E4E4EA] bg-[#FAFBFD] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9898AA]">
                Fin
              </p>
              <p className="mt-2 text-sm font-semibold text-[#0F0F14]">
                {formatDate(campaign.endDate)}
              </p>
            </div>
            <div className="rounded-[14px] border border-[#E4E4EA] bg-[#FAFBFD] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9898AA]">
                Ressources
              </p>
              <p className="mt-2 text-sm font-semibold text-[#0F0F14]">
                {campaign.resources.length} lien{campaign.resources.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-[#EEF1F6] pt-4">
            <div>
              <p className="text-sm font-semibold text-[#0F0F14]">Voir la campagne</p>
              <p className="text-xs text-[#4A4A5A]">Brief, exigences et ressources inclus</p>
            </div>
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#0047FF] text-white shadow-[0_14px_24px_rgba(0,71,255,0.22)]">
              <ArrowUpRight className="h-4 w-4" />
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
