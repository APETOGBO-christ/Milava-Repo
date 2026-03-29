'use client';

import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Users, Eye, MousePointerClick, DollarSign } from 'lucide-react';

const mockMyCampaigns = [
  {
    id: 'c1',
    title: 'Lancement App de Livraison',
    status: 'active',
    budgetSpent: 150,
    budgetTotal: 500,
    applicants: 12,
    approvedCreators: 3,
    views: 45000,
    clicks: 1200,
  },
  {
    id: 'c3',
    title: 'Promo Rentrée Scolaire',
    status: 'draft',
    budgetSpent: 0,
    budgetTotal: 300,
    applicants: 0,
    approvedCreators: 0,
    views: 0,
    clicks: 0,
  }
];

export default function CompanyDashboard() {
  const { currentUser } = useStore();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#0F0F14]">Mes Campagnes</h1>
          <p className="text-[#4A4A5A]">Gérez vos campagnes et suivez vos performances.</p>
        </div>
        <Link href="/company/campaigns/new">
          <Button className="w-full sm:w-auto">
            <PlusCircle className="w-4 h-4 mr-2" />
            Nouvelle Campagne
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <DollarSign className="w-6 h-6 text-[#0047FF] mb-2" />
            <p className="text-2xl font-bold text-[#0F0F14]">$150</p>
            <p className="text-xs text-[#4A4A5A] uppercase tracking-wider">Dépensé</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <Eye className="w-6 h-6 text-[#0047FF] mb-2" />
            <p className="text-2xl font-bold text-[#0F0F14]">45k</p>
            <p className="text-xs text-[#4A4A5A] uppercase tracking-wider">Vues</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <MousePointerClick className="w-6 h-6 text-[#0047FF] mb-2" />
            <p className="text-2xl font-bold text-[#0F0F14]">1.2k</p>
            <p className="text-xs text-[#4A4A5A] uppercase tracking-wider">Clics</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <Users className="w-6 h-6 text-[#0047FF] mb-2" />
            <p className="text-2xl font-bold text-[#0F0F14]">3</p>
            <p className="text-xs text-[#4A4A5A] uppercase tracking-wider">Créateurs</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {mockMyCampaigns.map((campaign) => (
          <Card key={campaign.id} className="hover:border-[#0047FF] transition-colors cursor-pointer">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{campaign.title}</CardTitle>
                <Badge variant={campaign.status === 'active' ? 'success' : 'secondary'}>
                  {campaign.status === 'active' ? 'En cours' : 'Brouillon'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 text-sm text-[#4A4A5A]">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#9898AA]" />
                  <span>
                    <strong className="text-[#0F0F14]">${campaign.budgetSpent}</strong> / ${campaign.budgetTotal}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#9898AA]" />
                  <span>
                    <strong className="text-[#0F0F14]">{campaign.applicants}</strong> candidatures
                  </span>
                </div>
                {campaign.status === 'active' && (
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-[#9898AA]" />
                    <span>
                      <strong className="text-[#0F0F14]">{campaign.views.toLocaleString()}</strong> vues
                    </span>
                  </div>
                )}
              </div>
              
              {/* Progress bar for budget */}
              <div className="mt-4 h-2 w-full bg-[#E4E4EA] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#0047FF]" 
                  style={{ width: `${(campaign.budgetSpent / campaign.budgetTotal) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
