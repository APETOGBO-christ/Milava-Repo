import type { LucideIcon } from 'lucide-react';
import { Facebook, Ghost, Instagram, Music2, Twitter, Youtube } from 'lucide-react';

export type CampaignPlatform =
  | 'TikTok'
  | 'Instagram'
  | 'YouTube'
  | 'Facebook'
  | 'X'
  | 'Snapchat';

export type CampaignRewardType = 'Flat Rate' | 'CPM' | 'CPC' | 'CPL' | 'CPA';
export type CampaignTone = 'electric' | 'studio' | 'spotlight';

export interface CampaignResourceLink {
  label: string;
  url: string;
}

export interface CampaignCardData {
  id: string;
  company: string;
  title: string;
  description: string;
  objective: 'Notoriete' | 'Trafic' | 'Leads' | 'Ventes';
  rewardType: CampaignRewardType;
  rewardAmount: number;
  budgetRemaining: number;
  budgetTotal: number;
  endDate: string;
  requiredNetworks: CampaignPlatform[];
  tone: CampaignTone;
  campaignType: string;
  niche: string;
  requirements: string[];
  resources: CampaignResourceLink[];
  minFollowers: number;
  maxDeliverablesPerCreator: number;
  maxPayoutAmount: number;
  companyVerified?: boolean;
  statusLabel?: string;
  isFeatured?: boolean;
  endingSoon?: boolean;
}

export const toneStyles: Record<
  CampaignTone,
  {
    hero: string;
    glow: string;
    plate: string;
  }
> = {
  electric: {
    hero:
      'bg-[radial-gradient(circle_at_18%_18%,rgba(82,168,255,0.34),transparent_32%),radial-gradient(circle_at_88%_8%,rgba(0,71,255,0.22),transparent_28%),linear-gradient(135deg,#081427_0%,#102447_48%,#0F0F14_100%)]',
    glow: 'bg-[#58A6FF]/28',
    plate: 'border-white/10 bg-white/10',
  },
  studio: {
    hero:
      'bg-[radial-gradient(circle_at_20%_16%,rgba(116,197,255,0.30),transparent_30%),radial-gradient(circle_at_82%_16%,rgba(0,71,255,0.18),transparent_24%),linear-gradient(135deg,#0B172D_0%,#18284A_40%,#0F0F14_100%)]',
    glow: 'bg-[#8DD0FF]/24',
    plate: 'border-white/12 bg-white/12',
  },
  spotlight: {
    hero:
      'bg-[radial-gradient(circle_at_18%_14%,rgba(148,214,255,0.30),transparent_28%),radial-gradient(circle_at_82%_10%,rgba(0,71,255,0.24),transparent_32%),linear-gradient(140deg,#101826_0%,#162843_44%,#111827_100%)]',
    glow: 'bg-[#0047FF]/24',
    plate: 'border-white/10 bg-white/10',
  },
};

export const platformIconMap: Record<
  CampaignPlatform,
  { icon: LucideIcon; label: string }
> = {
  Instagram: { icon: Instagram, label: 'Instagram' },
  TikTok: { icon: Music2, label: 'TikTok' },
  YouTube: { icon: Youtube, label: 'YouTube' },
  Facebook: { icon: Facebook, label: 'Facebook' },
  X: { icon: Twitter, label: 'X' },
  Snapchat: { icon: Ghost, label: 'Snapchat' },
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat('fr-FR');

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const rewardLabelMap: Record<CampaignRewardType, string> = {
  'Flat Rate': '/ post',
  CPM: '/ CPM',
  CPC: '/ clic',
  CPL: '/ lead',
  CPA: '/ vente',
};

function parseDate(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

export function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

export function formatNumber(value: number) {
  return numberFormatter.format(value);
}

export function formatDate(date: string) {
  return dateFormatter.format(parseDate(date));
}

export function formatReward(rewardType: CampaignRewardType, rewardAmount: number) {
  return `${formatCurrency(rewardAmount)} ${rewardLabelMap[rewardType]}`;
}

export function getBudgetRemainingPercent(remaining: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, (remaining / total) * 100));
}

export function getCompanyMonogram(company: string) {
  const letters = company
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return letters || 'MV';
}
