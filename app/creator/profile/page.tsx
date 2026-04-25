"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  CheckCircle2,
  Plus,
  Copy,
  Loader2,
  AlertCircle,
  Check,
  Clock,
  User,
  Shield,
  LogOut,
  Instagram,
  Youtube,
  Facebook,
  Twitter,
  Smartphone,
  MapPin,
  Phone,
  PenSquare,
  Sparkles,
} from "lucide-react";

interface SocialAccount {
  id: string;
  platform: string;
  profile_url: string;
  username: string;
  display_name?: string;
  is_verified: boolean;
  verification_code?: string;
  verification_expires_at?: string;
  followers_count: number;
  engagement_rate: number;
}

const supabase = createBrowserSupabaseClient();

function generateVerificationCode() {
  return "#" + Math.random().toString(36).substring(2, 8).toUpperCase();
}
function extractUsername(url: string) {
  const parts = url.split("/").filter(Boolean);
  return parts[parts.length - 1] || url;
}
function formatFollowers(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toString();
}

const platformIcon = (p: string) => {
  const cls = "w-4 h-4";
  if (p === "Instagram") return <Instagram className={cls} />;
  if (p === "YouTube") return <Youtube className={cls} />;
  if (p === "Facebook") return <Facebook className={cls} />;
  if (p === "X") return <Twitter className={cls} />;
  return <Smartphone className={cls} />;
};

const inputCls =
  "w-full h-11 px-4 rounded-xl border border-[#E4E4EA] bg-[#F4F4F6] text-[#0F0F14] text-sm placeholder-[#9898AA] outline-none focus:border-[#0047FF] focus:bg-white transition-all disabled:opacity-50";
const labelCls =
  "block text-xs font-semibold text-[#0F0F14] uppercase tracking-wide mb-1.5";

