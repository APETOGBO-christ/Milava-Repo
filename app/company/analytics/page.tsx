'use client';

import { useStore } from '@/store/useStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, Eye, MousePointerClick, DollarSign } from 'lucide-react';

export default function CompanyAnalytics() {
  const { currentUser } = useStore();

  if (!currentUser) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-[#0F0F14]">Analytics Globaux</h1>
        <p className="text-[#4A4A5A]">Aperçu des performances de toutes vos campagnes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#0F0F14] text-white border-none">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-8">
              <div className="p-3 bg-white/10 rounded-xl">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Budget Total Dépensé</p>
              <h2 className="text-4xl font-bold font-display">$1,250.00</h2>
            </div>
            <div className="mt-6 pt-6 border-t border-white/10 flex items-center gap-2 text-green-400">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">+15% ce mois</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-8">
              <div className="p-3 bg-blue-50 rounded-xl">
                <Eye className="w-6 h-6 text-[#0047FF]" />
              </div>
            </div>
            <div>
              <p className="text-sm text-[#4A4A5A] mb-1">Vues Totales Générées</p>
              <h2 className="text-4xl font-bold font-display text-[#0F0F14]">145k</h2>
            </div>
            <div className="mt-6 pt-6 border-t border-[#E4E4EA] flex items-center gap-2 text-green-600">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">+22% ce mois</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-8">
              <div className="p-3 bg-blue-50 rounded-xl">
                <MousePointerClick className="w-6 h-6 text-[#0047FF]" />
              </div>
            </div>
            <div>
              <p className="text-sm text-[#4A4A5A] mb-1">Clics Totaux (Trafic)</p>
              <h2 className="text-4xl font-bold font-display text-[#0F0F14]">3.2k</h2>
            </div>
            <div className="mt-6 pt-6 border-t border-[#E4E4EA] flex items-center gap-2 text-green-600">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">+8% ce mois</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performances par réseau social</CardTitle>
          <CardDescription>Répartition des vues et de l&apos;engagement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-[#0F0F14]">TikTok</span>
                <span className="text-[#4A4A5A]">65% (94k vues)</span>
              </div>
              <div className="h-3 w-full bg-[#E4E4EA] rounded-full overflow-hidden">
                <div className="h-full bg-[#0047FF]" style={{ width: '65%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-[#0F0F14]">Instagram</span>
                <span className="text-[#4A4A5A]">25% (36k vues)</span>
              </div>
              <div className="h-3 w-full bg-[#E4E4EA] rounded-full overflow-hidden">
                <div className="h-full bg-[#0047FF]" style={{ width: '25%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-[#0F0F14]">X (Twitter)</span>
                <span className="text-[#4A4A5A]">10% (15k vues)</span>
              </div>
              <div className="h-3 w-full bg-[#E4E4EA] rounded-full overflow-hidden">
                <div className="h-full bg-[#0047FF]" style={{ width: '10%' }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
