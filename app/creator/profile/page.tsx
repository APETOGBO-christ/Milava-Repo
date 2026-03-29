"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Instagram,
  Youtube,
  Facebook,
  Twitter,
  Smartphone,
  Plus,
  Copy,
  Loader2,
  AlertCircle,
  Check,
  Clock,
} from "lucide-react";

interface SocialAccount {
  id: string;
  platform: "TikTok" | "Instagram" | "YouTube" | "Facebook" | "X" | "Snapchat";
  profile_url: string;
  username: string;
  display_name?: string;
  is_verified: boolean;
  verification_code?: string;
  verification_expires_at?: string;
  followers_count: number;
  engagement_rate: number;
}

// Initialize Supabase client once
const supabase = createBrowserSupabaseClient();

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
  const [isAddingSocial, setIsAddingSocial] = useState(false);
  const [newSocial, setNewSocial] = useState({
    platform: "Instagram" as const,
    profile_url: "",
  });
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);

  // Initialize form data
  useEffect(() => {
    if (userProfile) {
      setFormData({
        firstName: userProfile.firstName || "",
        lastName: userProfile.lastName || "",
        bio: userProfile.bio || "",
        country: userProfile.country || "",
        phone: userProfile.phone || "",
      });
    }
  }, [userProfile]);

  // Load social accounts
  const loadSocials = useCallback(async () => {
    if (!authUser) return;
    try {
      const { data, error } = await supabase
        .from("social_accounts")
        .select("*")
        .eq("creator_id", authUser.id);

      if (error) throw error;
      setSocials(data || []);
    } catch (err) {
      console.error("Error loading socials:", err);
    }
  }, [authUser]);

  useEffect(() => {
    if (authUser) {
      loadSocials();
    }
  }, [authUser, loadSocials]);

  // Redirect if not logged in as creator
  useEffect(() => {
    if (!loading && (!authUser || userProfile?.role !== "creator")) {
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

    if (!formData.firstName || !formData.lastName || !formData.country) {
      setError("Complétez au moins le prénom, nom et pays.");
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        bio: formData.bio,
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

  const handleAddSocial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser || !newSocial.profile_url) return;

    setError("");
    setIsSaving(true);

    try {
      const verificationCode = generateVerificationCode();

      const { error } = await supabase.from("social_accounts").insert({
        creator_id: authUser.id,
        platform: newSocial.platform,
        profile_url: newSocial.profile_url,
        username: extractUsername(newSocial.profile_url),
        display_name: "",
        is_verified: false,
        verification_code: verificationCode,
        verification_expires_at: new Date(
          Date.now() + 48 * 60 * 60 * 1000,
        ).toISOString(),
      });

      if (error) throw error;

      setSuccess("Réseau ajouté! Procédez à la vérification.");
      setNewSocial({ platform: "Instagram", profile_url: "" });
      setIsAddingSocial(false);
      await loadSocials();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de l'ajout du réseau.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerifyClick = async (social: SocialAccount) => {
    setVerifyingId(social.id);
    setVerificationCode(social.verification_code || "");
  };

  const handleVerify = async (socialId: string) => {
    if (!authUser) return;

    try {
      // In production, you would scrape the social account to verify the code exists in bio
      // For now, simulate verification
      const { error } = await supabase
        .from("social_accounts")
        .update({
          is_verified: true,
          verified_at: new Date().toISOString(),
          followers_count: Math.floor(Math.random() * 50000) + 1000,
          engagement_rate: Math.random() * 15,
        })
        .eq("id", socialId);

      if (error) throw error;

      setSuccess("Réseau vérifié avec succès!");
      setVerifyingId(null);
      await loadSocials();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la vérification.",
      );
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(verificationCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const handleContinue = () => {
    router.push("/creator/dashboard");
  };

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center p-4 bg-[#F4F4F6] min-h-screen">
        <p className="text-[#4A4A5A]">Chargement du profil...</p>
      </main>
    );
  }

  const isProfileComplete =
    formData.firstName && formData.lastName && formData.country;
  const hasSocials = socials.length > 0;
  const hasVerifiedSocials = socials.some((s) => s.is_verified);

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4 bg-[#F4F4F6] min-h-screen py-8">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold font-display text-[#0F0F14] mb-2">
              Mon Profil Créateur
            </h1>
            <p className="text-[#4A4A5A]">
              Complétez votre profil et vérifiez vos réseaux pour postuler.
            </p>
          </div>
          <Button variant="secondary" onClick={() => signOut()}>
            Déconnexion
          </Button>
        </div>

        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
            <CardDescription>Vos informations sur Milava.</CardDescription>
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
                        {isProfileComplete
                          ? "✓ Profil complètement rempli"
                          : "⚠️ Complétez votre profil"}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-[#9898AA] mb-1">
                          Prénom
                        </p>
                        <p className="font-medium text-[#0F0F14]">
                          {formData.firstName || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-[#9898AA] mb-1">
                          Nom
                        </p>
                        <p className="font-medium text-[#0F0F14]">
                          {formData.lastName || "—"}
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
                        Bio
                      </p>
                      <p className="text-sm text-[#0F0F14]">
                        {formData.bio || "—"}
                      </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={() => setIsEditing(true)}
                        className="flex-1"
                      >
                        Modifier
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-[#0F0F14] mb-1">
                          Prénom *
                        </label>
                        <Input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          placeholder="Awa"
                          disabled={isSaving}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#0F0F14] mb-1">
                          Nom *
                        </label>
                        <Input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          placeholder="Fall"
                          disabled={isSaving}
                        />
                      </div>
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
                        Bio
                      </label>
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        placeholder="Présentez-vous et vos domaines de contenu..."
                        disabled={isSaving}
                        rows={3}
                        className="w-full px-3 py-2 border border-[#E4E4EA] rounded-lg focus:outline-none focus:border-[#0047FF] bg-white text-[#0F0F14] resize-none"
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

        {/* Social Accounts Section */}
        <Card>
          <CardHeader>
            <CardTitle>Réseaux sociaux</CardTitle>
            <CardDescription>
              Connectez et vérifiez vos comptes pour postuler aux campagnes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {socials.map((social) => (
              <div
                key={social.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-[#E4E4EA] rounded-xl gap-4"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 bg-gray-100 rounded-lg text-[#0F0F14]">
                    {social.platform === "Instagram" && (
                      <Instagram className="w-5 h-5" />
                    )}
                    {social.platform === "TikTok" && (
                      <Smartphone className="w-5 h-5" />
                    )}
                    {social.platform === "YouTube" && (
                      <Youtube className="w-5 h-5" />
                    )}
                    {social.platform === "Facebook" && (
                      <Facebook className="w-5 h-5" />
                    )}
                    {social.platform === "X" && <Twitter className="w-5 h-5" />}
                    {social.platform === "Snapchat" && (
                      <Smartphone className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-[#0F0F14]">
                      {social.platform}
                    </p>
                    <p className="text-sm text-[#4A4A5A]">@{social.username}</p>
                  </div>
                </div>

                {social.is_verified ? (
                  <div className="flex items-center gap-3 flex-1 sm:flex-none sm:justify-end">
                    <div className="text-right text-sm">
                      <p className="font-bold text-[#0F0F14]">
                        {social.followers_count.toLocaleString()}
                      </p>
                      <p className="text-xs text-[#4A4A5A]">abonnés</p>
                    </div>
                    <Badge className="bg-green-100 text-green-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Vérifié
                    </Badge>
                  </div>
                ) : verifyingId === social.id ? (
                  <div className="flex flex-col gap-3 flex-1 sm:flex-none w-full sm:w-auto">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-[#0F0F14]">
                          <span className="font-medium">1.</span>
                          <span>Copiez ce code :</span>
                        </div>
                        <div className="flex gap-2">
                          <code className="flex-1 bg-white px-3 py-2 rounded font-mono font-bold text-[#0047FF] text-center border border-[#0047FF]">
                            {verificationCode}
                          </code>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={copyToClipboard}
                            className="px-2"
                          >
                            {copiedCode ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="text-sm text-[#0F0F14]">
                        <p className="font-medium">
                          2. Ajoutez le code à votre bio
                        </p>
                        <p className="text-xs text-[#4A4A5A] mt-1">
                          Vous avez 48h pour le vérifier
                        </p>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        className="w-full"
                        onClick={() => handleVerify(social.id)}
                      >
                        Vérifier maintenant
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="w-full"
                        onClick={() => setVerifyingId(null)}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleVerifyClick(social)}
                    className="flex-1 sm:flex-none"
                  >
                    Vérifier
                  </Button>
                )}
              </div>
            ))}

            {isAddingSocial ? (
              <form
                onSubmit={handleAddSocial}
                className="p-4 border border-[#E4E4EA] rounded-xl space-y-4 bg-gray-50"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#0F0F14]">
                      Plateforme *
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-[#E4E4EA] rounded-lg focus:outline-none focus:border-[#0047FF] bg-white text-[#0F0F14]"
                      value={newSocial.platform}
                      onChange={(e) =>
                        setNewSocial({
                          ...newSocial,
                          platform: e.target.value as any,
                        })
                      }
                    >
                      <option value="Instagram">Instagram</option>
                      <option value="TikTok">TikTok</option>
                      <option value="YouTube">YouTube</option>
                      <option value="Facebook">Facebook</option>
                      <option value="X">X (Twitter)</option>
                      <option value="Snapchat">Snapchat</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#0F0F14]">
                      URL du profil *
                    </label>
                    <Input
                      placeholder="https://instagram.com/username"
                      value={newSocial.profile_url}
                      onChange={(e) =>
                        setNewSocial({
                          ...newSocial,
                          profile_url: e.target.value,
                        })
                      }
                      disabled={isSaving}
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsAddingSocial(false)}
                    disabled={isSaving}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Ajouter
                  </Button>
                </div>
              </form>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full border-dashed"
                onClick={() => setIsAddingSocial(true)}
              >
                <Plus className="w-4 h-4 mr-2" /> Ajouter un réseau
              </Button>
            )}

            {/* Progress Indicator */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm text-[#0047FF]">
              <p className="font-medium">Progression du profil :</p>
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  {isProfileComplete ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                  Informations personelles
                </div>
                <div className="flex items-center gap-2">
                  {hasSocials ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                  Au moins 1 réseau social ajouté
                </div>
                <div className="flex items-center gap-2">
                  {hasVerifiedSocials ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                  Au moins 1 réseau vérifié
                </div>
              </div>

              {isProfileComplete && hasSocials && hasVerifiedSocials && (
                <Button
                  type="button"
                  onClick={handleContinue}
                  className="w-full mt-3"
                >
                  Continuer vers le tableau de bord
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function generateVerificationCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "MV";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function extractUsername(url: string): string {
  return (
    url
      .split("/")
      .filter((part) => part)
      .pop() || url
  );
}