export default function CreatorProfilePage() {
  const router = useRouter();
  const { authUser, userProfile, loading, updateProfile, signOut } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    bio: "",
    country: "",
    phone: "",
  });
  const [socials, setSocials] = useState<SocialAccount[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [isAddingSocial, setIsAddingSocial] = useState(false);
  const [newSocial, setNewSocial] = useState({
    platform: "",
    profile_url: "",
  });
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (userProfile)
      setFormData({
        firstName: userProfile.firstName || "",
        lastName: userProfile.lastName || "",
        bio: userProfile.bio || "",
        country: userProfile.country || "",
        phone: (userProfile as any).phone || "",
      });
  }, [userProfile]);

  const loadSocials = useCallback(async () => {
    if (!authUser) return;
    const { data } = await supabase
      .from("social_accounts")
      .select("*")
      .eq("creator_id", authUser.id);
    setSocials(data || []);
  }, [authUser]);

  useEffect(() => {
    if (authUser) loadSocials();
  }, [authUser, loadSocials]);

  useEffect(() => {
    const loadTaxonomy = async () => {
      try {
        const [countriesRes, platformsRes] = await Promise.all([
          fetch("/api/public/taxonomy?type=country"),
          fetch("/api/public/taxonomy?type=social_platform"),
        ]);

        const countriesPayload = countriesRes.ok
          ? await countriesRes.json()
          : null;
        const platformPayload = platformsRes.ok
          ? await platformsRes.json()
          : null;

        const countryValues: string[] = countriesPayload?.values || [];
        const platformValues: string[] = platformPayload?.values || [];

        setCountries(countryValues);
        setPlatforms(platformValues);

        if (platformValues.length > 0) {
          setNewSocial((prev) => ({
            ...prev,
            platform: prev.platform || platformValues[0],
          }));
        }
      } catch {
        setCountries([]);
        setPlatforms([]);
      }
    };

    loadTaxonomy();
  }, []);

  useEffect(() => {
    if (!loading && (!authUser || userProfile?.role !== "creator"))
      router.push("/");
  }, [authUser, userProfile, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!formData.firstName || !formData.lastName || !formData.country) {
      setError("Prénom, nom et pays sont requis.");
      return;
    }
    setIsSaving(true);
    try {
      await updateProfile(formData);
      setSuccess("Profil mis à jour !");
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de mise à jour.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSocial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser || !newSocial.profile_url || !newSocial.platform) return;
    setError("");
    setIsSaving(true);
    try {
      const code = generateVerificationCode();
      const { error: dbErr } = await supabase.from("social_accounts").insert({
        creator_id: authUser.id,
        platform: newSocial.platform,
        profile_url: newSocial.profile_url,
        username: extractUsername(newSocial.profile_url),
        display_name: "",
        is_verified: false,
        verification_code: code,
        verification_expires_at: new Date(
          Date.now() + 48 * 60 * 60 * 1000,
        ).toISOString(),
      });
      if (dbErr) throw dbErr;
      setNewSocial((prev) => ({
        platform: prev.platform,
        profile_url: "",
      }));
      setIsAddingSocial(false);
      await loadSocials();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'ajout.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerifyClick = (s: SocialAccount) => {
    setVerifyingId(s.id);
    setVerificationCode(s.verification_code || "");
  };

  const handleVerify = async (id: string) => {
    if (!authUser) return;
    try {
      const { error: dbErr } = await supabase
        .from("social_accounts")
        .update({
          is_verified: true,
          verified_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (dbErr) throw dbErr;
      setSuccess("Réseau vérifié !");
      setVerifyingId(null);
      await loadSocials();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de vérification.");
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(verificationCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-[#0047FF]" />
      </div>
    );

  const initials =
    `${formData.firstName?.[0] || ""}${formData.lastName?.[0] || ""}`.toUpperCase() ||
    "?";
  const verifiedCount = socials.filter((s) => s.is_verified).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-[#DCE7FF] bg-[linear-gradient(135deg,#FFFFFF_0%,#F3F7FF_100%)] p-5 sm:p-6 shadow-[0_16px_34px_rgba(0,71,255,0.08)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#0047FF] flex items-center justify-center flex-shrink-0 shadow-[0_12px_24px_rgba(0,71,255,0.22)]">
              <span className="text-white text-lg font-bold">{initials}</span>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7C87A1] mb-1">
                Espace créateur
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-[-0.03em] text-[#0F0F14]">
                Mon profil
              </h1>
              <p className="text-sm text-[#5F6472] mt-1">
                {verifiedCount} réseau{verifiedCount > 1 ? "x" : ""} vérifié
                {verifiedCount > 1 ? "s" : ""}
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

      {/* Alerts */}
      {error && (
        <div className="flex gap-2.5 p-3 rounded-xl bg-red-50 border border-red-100">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      {success && (
        <div className="flex gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-700 font-medium">{success}</p>
        </div>
      )}

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-[#E4E4EA] shadow-[0_8px_24px_rgba(15,15,20,0.06)] overflow-hidden">
        {/* Avatar + name bar */}
        <div className="flex items-center gap-4 px-6 py-5 border-b border-[#E4E4EA]">
          <div className="w-14 h-14 rounded-2xl bg-[#EEF4FF] border border-[#CFE0FF] flex items-center justify-center flex-shrink-0">
            <User className="w-6 h-6 text-[#0047FF]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[#0F0F14] text-lg">
              {formData.firstName} {formData.lastName}
            </p>
            <div className="flex items-center gap-2 text-sm text-[#9898AA] mt-0.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>{formData.country || "Pays non renseigné"}</span>
            </div>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="h-9 px-4 rounded-xl border border-[#E4E4EA] text-xs font-semibold text-[#4A4A5A] hover:border-[#0047FF] hover:text-[#0047FF] transition-all flex-shrink-0 inline-flex items-center gap-1.5"
            >
              <PenSquare className="w-3.5 h-3.5" />
              Modifier
            </button>
          )}
        </div>

        {/* Form */}
        {isEditing ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Prénom *</label>
                <input
                  name="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, firstName: e.target.value }))
                  }
                  className={inputCls}
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className={labelCls}>Nom *</label>
                <input
                  name="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, lastName: e.target.value }))
                  }
                  className={inputCls}
                  disabled={isSaving}
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Pays *</label>
              <select
                value={formData.country}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, country: e.target.value }))
                }
                className={inputCls}
                disabled={isSaving}
              >
                <option value="">Sélectionner</option>
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, bio: e.target.value }))
                }
                rows={3}
                placeholder="Parlez de vous, de votre niche, de votre audience..."
                className="w-full px-4 py-3 rounded-xl border border-[#E4E4EA] bg-[#F4F4F6] text-sm text-[#0F0F14] placeholder-[#9898AA] outline-none focus:border-[#0047FF] focus:bg-white transition-all resize-none"
                disabled={isSaving}
              />
            </div>
            <div>
              <label className={labelCls}>Téléphone</label>
              <input
                value={formData.phone}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, phone: e.target.value }))
                }
                placeholder="+229 XX XX XX XX"
                className={inputCls}
                disabled={isSaving}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="h-9 px-4 rounded-xl border border-[#E4E4EA] text-sm font-medium text-[#4A4A5A] hover:bg-[#F4F4F6] transition-all"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="h-9 px-5 rounded-xl bg-[#0047FF] text-white text-sm font-semibold hover:bg-[#0038CC] disabled:opacity-60 transition-all flex items-center gap-2"
              >
                {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Enregistrer
              </button>
            </div>
          </form>
        ) : (
          <div className="px-6 py-5 space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-[#E9ECF3] bg-[#FAFBFF] px-3 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9898AA] mb-1">
                  Pays
                </p>
                <p className="text-sm font-semibold text-[#0F0F14] inline-flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#0047FF]" />
                  {formData.country || "—"}
                </p>
              </div>
              <div className="rounded-xl border border-[#E9ECF3] bg-[#FAFBFF] px-3 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9898AA] mb-1">
                  Téléphone
                </p>
                <p className="text-sm font-semibold text-[#0F0F14] inline-flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#0047FF]" />
                  {formData.phone || "—"}
                </p>
              </div>
            </div>
            {formData.bio ? (
              <p className="text-sm text-[#4A4A5A] leading-relaxed">
                {formData.bio}
              </p>
            ) : (
              <p className="text-sm text-[#9898AA] italic">
                Aucune bio renseignée.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Social accounts */}
      <div className="bg-white rounded-2xl border border-[#E4E4EA] shadow-[0_8px_24px_rgba(15,15,20,0.06)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E4E4EA] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#0047FF]" />
            <h2 className="font-bold text-[#0F0F14]">
              Réseaux sociaux vérifiés
            </h2>
          </div>
          {!isAddingSocial && (
            <button
              onClick={() => setIsAddingSocial(true)}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#EEF4FF] text-[#0047FF] text-xs font-semibold hover:bg-[#ddeaff] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Ajouter
            </button>
          )}
        </div>

        {/* Add social form */}
        {isAddingSocial && (
          <form
            onSubmit={handleAddSocial}
            className="px-6 py-4 border-b border-[#E4E4EA] bg-[#FAFBFE] space-y-3"
          >
            <p className="text-xs font-semibold text-[#0047FF]">
              Nouveau réseau social
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Plateforme</label>
                <select
                  value={newSocial.platform}
                  onChange={(e) =>
                    setNewSocial((p) => ({
                      ...p,
                      platform: e.target.value as any,
                    }))
                  }
                  className={inputCls}
                >
                  {platforms.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>URL du profil</label>
                <input
                  type="url"
                  value={newSocial.profile_url}
                  onChange={(e) =>
                    setNewSocial((p) => ({ ...p, profile_url: e.target.value }))
                  }
                  placeholder="https://tiktok.com/@username"
                  className={inputCls}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsAddingSocial(false)}
                className="h-9 px-4 rounded-xl border border-[#E4E4EA] text-xs font-semibold text-[#4A4A5A]"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSaving || !newSocial.profile_url}
                className="h-9 px-4 rounded-xl bg-[#0047FF] text-white text-xs font-semibold disabled:opacity-60 flex items-center gap-1.5"
              >
                {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Générer le code
              </button>
            </div>
          </form>
        )}

        {/* Social list */}
        {socials.length === 0 && !isAddingSocial ? (
          <div className="px-6 py-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#EEF4FF] flex items-center justify-center mx-auto mb-3">
              <Shield className="w-5 h-5 text-[#0047FF]" />
            </div>
            <p className="text-sm font-semibold text-[#0F0F14] mb-1">
              Aucun réseau vérifié
            </p>
            <p className="text-xs text-[#9898AA] mb-4">
              Ajoutez vos réseaux pour postuler aux campagnes
            </p>
            <button
              onClick={() => setIsAddingSocial(true)}
              className="h-9 px-4 rounded-xl bg-[#0047FF] text-white text-xs font-semibold hover:bg-[#0038CC] transition-all"
            >
              Ajouter un réseau
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#E4E4EA]">
            {socials.map((s) => (
              <div key={s.id} className="px-6 py-4">
                {/* Verification panel */}
                {verifyingId === s.id ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      {platformIcon(s.platform)}
                      <p className="font-semibold text-[#0F0F14] text-sm">
                        {s.username}
                      </p>
                      <span className="text-xs text-[#9898AA]">
                        · Vérification en cours
                      </span>
                    </div>

                    <div className="bg-[#0047FF] rounded-xl p-4 text-center">
                      <p className="text-white/60 text-xs mb-2">
                        Collez ce code dans votre bio {s.platform}
                      </p>
                      <p className="text-white text-2xl font-bold font-mono tracking-widest">
                        {verificationCode}
                      </p>
                      {s.verification_expires_at && (
                        <p className="text-white/50 text-xs mt-2 flex items-center justify-center gap-1">
                          <Clock className="w-3 h-3" />
                          Expire le{" "}
                          {new Date(
                            s.verification_expires_at,
                          ).toLocaleDateString("fr-FR")}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={copyCode}
                        className={`flex-1 h-10 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all ${copiedCode ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-[#E4E4EA] bg-[#F4F4F6] text-[#4A4A5A] hover:border-[#0047FF]"}`}
                      >
                        {copiedCode ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                        {copiedCode ? "Copié !" : "Copier le code"}
                      </button>
                      <button
                        onClick={() => handleVerify(s.id)}
                        className="flex-1 h-10 rounded-xl bg-[#0047FF] text-white text-sm font-semibold hover:bg-[#0038CC] transition-all"
                      >
                        J'ai ajouté le code →
                      </button>
                    </div>
                    <button
                      onClick={() => setVerifyingId(null)}
                      className="w-full text-xs text-[#9898AA] hover:text-[#4A4A5A] text-center transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${s.is_verified ? "bg-[#EEF4FF] text-[#0047FF]" : "bg-[#F4F4F6] text-[#9898AA]"}`}
                      >
                        {platformIcon(s.platform)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-[#0F0F14] text-sm">
                            @{s.username}
                          </p>
                          {s.is_verified ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" />
                              Vérifié
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                              <Clock className="w-3 h-3" />
                              En attente
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#9898AA]">
                          {s.platform}
                          {s.is_verified &&
                            s.followers_count > 0 &&
                            ` · ${formatFollowers(s.followers_count)} abonnés`}
                          {s.is_verified &&
                            s.engagement_rate > 0 &&
                            ` · ${s.engagement_rate.toFixed(1)}% engagement`}
                        </p>
                      </div>
                    </div>
                    {!s.is_verified && (
                      <button
                        onClick={() => handleVerifyClick(s)}
                        className="h-8 px-3 rounded-lg bg-[#EEF4FF] text-[#0047FF] text-xs font-semibold hover:bg-[#ddeaff] transition-colors flex-shrink-0"
                      >
                        Vérifier
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
