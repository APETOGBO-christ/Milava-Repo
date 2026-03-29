"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useCampaigns } from "@/hooks/use-campaigns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function NewCampaignPage() {
  const router = useRouter();
  const { authUser, userProfile } = useAuth();
  const { createCampaign, loading } = useCampaigns();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    objectives: "",
    budget_total: 0,
    reward_model: "CPM" as const,
    reward_value: 0,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const rewardModelDetails = {
    CPM: {
      label: "CPM (Cost Per Mille)",
      description: "Prix par 1000 impressions",
      placeholder: "0.50 (FCFA pour 1000 impressions)",
    },
    CPC: {
      label: "CPC (Cost Per Click)",
      description: "Prix par clic",
      placeholder: "10 (FCFA par clic)",
    },
    CPL: {
      label: "CPL (Cost Per Lead)",
      description: "Prix par inscription",
      placeholder: "500 (FCFA par inscription)",
    },
    CPA: {
      label: "CPA (Cost Per Action)",
      description: "Prix par action complétée",
      placeholder: "1000 (FCFA par action)",
    },
    "Flat Rate": {
      label: "Flat Rate (Tarif Forfaitaire)",
      description: "Rémunération fixe",
      placeholder: "10000 (FCFA total)",
    },
  };

  const commission = formData.budget_total * 0.2;
  const budgetUsable = formData.budget_total - commission;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "budget_total" || name === "reward_value"
          ? parseFloat(value) || 0
          : value,
    }));
    setError("");
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError("Titre requis");
      return false;
    }
    if (!formData.description.trim()) {
      setError("Description requise");
      return false;
    }
    if (!formData.objectives.trim()) {
      setError("Objectifs requis");
      return false;
    }
    if (formData.budget_total <= 0) {
      setError("Budget doit être > 0");
      return false;
    }
    if (formData.reward_value <= 0) {
      setError("Valeur récompense doit être > 0");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) return;
    if (!authUser) {
      setError("Non authentifié");
      return;
    }

    const campaign = await createCampaign(authUser.id, {
      title: formData.title,
      description: formData.description,
      objectives: formData.objectives,
      budget_total: formData.budget_total,
      reward_model: formData.reward_model,
      reward_value: formData.reward_value,
    });

    if (campaign) {
      setSuccess("Campagne créée avec succès!");
      setTimeout(() => {
        router.push(`/company/campaigns/${campaign.id}`);
      }, 1000);
    } else {
      setError("Erreur lors de la création");
    }
  };

  return (
    <main className="flex-1 bg-[#F4F4F6] min-h-screen p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/company/campaigns">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold font-display text-[#0F0F14]">
              Nouvelle Campagne
            </h1>
            <p className="text-[#4A4A5A]">
              Créez une campagne d&apos;influence et trouvez des créateurs
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        {/* Campaign Details */}
        <Card>
          <CardHeader>
            <CardTitle>Détails de la Campagne</CardTitle>
            <CardDescription>
              Informations générales et objectifs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-[#0F0F14] mb-2">
                Titre *
              </label>
              <Input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Ex: Campagne Été 2026"
                disabled={loading}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[#0F0F14] mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Décrivez votre campagne, la marque, le contexte..."
                disabled={loading}
                className="w-full px-3 py-2 border border-[#E4E4EA] rounded-lg focus:outline-none focus:border-[#0047FF] bg-white text-[#0F0F14] resize-none"
                rows={4}
              />
            </div>

            {/* Objectives */}
            <div>
              <label className="block text-sm font-medium text-[#0F0F14] mb-2">
                Objectifs *
              </label>
              <textarea
                name="objectives"
                value={formData.objectives}
                onChange={handleChange}
                placeholder="Quels sont les résultats attendus ? (followers, engagement, ventes...)"
                disabled={loading}
                className="w-full px-3 py-2 border border-[#E4E4EA] rounded-lg focus:outline-none focus:border-[#0047FF] bg-white text-[#0F0F14] resize-none"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Budget & Commission */}
        <Card>
          <CardHeader>
            <CardTitle>Budget & Commission</CardTitle>
            <CardDescription>
              20% de commission sera prélevée au dépôt
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Budget Total */}
            <div>
              <label className="block text-sm font-medium text-[#0F0F14] mb-2">
                Budget Total (FCFA) *
              </label>
              <Input
                type="number"
                name="budget_total"
                value={formData.budget_total || ""}
                onChange={handleChange}
                placeholder="100000"
                min="1"
                step="1000"
                disabled={loading}
              />
            </div>

            {/* Budget Breakdown */}
            {formData.budget_total > 0 && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-[#F9F9FC] rounded-lg border border-[#E4E4EA]">
                <div>
                  <p className="text-xs text-[#9898AA] uppercase tracking-wide">
                    Commission (20%)
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {commission.toLocaleString("fr-FR")} FCFA
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#9898AA] uppercase tracking-wide">
                    Budget Disponible
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {budgetUsable.toLocaleString("fr-FR")} FCFA
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reward Model */}
        <Card>
          <CardHeader>
            <CardTitle>Modèle de Récompense</CardTitle>
            <CardDescription>
              Comment les créateurs seront rémunérés
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Model Selection */}
            <div>
              <label className="block text-sm font-medium text-[#0F0F14] mb-3">
                Type de Récompense *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(rewardModelDetails).map(([model, details]) => (
                  <button
                    key={model}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        reward_model: model as typeof formData.reward_model,
                      }))
                    }
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      formData.reward_model === model
                        ? "border-[#0047FF] bg-blue-50"
                        : "border-[#E4E4EA] bg-white hover:border-[#0047FF]"
                    }`}
                    disabled={loading}
                  >
                    <p className="font-medium text-[#0F0F14]">
                      {details.label}
                    </p>
                    <p className="text-xs text-[#4A4A5A]">
                      {details.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Reward Value */}
            <div>
              <label className="block text-sm font-medium text-[#0F0F14] mb-2">
                Valeur de la Récompense *
              </label>
              <Input
                type="number"
                name="reward_value"
                value={formData.reward_value || ""}
                onChange={handleChange}
                placeholder={
                  rewardModelDetails[formData.reward_model].placeholder
                }
                min="0.01"
                step="0.01"
                disabled={loading}
              />
              <p className="text-xs text-[#4A4A5A] mt-2">
                {rewardModelDetails[formData.reward_model].description}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <Link href="/company/campaigns">
            <Button variant="secondary" disabled={loading}>
              Annuler
            </Button>
          </Link>
          <Button onClick={handleSubmit} disabled={loading} className="gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Créer la Campagne
          </Button>
        </div>
      </div>
    </main>
  );
}
