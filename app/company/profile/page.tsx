"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import {
  AlertCircle,
  Loader2,
  Check,
  LogOut,
  Building2,
  Globe,
  Phone,
  MapPin,
  BriefcaseBusiness,
  FileText,
  PenSquare,
  ArrowRight,
} from "lucide-react";

const inputCls =
  "w-full h-11 px-4 rounded-xl border border-[#E4E4EA] bg-[#F4F4F6] text-[#0F0F14] text-sm placeholder-[#9898AA] outline-none focus:border-[#0047FF] focus:bg-white transition-all disabled:opacity-50";
const labelCls =
  "block text-xs font-semibold text-[#0F0F14] uppercase tracking-wide mb-1.5";

export default function CompanyProfilePage() {
  const router = useRouter();
  const { authUser, userProfile, loading, updateProfile, signOut } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [countries, setCountries] = useState<string[]>([]);

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

  useEffect(() => {
    const loadCountries = async () => {
      try {
        const response = await fetch("/api/public/taxonomy?type=country");
        if (!response.ok) return;
        const payload = await response.json();
        setCountries(payload.values || []);
      } catch {
        setCountries([]);
      }
    };

    loadCountries();
  }, []);

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
        <Loader2 className="w-6 h-6 animate-spin text-[#0047FF]" />
      </main>
    );
  }

  const isComplete = formData.companyName && formData.country;

  return (
    <main className="flex-1 flex flex-col p-4 bg-[#F4F4F6] min-h-screen py-8 lg:p-8">
      <div className="w-full max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="rounded-2xl border border-[#DCE7FF] bg-[linear-gradient(135deg,#FFFFFF_0%,#F3F7FF_100%)] p-5 sm:p-6 shadow-[0_16px_34px_rgba(0,71,255,0.08)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0047FF] text-white shadow-[0_12px_24px_rgba(0,71,255,0.22)]">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7C87A1] mb-1">
                  Espace marque
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-[-0.03em] text-[#0F0F14]">
                  Profil entreprise
                </h1>
                <p className="text-sm text-[#5F6472] mt-1">
                  {isComplete
                    ? "Profil complet et prêt pour vos campagnes"
                    : "Complétez votre profil pour inspirer confiance"}
                </p>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl border border-[#E4E4EA] bg-white text-xs font-semibold text-[#4A4A5A] hover:border-red-200 hover:text-red-500 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              Déconnexion
            </button>
          </div>
        </div>

        {/* Profile Card */}
        <div className="rounded-[24px] border border-[#E4EAF3] bg-white p-6 shadow-[0_18px_44px_rgba(15,15,20,0.06)] lg:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Messages */}
            {error && (
              <div className="flex gap-3 p-4 rounded-[14px] bg-red-50 border border-red-200">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {success && (
              <div className="flex gap-3 p-4 rounded-[14px] bg-emerald-50 border border-emerald-200">
                <Check className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-600">{success}</p>
              </div>
            )}

            {!isEditing ? (
              <div className="space-y-6">
                {/* Profile Status */}
                <div
                  className={`rounded-[14px] border p-4 ${
                    isComplete
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-blue-200 bg-blue-50"
                  }`}
                >
                  <p
                    className={`text-sm font-semibold inline-flex items-center gap-2 ${isComplete ? "text-emerald-700" : "text-blue-700"}`}
                  >
                    {isComplete ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    {isComplete
                      ? "✓ Profil complètement rempli"
                      : "○ Complétez les champs requis"}
                  </p>
                </div>

                {/* Avatar + Info Section */}
                <div className="flex items-start gap-6">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[16px] border-2 border-[#E4E4EA] bg-[#F9FAFF] text-2xl font-bold text-[#0047FF]">
                    {(formData.companyName?.[0] || "?").toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold text-[#0F0F14]">
                      {formData.companyName || "Nom de l'entreprise"}
                    </h2>
                    <p className="mt-1 text-[#4A4A5A]">{authUser?.email}</p>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="border-t border-[#E4E4EA] pt-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {[
                      {
                        label: "Nom entreprise",
                        value: formData.companyName,
                        icon: Building2,
                      },
                      {
                        label: "Secteur",
                        value: formData.sector,
                        icon: BriefcaseBusiness,
                      },
                      { label: "Pays", value: formData.country, icon: MapPin },
                      {
                        label: "Téléphone",
                        value: formData.phone,
                        icon: Phone,
                      },
                    ].map((item) => (
                      <div key={item.label}>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9898AA] mb-2">
                          {item.label}
                        </p>
                        <p className="text-base font-semibold text-[#0F0F14] inline-flex items-center gap-1.5">
                          <item.icon className="h-4 w-4 text-[#0047FF]" />
                          {item.value || "—"}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9898AA] mb-2">
                      Site web
                    </p>
                    <p className="text-base font-semibold text-[#0F0F14] break-all inline-flex items-center gap-1.5">
                      <Globe className="h-4 w-4 text-[#0047FF]" />
                      {formData.website || "—"}
                    </p>
                  </div>

                  <div className="mt-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9898AA] mb-2">
                      Description
                    </p>
                    <p className="text-base text-[#4A4A5A] leading-relaxed inline-flex gap-1.5">
                      <FileText className="h-4 w-4 text-[#0047FF] mt-1" />
                      <span>{formData.description || "—"}</span>
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t border-[#E4E4EA] pt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="flex-1 rounded-[12px] bg-[#0047FF] px-4 py-2.5 font-semibold text-white transition-opacity hover:opacity-90 inline-flex items-center justify-center gap-2"
                  >
                    <PenSquare className="h-4 w-4" />
                    Modifier le profil
                  </button>
                  {isComplete && (
                    <button
                      type="button"
                      onClick={handleContinue}
                      className="flex-1 rounded-[12px] border border-[#E4E4EA] bg-white px-4 py-2.5 font-semibold text-[#0F0F14] transition-colors hover:bg-[#F9F9FB] inline-flex items-center justify-center gap-2"
                    >
                      Aller au tableau de bord
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Edit Mode */
              <div className="space-y-5">
                <div>
                  <label className={labelCls}>Nom de l'entreprise *</label>
                  <Input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Ma marque"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>Secteur</label>
                  <Input
                    type="text"
                    name="sector"
                    value={formData.sector}
                    onChange={handleChange}
                    placeholder="ex: Mode, Tech, Beauté"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>Pays *</label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className={inputCls}
                  >
                    <option value="">Sélectionnez un pays</option>
                    {countries.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Téléphone</label>
                  <Input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+229 XX XX XX XX"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>Site web</label>
                  <Input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://marque.com"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Décrivez votre entreprise..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-[#E4E4EA] bg-[#F4F4F6] text-sm text-[#0F0F14] placeholder-[#9898AA] outline-none focus:border-[#0047FF] focus:bg-white transition-all resize-none"
                  />
                </div>

                {/* Edit Actions */}
                <div className="border-t border-[#E4E4EA] pt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 rounded-[12px] border border-[#E4E4EA] bg-white px-4 py-2.5 font-semibold text-[#0F0F14] transition-colors hover:bg-[#F9F9FB]"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 rounded-[12px] bg-[#0047FF] px-4 py-2.5 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sauvegarde...
                      </span>
                    ) : (
                      "Sauvegarder"
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </main>
  );
}
