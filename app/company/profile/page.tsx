"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, Loader2, Check } from "lucide-react";
import Link from "next/link";

export default function CompanyProfilePage() {
  const router = useRouter();
  const { authUser, userProfile, loading, updateProfile, signOut } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    companyName: "",
    sector: "",
    website: "",
    description: "",
    country: "",
    phone: "",
  });

  // Initialize form data
  useEffect(() => {
    if (userProfile) {
      setFormData({
        companyName: userProfile.companyName || "",
        sector: userProfile.sector || "",
        website: userProfile.website || "",
        description: userProfile.description || "",
        country: userProfile.country || "",
        phone: userProfile.phone || "",
      });
    }
  }, [userProfile]);

  // Redirect if not logged in as company
  useEffect(() => {
    if (!loading && (!authUser || userProfile?.role !== "company")) {
      router.push("/");
    }
  }, [authUser, userProfile, loading, router]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.companyName || !formData.country) {
      setError("Complétez au moins le nom et le pays.");
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        companyName: formData.companyName,
        sector: formData.sector,
        website: formData.website,
        description: formData.description,
        country: formData.country,
        phone: formData.phone,
      });
      setSuccess("Profil mis à jour avec succès!");
      setIsEditing(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la mise à jour.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleContinue = () => {
    router.push("/company/dashboard");
  };

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center p-4 bg-[#F4F4F6] min-h-screen">
        <p className="text-[#4A4A5A]">Chargement du profil...</p>
      </main>
    );
  }

  const isComplete = formData.companyName && formData.country;

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4 bg-[#F4F4F6] min-h-screen py-8">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold font-display text-[#0F0F14] mb-2">
              Profil Marque
            </h1>
            <p className="text-[#4A4A5A]">
              Complétez vos informations pour lancer vos campagnes.
            </p>
          </div>
          <Button variant="secondary" onClick={() => signOut()}>
            Déconnexion
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
            <CardDescription>
              Vos informations d&apos;entreprise sur Milava.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {success && (
                <div className="flex gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-600">{success}</p>
                </div>
              )}

              <div className="space-y-4 opacity-75 pointer-events-none">
                <div>
                  <label className="block text-sm font-medium text-[#0F0F14] mb-1">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={authUser?.email || ""}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </div>

              <div className="border-t border-[#E4E4EA] pt-4">
                {!isEditing ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-[#0047FF] font-medium">
                        {isComplete
                          ? "✓ Profil complètement rempli"
                          : "⚠️ Complétez votre profil"}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-[#9898AA] mb-1">
                          Nom entreprise
                        </p>
                        <p className="font-medium text-[#0F0F14]">
                          {formData.companyName || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-[#9898AA] mb-1">
                          Secteur
                        </p>
                        <p className="font-medium text-[#0F0F14]">
                          {formData.sector || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-[#9898AA] mb-1">
                          Pays
                        </p>
                        <p className="font-medium text-[#0F0F14]">
                          {formData.country || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-[#9898AA] mb-1">
                          Téléphone
                        </p>
                        <p className="font-medium text-[#0F0F14]">
                          {formData.phone || "—"}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wider text-[#9898AA] mb-1">
                        Site web
                      </p>
                      <p className="font-medium text-[#0F0F14]">
                        {formData.website || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wider text-[#9898AA] mb-1">
                        Description
                      </p>
                      <p className="text-sm text-[#0F0F14]">
                        {formData.description || "—"}
                      </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={() => setIsEditing(true)}
                        className="flex-1"
                      >
                        Modifier le profil
                      </Button>
                      {isComplete && (
                        <Button
                          onClick={handleContinue}
                          variant="secondary"
                          className="flex-1"
                        >
                          Continuer vers le tableau de bord
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#0F0F14] mb-1">
                        Nom entreprise *
                      </label>
                      <Input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        placeholder="Tech Africa"
                        disabled={isSaving}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#0F0F14] mb-1">
                        Secteur
                      </label>
                      <Input
                        type="text"
                        name="sector"
                        value={formData.sector}
                        onChange={handleChange}
                        placeholder="Technologie, Finance, Beauté..."
                        disabled={isSaving}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#0F0F14] mb-1">
                        Pays *
                      </label>
                      <select
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        disabled={isSaving}
                        className="w-full px-3 py-2 border border-[#E4E4EA] rounded-lg focus:outline-none focus:border-[#0047FF] bg-white text-[#0F0F14]"
                      >
                        <option value="">Sélectionnez un pays</option>
                        <option value="Sénégal">Sénégal</option>
                        <option value="Côte d'Ivoire">
                          Côte d&apos;Ivoire
                        </option>
                        <option value="Ghana">Ghana</option>
                        <option value="Benin">Bénin</option>
                        <option value="Togo">Togo</option>
                        <option value="Mali">Mali</option>
                        <option value="Burkina Faso">Burkina Faso</option>
                        <option value="Niger">Niger</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#0F0F14] mb-1">
                        Site web
                      </label>
                      <Input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        placeholder="https://entreprise.com"
                        disabled={isSaving}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#0F0F14] mb-1">
                        Téléphone
                      </label>
                      <Input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+221 77 123 45 67"
                        disabled={isSaving}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#0F0F14] mb-1">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Décrivez brièvement votre entreprise et votre activité..."
                        disabled={isSaving}
                        rows={4}
                        className="w-full px-3 py-2 border border-[#E4E4EA] rounded-lg focus:outline-none focus:border-[#0047FF] bg-white text-[#0F0F14] resize-none"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        type="submit"
                        disabled={isSaving}
                        className="flex-1"
                      >
                        {isSaving && (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        )}
                        {isSaving ? "Enregistrement..." : "Enregistrer"}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setIsEditing(false)}
                        disabled={isSaving}
                        className="flex-1"
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
