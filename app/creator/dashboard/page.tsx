'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  CampaignCard,
  type CampaignCardData,
} from '@/components/campaigns/campaign-card';
import { useStore } from '@/store/useStore';
import { CircleHelp, Search } from 'lucide-react';

const mockCampaigns: CampaignCardData[] = [
  {
    id: 'c1',
    company: 'Tech Africa',
    title: 'Lancement express de Milava Delivery',
    description:
      'Creer un contenu mobile-first qui montre la rapidite du service et pousse au clic vers l application.',
    objective: 'Trafic',
    rewardType: 'Flat Rate',
    rewardAmount: 50,
    budgetTotal: 750,
    budgetRemaining: 500,
    endDate: '2026-04-15',
    requiredNetworks: ['Instagram', 'TikTok'],
    tone: 'electric',
    campaignType: 'Launch UGC',
    niche: 'Livraison',
    requirements: ['Format vertical', 'Montrer l app', 'Call-to-action clair'],
    resources: [
      { label: 'Landing page Milava Delivery', url: 'https://milava.app/resources/delivery-brief' },
      { label: 'Pack visuel campagne', url: 'https://milava.app/resources/delivery-assets' },
    ],
    minFollowers: 3500,
    maxDeliverablesPerCreator: 2,
    maxPayoutAmount: 100,
    companyVerified: true,
    isFeatured: true,
  },
  {
    id: 'c2',
    company: 'Senegal Cosmetiques',
    title: 'Routine beaute naturelle 3 gestes',
    description:
      'Produire un format video inspire et credible qui valorise la texture, la routine et le resultat final.',
    objective: 'Notoriete',
    rewardType: 'CPM',
    rewardAmount: 1.5,
    budgetTotal: 1800,
    budgetRemaining: 1200,
    endDate: '2026-05-01',
    requiredNetworks: ['TikTok', 'Instagram', 'YouTube'],
    tone: 'studio',
    campaignType: 'Routine beaute',
    niche: 'Beaute',
    requirements: ['Avant / apres', 'Lumiere naturelle', 'Sous-titres FR'],
    resources: [
      { label: 'Guide produit Instagram', url: 'https://milava.app/resources/cosmetics-instagram' },
      { label: 'Bibliotheque photo marque', url: 'https://milava.app/resources/cosmetics-assets' },
      { label: 'FAQ ingredients', url: 'https://milava.app/resources/cosmetics-faq' },
    ],
    minFollowers: 5000,
    maxDeliverablesPerCreator: 3,
    maxPayoutAmount: 320,
    companyVerified: true,
    statusLabel: 'Selection ouverte',
  },
  {
    id: 'c3',
    company: 'Nova Finances',
    title: 'Serie courte pour generer des leads qualifies',
    description:
      'Mettre en avant une promesse simple, rassurer sur la fiabilite de l offre et generer des demandes concretes.',
    objective: 'Leads',
    rewardType: 'CPL',
    rewardAmount: 4,
    budgetTotal: 950,
    budgetRemaining: 340,
    endDate: '2026-04-06',
    requiredNetworks: ['Facebook', 'Instagram', 'X'],
    tone: 'spotlight',
    campaignType: 'Lead generation',
    niche: 'Finance',
    requirements: ['Message rassurant', 'Aucune promesse exageree', 'Lien tracke obligatoire'],
    resources: [
      { label: 'Presentation offre Nova', url: 'https://milava.app/resources/nova-offer' },
      { label: 'Arguments de confiance', url: 'https://milava.app/resources/nova-trust' },
    ],
    minFollowers: 2500,
    maxDeliverablesPerCreator: 1,
    maxPayoutAmount: 180,
    companyVerified: true,
    statusLabel: 'Fin bientot',
    endingSoon: true,
  },
];

export default function CreatorDashboard() {
  const { currentUser } = useStore();
  const [applied, setApplied] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [nicheFilter, setNicheFilter] = useState('all');

  const nicheOptions = ['all', ...new Set(mockCampaigns.map((campaign) => campaign.niche))];

  const filteredCampaigns = mockCampaigns.filter((campaign) => {
    const query = searchQuery.trim().toLowerCase();
    const searchableText = [
      campaign.title,
      campaign.company,
      campaign.description,
      campaign.niche,
      campaign.campaignType,
    ]
      .join(' ')
      .toLowerCase();

    const matchesSearch = query.length === 0 || searchableText.includes(query);
    const matchesNiche = nicheFilter === 'all' || campaign.niche === nicheFilter;

    return matchesSearch && matchesNiche;
  });
  const handleApply = (id: string) => {
    setApplied((current) => (current.includes(id) ? current : [...current, id]));
  };

  const resetFilters = () => {
    setSearchQuery('');
    setNicheFilter('all');
  };

  return (
    <div className="space-y-8">
      <section className="rounded-[20px] border border-[#D8E2EE] bg-[#EDF3F8] p-4 sm:p-5">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[2rem] font-bold tracking-[-0.04em] text-[#0F0F14] font-display sm:text-[2.2rem]">
              Campagnes
            </h1>
            <button
              type="button"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-[#C7DCF9] bg-[#F7FBFF] px-4 text-sm font-semibold text-[#0047FF] transition-colors hover:bg-white"
            >
              <CircleHelp className="h-4 w-4" />
              Comment fonctionne le paiement
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr),210px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#9898AA]" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Rechercher une campagne"
                className="h-12 rounded-[14px] border-[#E4E4EA] bg-white pl-11"
              />
            </div>

            <select
              value={nicheFilter}
              onChange={(event) => setNicheFilter(event.target.value)}
              className="h-12 w-full rounded-[14px] border border-[#E4E4EA] bg-white px-4 text-sm font-semibold text-[#0F0F14] outline-none transition-colors focus:border-[#0047FF]"
            >
              <option value="all">Niche: Tout</option>
              {nicheOptions
                .filter((value) => value !== 'all')
                .map((niche) => (
                  <option key={niche} value={niche}>
                    Niche: {niche}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </section>

      {filteredCampaigns.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-[#D6DCE8] bg-white px-6 py-12 text-center shadow-[0_12px_30px_rgba(15,15,20,0.04)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9898AA]">
            Marketplace
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-[-0.03em] text-[#0F0F14] font-display">
            Aucune campagne ne correspond
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#4A4A5A]">
            Essaie une autre recherche ou reinitialise les filtres pour retrouver plus
            d opportunites.
          </p>
          <Button className="mt-6 h-11 rounded-[14px]" onClick={resetFilters}>
            Voir toutes les campagnes
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredCampaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              isApplied={applied.includes(campaign.id)}
              onApply={handleApply}
            />
          ))}
        </div>
      )}
    </div>
  );
}
