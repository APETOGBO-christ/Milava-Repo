"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useCampaigns } from "@/hooks/use-campaigns";
import { usePosts } from "@/hooks/use-posts";
import { Campaign } from "@/lib/supabase/campaigns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Link as LinkIcon,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default function SubmitPostPage() {
  const { authUser } = useAuth();
  const params = useParams();
  const router = useRouter();
  const campaignId = params.campaignId as string;

  const { getCampaign } = useCampaigns();
  const { submitPost } = usePosts();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [contentUrl, setContentUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [campaignLoading, setCampaignLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submittedPostId, setSubmittedPostId] = useState<string | null>(null);

  // Load campaign data
  useEffect(() => {
    const loadCampaign = async () => {
      if (!campaignId) return;
      try {
        const campaignData = await getCampaign(campaignId);
        setCampaign(campaignData);
      } catch (err) {
        setError("Impossible de charger la campagne");
      } finally {
        setCampaignLoading(false);
      }
    };

    loadCampaign();
  }, [campaignId, getCampaign]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!authUser || !campaign) {
      setError("Informations utilisateur manquantes");
      return;
    }

    if (!contentUrl.trim()) {
      setError("Veuillez entrer l&apos;URL du contenu");
      return;
    }

    // Validate URL
    try {
      new URL(contentUrl);
    } catch {
      setError("L&apos;URL du contenu n&apos;est pas valide");
      return;
    }

    setLoading(true);
    try {
      const post = await submitPost(campaignId, authUser.id, contentUrl);
      setSubmittedPostId(post.id);
      setSuccess(true);
      setContentUrl("");

      // Auto-redirect after 2 seconds
      setTimeout(() => {
        router.push("/creator/analytics");
      }, 2000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur lors de la soumission";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (campaignLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900">
                  Campagne introuvable
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  Cette campagne n&apos;existe pas ou a été supprimée.
                </p>
                <Link href="/creator/marketplace">
                  <Button variant="outline" size="sm" className="mt-4">
                    Retour au marché
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Soumission de contenu</h1>
        <p className="text-gray-600">Partagez votre contenu pour la campagne</p>
      </div>

      {/* Campaign Overview */}
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-lg text-blue-900">
            {campaign.title}
          </CardTitle>
          <CardDescription className="text-blue-700">
            {campaign.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-blue-600 font-medium">Modèle</p>
              <p className="text-lg font-bold text-blue-900">
                {campaign.reward_model}
              </p>
            </div>
            <div>
              <p className="text-sm text-blue-600 font-medium">Tarif</p>
              <p className="text-lg font-bold text-blue-900">
                {campaign.reward_value} FCFA
              </p>
            </div>
          </div>
          {campaign.objectives && (
            <div className="mt-4 p-3 bg-white rounded border border-blue-100">
              <p className="text-sm text-gray-600 font-medium mb-1">
                Objectifs
              </p>
              <p className="text-sm text-gray-700">{campaign.objectives}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submission Form */}
      <Card>
        <CardHeader>
          <CardTitle>Soumettre votre contenu</CardTitle>
          <CardDescription>
            Partagez le lien vers le post ou la vidéo que vous souhaites
            soumettre
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success && submittedPostId && (
            <div className="mb-6 flex gap-3 p-4 bg-green-50 border border-green-200 rounded">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900">
                  Contenu soumis avec succès !
                </p>
                <p className="text-sm text-green-700 mt-1">
                  Votre soumission a été enregistrée. Vous pouvez suivre son
                  statut dans votre tableau de bord analytics.
                </p>
              </div>
            </div>
          )}

          {error && !success && (
            <div className="mb-6 flex gap-3 p-4 bg-red-50 border border-red-200 rounded">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Erreur</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL du contenu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <Input
                  type="url"
                  placeholder="https://tiktok.com/@votre_compte/video/123456789"
                  value={contentUrl}
                  onChange={(e) => setContentUrl(e.target.value)}
                  className="pl-10"
                  disabled={loading || success}
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Entrez l&apos;URL complète de votre post/vidéo
              </p>
            </div>

            <div className="space-y-3">
              <Button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600"
                disabled={loading || success}
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {success ? "Contenu soumis" : "Soumettre le contenu"}
              </Button>

              {success && (
                <Link href="/creator/analytics" className="block">
                  <Button variant="outline" className="w-full">
                    Voir mon tableau de bord
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="mt-6 bg-gray-50">
        <CardHeader>
          <CardTitle className="text-base">
            Conseils pour votre soumission
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-700">
          <div className="flex gap-3">
            <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 text-xs font-bold">
              1
            </div>
            <p>
              Assurez-vous que le contenu respecte les objectifs de la campagne
            </p>
          </div>
          <div className="flex gap-3">
            <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 text-xs font-bold">
              2
            </div>
            <p>Vérifiez que l&apos;URL du post est publique et accessible</p>
          </div>
          <div className="flex gap-3">
            <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 text-xs font-bold">
              3
            </div>
            <p>
              Ne supprimez pas le post après la soumission, nous avons besoin de
              l&apos;accès aux métriques
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
