'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
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
} from '@/components/campaigns/campaign-shared';
import {
  CalendarRange,
  CheckCircle2,
  ExternalLink,
  Link2,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';

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
  icon: typeof Sparkles;
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
  emphasis?: 'primary' | 'default';
}) {
  return (
    <div className="rounded-[18px] border border-[#E4EAF3] bg-[#FBFCFF] p-4 shadow-[0_10px_24px_rgba(15,15,20,0.03)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9898AA]">
        {label}
      </p>
      <p
        className={cn(
          'mt-2 text-base font-semibold text-[#0F0F14]',
          emphasis === 'primary' && 'text-[#0047FF]'
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
    campaign.budgetTotal
  );

  return (
    <DialogContent className="max-h-[calc(100vh-1rem)] p-0 sm:max-h-[calc(100vh-2rem)] sm:max-w-[760px]">
      <div className="flex max-h-[calc(100vh-1rem)] flex-col bg-[#F8F9FC] sm:max-h-[calc(100vh-2rem)]">
        <div className="overflow-y-auto">
          <div className={cn('relative overflow-hidden px-5 pb-6 pt-6 sm:px-6', tone.hero)}>
            <div
              className={cn(
                'absolute -right-12 -top-10 h-32 w-32 rounded-full blur-3xl',
                tone.glow
              )}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0))]" />
            <div className="relative pr-10">
              <DialogHeader className="space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/92">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.20)]" />
                    {isApplied ? 'Candidature envoyee' : 'Actif'}
                  </div>
                  <div className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-white/85">
                    {campaign.objective}
                  </div>
                  {campaign.isFeatured ? (
                    <div className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-white/85">
                      En vedette
                    </div>
                  ) : null}
                </div>

                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      'flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] border text-base font-bold uppercase text-white backdrop-blur',
                      tone.plate
                    )}
                  >
                    {getCompanyMonogram(campaign.company)}
                  </div>

                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-white/72">
                      <span>{campaign.company}</span>
                      {campaign.companyVerified ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[11px] font-medium text-white">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Verifie
                        </span>
                      ) : null}
                    </div>
                    <DialogTitle className="text-[1.9rem] leading-[1.02] text-white sm:text-[2.2rem]">
                      {campaign.title}
                    </DialogTitle>
                    <DialogDescription className="max-w-[620px] text-[15px] leading-7 text-white/78">
                      {campaign.description}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-[18px] border border-white/12 bg-white/10 p-4 backdrop-blur">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/62">
                    Recompense
                  </p>
                  <p className="mt-2 text-lg font-bold text-white">
                    {formatReward(campaign.rewardType, campaign.rewardAmount)}
                  </p>
                </div>
                <div className="rounded-[18px] border border-white/12 bg-white/10 p-4 backdrop-blur">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/62">
                    Fin de campagne
                  </p>
                  <p className="mt-2 text-lg font-bold text-white">
                    {formatDate(campaign.endDate)}
                  </p>
                </div>
                <div className="rounded-[18px] border border-white/12 bg-white/10 p-4 backdrop-blur">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/62">
                    Payout max
                  </p>
                  <p className="mt-2 text-lg font-bold text-white">
                    {formatCurrency(campaign.maxPayoutAmount)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5 px-5 pb-6 pt-5 sm:px-6">
            <div className="rounded-[24px] border border-[#E4EAF3] bg-white p-5 shadow-[0_18px_44px_rgba(15,15,20,0.05)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <SectionTitle
                    icon={Sparkles}
                    title="Budget"
                    subtitle="Un apercu rapide du budget encore disponible sur cette campagne."
                  />
                  <p className="mt-3 text-[15px] font-medium text-[#4A4A5A]">
                    <span className="font-bold text-[#0047FF]">
                      {formatCurrency(campaign.budgetRemaining)}
                    </span>{' '}
                    sur{' '}
                    <span className="font-semibold text-[#0F0F14]">
                      {formatCurrency(campaign.budgetTotal)}
                    </span>{' '}
                    encore disponible
                  </p>
                </div>
                <div className="rounded-full border border-[#DCE7FF] bg-[#F4F8FF] px-3 py-2 text-sm font-semibold text-[#0047FF]">
                  {remainingPercent.toFixed(0)}% restant
                </div>
              </div>

              <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#E5EAF2]">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#0047FF_0%,#1787FF_52%,#1CCF86_100%)] transition-all duration-500"
                  style={{
                    width: `${remainingPercent === 0 ? 0 : Math.max(10, remainingPercent)}%`,
                  }}
                />
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.15fr,0.85fr]">
              <div className="space-y-5">
                <div className="rounded-[24px] border border-[#E4EAF3] bg-white p-5 shadow-[0_18px_44px_rgba(15,15,20,0.05)]">
                  <SectionTitle
                    icon={Target}
                    title="Brief"
                    subtitle="Le positionnement general de la campagne et les attentes de la marque."
                  />

                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <InfoCard label="Type" value={campaign.campaignType} />
                    <InfoCard label="Niche" value={campaign.niche} />
                    <InfoCard label="Plateformes" value={`${campaign.requiredNetworks.length}`} />
                  </div>

                  <div className="mt-5">
                    <p className="text-sm font-semibold text-[#0F0F14]">
                      Exigences creatives
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2.5">
                      {campaign.requirements.map((requirement) => (
                        <Badge
                          key={requirement}
                          variant="outline"
                          className="rounded-[12px] border-[#CFE0FF] bg-[#F6F9FF] px-3 py-2 text-[#0047FF]"
                        >
                          {requirement}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5">
                    <p className="text-sm font-semibold text-[#0F0F14]">
                      Plateformes requises
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2.5">
                      {campaign.requiredNetworks.map((platform) => {
                        const { icon: Icon, label } = platformIconMap[platform];

                        return (
                          <div
                            key={platform}
                            className="inline-flex items-center gap-2 rounded-full border border-[#E4EAF3] bg-[#FAFBFD] px-3 py-2 text-sm font-medium text-[#4A4A5A]"
                          >
                            <Icon className="h-4 w-4 text-[#0047FF]" />
                            <span>{label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-[#E4EAF3] bg-white p-5 shadow-[0_18px_44px_rgba(15,15,20,0.05)]">
                  <SectionTitle
                    icon={Link2}
                    title="Ressources"
                    subtitle="Liens et supports utiles pour produire un contenu coherent avec la campagne."
                  />

                  <div className="mt-4 space-y-3">
                    {campaign.resources.map((resource, index) => (
                      <a
                        key={resource.url}
                        href={resource.url}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex items-center justify-between gap-3 rounded-[18px] border border-[#E7EDF8] bg-[linear-gradient(180deg,#FBFCFF_0%,#F7FAFF_100%)] px-4 py-3 transition-all duration-200 hover:border-[#BFD3FF] hover:shadow-[0_12px_28px_rgba(0,71,255,0.08)]"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#EEF3FF] text-sm font-bold text-[#0047FF]">
                            {index + 1}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[#0F0F14]">
                              {resource.label}
                            </p>
                            <p className="truncate text-xs text-[#4A4A5A]">{resource.url}</p>
                          </div>
                        </div>

                        <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#D9E6FF] bg-white text-[#0047FF] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                          <ExternalLink className="h-4 w-4" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-[24px] border border-[#E4EAF3] bg-white p-5 shadow-[0_18px_44px_rgba(15,15,20,0.05)]">
                  <SectionTitle
                    icon={Users}
                    title="Conditions"
                    subtitle="Les seuils et limites a connaitre avant de postuler."
                  />

                  <div className="mt-4 grid gap-3">
                    <InfoCard
                      label="Min abonnes"
                      value={formatNumber(campaign.minFollowers)}
                    />
                    <InfoCard
                      label="Max contenus"
                      value={formatNumber(campaign.maxDeliverablesPerCreator)}
                    />
                    <InfoCard
                      label="Recompense"
                      value={formatReward(campaign.rewardType, campaign.rewardAmount)}
                      emphasis="primary"
                    />
                    <InfoCard
                      label="Paiement max"
                      value={formatCurrency(campaign.maxPayoutAmount)}
                    />
                  </div>
                </div>

                <div className="rounded-[24px] border border-[#E4EAF3] bg-[linear-gradient(180deg,#FBFCFF_0%,#F7FAFF_100%)] p-5 shadow-[0_18px_44px_rgba(15,15,20,0.05)]">
                  <SectionTitle
                    icon={ShieldCheck}
                    title="Resume rapide"
                    subtitle="Une lecture express de la campagne avant de candidater."
                  />

                  <div className="mt-4 space-y-4">
                    <div className="flex items-center justify-between gap-3 rounded-[18px] border border-[#E4EAF3] bg-white px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF3FF] text-[#0047FF]">
                          <Target className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em] text-[#9898AA]">
                            Objectif
                          </p>
                          <p className="text-sm font-semibold text-[#0F0F14]">
                            {campaign.objective}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-[18px] border border-[#E4EAF3] bg-white px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF3FF] text-[#0047FF]">
                          <CalendarRange className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em] text-[#9898AA]">
                            Fin de campagne
                          </p>
                          <p className="text-sm font-semibold text-[#0F0F14]">
                            {formatDate(campaign.endDate)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[18px] border border-[#D9E6FF] bg-white px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em] text-[#9898AA]">
                            Etat de la campagne
                          </p>
                          <p className="mt-1 text-sm font-semibold text-[#0F0F14]">
                            {isApplied ? 'Votre candidature est en cours.' : 'Vous pouvez postuler des maintenant.'}
                          </p>
                        </div>
                        <div className="rounded-full bg-[#EEF8F2] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">
                          {isApplied ? 'Envoyee' : 'Ouverte'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
              {isApplied ? 'Candidature envoyee' : 'Postuler'}
            </Button>
          </div>
        </DialogFooter>
      </div>
    </DialogContent>
  );
}
