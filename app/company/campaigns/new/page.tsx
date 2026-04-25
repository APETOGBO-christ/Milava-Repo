"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Plus,
  Globe,
  Lock,
  RefreshCw,
  DollarSign,
  Eye,
  MousePointerClick,
  Users,
  Zap,
  Link2,
} from "lucide-react";

// ─── Styles ───────────────────────────────────────────────────────────────────
const inputCls =
  "w-full h-11 px-3 border border-[#D9DFEB] rounded-xl bg-white text-[#0F0F14] text-sm placeholder-[#A2A8B7] outline-none focus:border-[#0047FF] focus:ring-4 focus:ring-[#DCE7FF] transition-all disabled:opacity-50 disabled:bg-[#F5F7FC]";
const labelCls = "block text-xs font-semibold text-[#374151] mb-2";
const textareaCls =
  "w-full px-3 py-2.5 border border-[#D9DFEB] rounded-xl bg-white text-[#0F0F14] text-sm placeholder-[#A2A8B7] outline-none focus:border-[#0047FF] focus:ring-4 focus:ring-[#DCE7FF] transition-all resize-none disabled:opacity-50 disabled:bg-[#F5F7FC]";
const sectionCardCls =
  "space-y-6 rounded-2xl border border-[#E3E8F3] bg-white p-5 sm:p-6 shadow-[0_10px_30px_rgba(15,15,20,0.04)]";
const sectionTitleCls = "text-lg font-semibold text-[#0F0F14]";

const REWARD_MODELS = [
  { key: "CPM", label: "CPM", desc: "Par 1 000 vues", icon: Eye },
  { key: "CPC", label: "CPC", desc: "Par clic", icon: MousePointerClick },
  { key: "CPL", label: "CPL", desc: "Par lead", icon: Users },
  { key: "CPA", label: "CPA", desc: "Par vente", icon: Zap },
  {
    key: "Flat Rate",
    label: "Flat Rate",
    desc: "Montant fixe/post",
    icon: DollarSign,
  },
];

const STEPS = [
  { num: 1, label: "Détails" },
  { num: 2, label: "Ressources" },
  { num: 3, label: "Restrictions" },
  { num: 4, label: "Budget" },
];

const CONTENT_TYPE_EXPLANATIONS: Record<
  string,
  { title: string; description: string; example: string }
> = {
  "Vidéo courte": {
    title: "Video courte",
    description:
      "Un format rapide (15s a 60s), ideal pour capter vite l'attention.",
    example: "Exemple: Reel Instagram, TikTok, YouTube Short.",
  },
  Fil: {
    title: "Post dans le fil",
    description: "Une publication classique qui reste visible sur le profil.",
    example: "Exemple: photo ou video publiee dans le feed Instagram/Facebook.",
  },
  Histoire: {
    title: "Story",
    description: "Un contenu court et ephemere qui disparait apres 24h.",
    example: "Exemple: Story Instagram ou Facebook Story.",
  },
  "Découpage de contenu": {
    title: "Serie de contenus",
    description:
      "Le createur coupe une idee en plusieurs petites publications.",
    example: "Exemple: une mini-serie en 3 parties sur TikTok.",
  },
  "Review produit": {
    title: "Avis produit",
    description: "Le createur teste et donne son opinion sur le produit.",
    example: "Exemple: demonstration + points forts + avis final.",
  },
  Tutoriel: {
    title: "Tutoriel",
    description:
      "Le createur montre etape par etape comment utiliser votre produit.",
    example: "Exemple: guide rapide " + '"comment utiliser ..."' + ".",
  },
  Unboxing: {
    title: "Unboxing",
    description:
      "Le createur ouvre le produit devant sa communaute et partage ses premieres impressions.",
    example: "Exemple: ouverture du colis + reaction + details du produit.",
  },
  Live: {
    title: "Direct",
    description:
      "Le createur presente votre produit en direct avec son audience.",
    example: "Exemple: Live de presentation + questions/reponses.",
  },
};

const DEFAULT_PLATFORM_OPTIONS = [
  "TikTok",
  "Instagram",
  "YouTube",
  "Facebook",
  "X",
  "Snapchat",
];

const DEFAULT_LANGUAGE_OPTIONS = ["Français", "Anglais"];
const CAMPAIGN_DRAFT_STORAGE_KEY = "milava:company:new-campaign-draft:v1";

// ─── Types ────────────────────────────────────────────────────────────────────
type RewardModel = "CPM" | "CPC" | "CPL" | "CPA" | "Flat Rate";

interface FormState {
  // Phase 1
  title: string;
  description: string;
  category: string;
  contentType: string;
  platforms: string[];
  requirements: string[];
  requirementInput: string;
  promotionLink: string;
  captionMode: "free" | "fixed";
  captionFixed: string;
  // Phase 2
  resourceLinks: string[];
  resourceInput: string;
  // Phase 3
  minFollowers: number;
  countries: string[];
  languages: string[];
  visibility: "public" | "restricted";
  // Phase 4
  budgetType: "monthly" | "one_time";
  budget_total: number;
  reward_model: RewardModel;
  reward_value: number;
  maxPayoutPerContent: number;
  flatFeeBonus: number;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function NewCampaignPage() {
  const router = useRouter();
  const { authUser } = useAuth();

  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [contentTypeOptions, setContentTypeOptions] = useState<string[]>([]);
  const [platformOptions, setPlatformOptions] = useState<string[]>([]);
  const [languageOptions, setLanguageOptions] = useState<string[]>([]);
  const [countryOptions, setCountryOptions] = useState<string[]>([]);
  const [platformFeePercent, setPlatformFeePercent] = useState<number>(0);

  const [form, setForm] = useState<FormState>({
    title: "",
    description: "",
    category: "",
    contentType: "",
    platforms: [],
    requirements: [],
    requirementInput: "",
    promotionLink: "",
    captionMode: "free",
    captionFixed: "",
    resourceLinks: [],
    resourceInput: "",
    minFollowers: 1000,
    countries: [],
    languages: [],
    visibility: "public",
    budgetType: "one_time",
    budget_total: 50,
    reward_model: "CPM",
    reward_value: 0.5,
    maxPayoutPerContent: 0,
    flatFeeBonus: 0,
  });

  useEffect(() => {
    const loadTaxonomies = async () => {
      const fetchValues = async (type: string) => {
        const response = await fetch(`/api/public/taxonomy?type=${type}`);
        if (!response.ok) return [] as string[];
        const payload = await response.json();
        return payload.values || [];
      };

      try {
        const [categories, contentTypes, countries, platforms, languages] =
          await Promise.all([
            fetchValues("campaign_category"),
            fetchValues("content_type"),
            fetchValues("country"),
            fetchValues("social_platform"),
            fetchValues("language"),
          ]);

        setCategoryOptions(categories);
        setContentTypeOptions(contentTypes);
        setCountryOptions(countries);
        setPlatformOptions(
          platforms.length > 0 ? platforms : DEFAULT_PLATFORM_OPTIONS,
        );
        setLanguageOptions(
          languages.length > 0 ? languages : DEFAULT_LANGUAGE_OPTIONS,
        );
      } catch {
        setCategoryOptions([]);
        setContentTypeOptions([]);
        setCountryOptions([]);
        setPlatformOptions(DEFAULT_PLATFORM_OPTIONS);
        setLanguageOptions(DEFAULT_LANGUAGE_OPTIONS);
      }
    };

    loadTaxonomies();
  }, []);

  useEffect(() => {
    const loadPlatformFee = async () => {
      try {
        const response = await fetch(
          "/api/public/platform-config?key=platform_fee_percentage",
        );
        if (!response.ok) return;
        const payload = await response.json();
        const value = Number(payload.value);
        if (!Number.isNaN(value) && value >= 0) {
          setPlatformFeePercent(value);
        }
      } catch {
        setPlatformFeePercent(0);
      }
    };

    loadPlatformFee();
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CAMPAIGN_DRAFT_STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as Partial<FormState>;
      if (!parsed || typeof parsed !== "object") return;

      setForm((prev) => ({
        ...prev,
        ...parsed,
        platforms: Array.isArray(parsed.platforms)
          ? parsed.platforms
          : prev.platforms,
        requirements: Array.isArray(parsed.requirements)
          ? parsed.requirements
          : prev.requirements,
        resourceLinks: Array.isArray(parsed.resourceLinks)
          ? parsed.resourceLinks
          : prev.resourceLinks,
        countries: Array.isArray(parsed.countries)
          ? parsed.countries
          : prev.countries,
        languages: Array.isArray(parsed.languages)
          ? parsed.languages
          : prev.languages,
      }));
    } catch {
      // Ignore malformed drafts and continue with defaults.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        CAMPAIGN_DRAFT_STORAGE_KEY,
        JSON.stringify(form),
      );
    } catch {
      // Ignore storage failures.
    }
  }, [form]);

  // ── Helpers ──
  const set = (key: keyof FormState, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleArr = (key: keyof FormState, val: string) => {
    const arr = form[key] as string[];
    set(key, arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  };

  const addToArr = (
    key: "requirements" | "resourceLinks",
    inputKey: "requirementInput" | "resourceInput",
  ) => {
    const val = (form[inputKey] as string).trim();
    if (!val) return;
    set(key, [...(form[key] as string[]), val]);
    set(inputKey, "");
  };

  const removeFromArr = (key: keyof FormState, val: string) =>
    set(
      key,
      (form[key] as string[]).filter((x) => x !== val),
    );

  // ── Validation per step ──
  const validateStep = (s: number): string => {
    if (s === 1) {
      if (!form.title.trim()) return "Le nom de la campagne est requis.";
      if (!form.description.trim()) return "La description est requise.";
      if (form.description.length > 500)
        return "La description ne peut pas dépasser 500 caractères.";
      if (!form.category) return "Veuillez choisir une catégorie.";
      if (!form.contentType) return "Veuillez choisir un type de contenu.";
      if (form.platforms.length === 0)
        return "Sélectionnez au moins un réseau social.";
    }
    if (s === 4) {
      if (form.budget_total < 50) return "Le budget minimum est de $50.";
      if (form.reward_value <= 0) return "Le CPM doit être supérieur à $0.";
    }
    return "";
  };

  const handleNext = () => {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setError("");
    setStep((s) => s - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Submit ──
  const handleSubmit = async () => {
    const err = validateStep(4);
    if (err) {
      setError(err);
      return;
    }
    if (!authUser) return;
    setError("");

    // Build description enriched with extra fields (stored in description since schema is fixed)
    const enrichedDescription = [
      form.description,
      form.requirements.length > 0
        ? `\n\nExigences:\n${form.requirements.map((r) => `• ${r}`).join("\n")}`
        : "",
      form.promotionLink ? `\n\nLien de promotion: ${form.promotionLink}` : "",
      form.captionMode === "fixed" && form.captionFixed
        ? `\n\nLégende imposée: ${form.captionFixed}`
        : "",
      form.resourceLinks.length > 0
        ? `\n\nRessources:\n${form.resourceLinks.join("\n")}`
        : "",
    ]
      .join("")
      .trim();

    const objectives = [
      `Catégorie: ${form.category}`,
      `Type de contenu: ${form.contentType}`,
      `Plateformes: ${form.platforms.join(", ")}`,
      `Abonnés minimum: ${form.minFollowers.toLocaleString()}`,
      form.countries.length > 0 ? `Pays: ${form.countries.join(", ")}` : "",
      form.languages.length > 0 ? `Langues: ${form.languages.join(", ")}` : "",
      `Visibilité: ${form.visibility === "public" ? "Publique" : "Restreinte"}`,
      `Budget: ${form.budgetType === "monthly" ? "Mensuel" : "Ponctuel"}`,
      form.maxPayoutPerContent > 0
        ? `Paiement max/contenu: $${form.maxPayoutPerContent}`
        : "",
      form.flatFeeBonus > 0 ? `Bonus forfaitaire: $${form.flatFeeBonus}` : "",
    ]
      .filter(Boolean)
      .join(" | ");

    setIsSubmitting(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setError("Session expirée. Veuillez vous reconnecter.");
        return;
      }

      const response = await fetch("/api/company/campaigns/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title: form.title,
          description: enrichedDescription,
          objectives,
          category: form.category,
          contentType: form.contentType,
          requiredNetworks: form.platforms,
          countries: form.countries,
          languages: form.languages,
          minFollowers: form.minFollowers,
          visibility: form.visibility,
          budgetType: form.budgetType,
          budget_total: form.budget_total,
          reward_model: form.reward_model,
          reward_value: form.reward_value,
          maxPayoutPerContent: form.maxPayoutPerContent,
          flatFeeBonus: form.flatFeeBonus,
          platform_fee_rate:
            platformFeePercent > 0 ? platformFeePercent / 100 : 0,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        if (payload?.code === "INSUFFICIENT_FUNDS") {
          const required = Number(payload.requiredGross || 0);
          const available = Number(payload.availableBalance || 0);
          const missing = Number(payload.missingAmount || 0);

          setError(
            `Fonds insuffisants: disponible $${available.toFixed(2)}, requis $${required.toFixed(2)}.`,
          );

          router.push(
            `/company/wallet?required=${required.toFixed(2)}&available=${available.toFixed(2)}&missing=${missing.toFixed(2)}&returnTo=/company/campaigns/new`,
          );
          return;
        }

        setError(payload?.error || "Erreur lors de la création.");
        return;
      }

      const campaignId = payload?.campaign?.id;
      if (!campaignId) {
        setError("La campagne n'a pas ete creee. Veuillez reessayer.");
        return;
      }

      setSuccess("Campagne lancée avec succès !");
      window.localStorage.removeItem(CAMPAIGN_DRAFT_STORAGE_KEY);
      setTimeout(() => router.push(`/company/campaigns/${campaignId}`), 1500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la création.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Computed ──
  const commission = form.budget_total * (platformFeePercent / 100);
  const budgetCreators = form.budget_total - commission;
  const estimatedCpmTotal =
    form.reward_value > 0 && form.budget_total > 0
      ? Math.floor((budgetCreators / form.reward_value) * 1000).toLocaleString()
      : "—";
  const selectedContentTypeHelp = form.contentType
    ? CONTENT_TYPE_EXPLANATIONS[form.contentType]
    : null;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="pb-16">
      <div className="mx-auto w-full max-w-5xl space-y-8 rounded-[28px] border border-[#E3E8F3] bg-[linear-gradient(180deg,#FFFFFF_0%,#F9FBFF_100%)] p-4 sm:p-6 lg:p-8 shadow-[0_22px_70px_rgba(15,15,20,0.08)]">
        {/* ── Header ── */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#E3E8F3] bg-white p-4 sm:p-5">
          <div className="flex items-center gap-4">
            <Link
              href="/company/campaigns"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-[#5F6472] hover:text-[#0047FF] hover:bg-[#F4F7FF] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <p className="text-xs font-medium text-[#5F6472]">
                Creation guidee
              </p>
              <h1 className="text-2xl font-semibold text-[#0F0F14]">
                Nouvelle campagne
              </h1>
            </div>
          </div>
          <div className="inline-flex items-center rounded-full border border-[#D6E3FF] bg-[#EEF4FF] px-3 py-1 text-xs font-semibold text-[#0047FF]">
            Etape {step} sur {STEPS.length}
          </div>
        </div>

        {/* ── Stepper ── */}
        <div className="rounded-2xl border border-[#E3E8F3] bg-white px-4 py-4 sm:px-5">
          <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-[#EBEEF5]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#0047FF_0%,#2A7BFF_100%)] transition-all"
              style={{ width: `${(step / STEPS.length) * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            {STEPS.map((s, i) => {
              const done = step > s.num;
              const active = step === s.num;
              return (
                <div
                  key={s.num}
                  className="flex-1 flex items-center gap-2 min-w-0"
                >
                  <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${done ? "bg-[#0047FF] text-white" : active ? "border-2 border-[#0047FF] bg-[#EEF4FF] text-[#0047FF]" : "border border-[#D9DFEB] bg-white text-[#8E96A8]"}`}
                    >
                      {done ? <Check className="w-3.5 h-3.5" /> : s.num}
                    </div>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wide hidden sm:block ${active ? "text-[#0047FF]" : done ? "text-[#0F0F14]" : "text-[#8E96A8]"}`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-px transition-all ${done ? "bg-[#7AA7FF]" : "bg-[#E4E8F2]"}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        {/* Mobile label */}
        <p className="sm:hidden text-center text-xs font-semibold text-[#0047FF] -mt-4">
          Étape {step} : {STEPS[step - 1].label}
        </p>

        {/* ── Alerts ── */}
        {error && (
          <div className="flex gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        {success && (
          <div className="flex gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-700">{success}</p>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
          PHASE 1 — DÉTAILS
      ════════════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Informations */}
            <div className={sectionCardCls}>
              <h2 className={sectionTitleCls}>Informations</h2>

              <div>
                <label className={labelCls}>Nom *</label>
                <input
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="Lancement Soda Vert — TikTok"
                  className={inputCls}
                />
              </div>

              <div>
                <div className="flex items-center justify-between gap-4 mb-3">
                  <label className="text-xs font-medium text-[#5F6472] uppercase tracking-wide">
                    Description *
                  </label>
                  <span
                    className={`text-xs ${form.description.length > 480 ? "text-red-500" : "text-[#9898AA]"}`}
                  >
                    {form.description.length}/500
                  </span>
                </div>
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Décrivez votre produit, le contenu attendu, l'ambiance souhaitée…"
                  rows={4}
                  maxLength={500}
                  className={textareaCls}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className={labelCls}>Catégorie *</label>
                  <select
                    value={form.category}
                    onChange={(e) => set("category", e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Selectionner</option>
                    {categoryOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Format du contenu *</label>
                  <select
                    value={form.contentType}
                    onChange={(e) => set("contentType", e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Selectionner</option>
                    {contentTypeOptions.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-[#9898AA] mt-2">
                    Choisissez la forme principale de publication attendue.
                  </p>
                  {selectedContentTypeHelp && (
                    <div className="mt-3 rounded-lg border border-[#D9E6FF] bg-[#F6F9FF] p-3">
                      <p className="text-xs font-semibold text-[#0047FF] uppercase tracking-wide">
                        {selectedContentTypeHelp.title}
                      </p>
                      <p className="text-xs text-[#4A4A5A] mt-1">
                        {selectedContentTypeHelp.description}
                      </p>
                      <p className="text-xs text-[#6B7280] mt-1">
                        {selectedContentTypeHelp.example}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Plateformes */}
            <div className={sectionCardCls}>
              <h2 className={sectionTitleCls}>Plateformes *</h2>
              {platformOptions.length === 0 && (
                <p className="text-xs text-red-600">
                  Aucune plateforme disponible. Vérifiez la taxonomy
                  `social_platform`.
                </p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {platformOptions.map((platform) => {
                  const active = form.platforms.includes(platform);
                  return (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => toggleArr("platforms", platform)}
                      className={`h-11 rounded-xl border font-semibold text-sm transition-all flex items-center justify-center gap-2 ${active ? "border-[#0047FF] bg-[#EEF4FF] text-[#0047FF] shadow-[0_6px_18px_rgba(0,71,255,0.15)]" : "border-[#D9DFEB] text-[#5F6472] bg-white hover:border-[#0047FF] hover:bg-[#F4F7FF]"}`}
                    >
                      {active && <Check className="w-3.5 h-3.5" />}
                      {platform}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Règles */}
            <div className={sectionCardCls}>
              <h2 className={sectionTitleCls}>Regles</h2>

              {/* Requirements tags */}
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    value={form.requirementInput}
                    onChange={(e) => set("requirementInput", e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      (e.preventDefault(),
                      addToArr("requirements", "requirementInput"))
                    }
                    placeholder="Ajouter une règle"
                    className={`${inputCls} flex-1`}
                  />
                  <button
                    type="button"
                    onClick={() => addToArr("requirements", "requirementInput")}
                    className="w-11 h-11 rounded-xl bg-[#EEF4FF] text-[#0047FF] flex items-center justify-center hover:bg-[#DDEAFF] transition-colors flex-shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {form.requirements.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {form.requirements.map((r) => (
                      <span
                        key={r}
                        className="inline-flex items-center gap-2 bg-[#EEF4FF] text-[#0047FF] text-xs font-medium px-3 py-1.5 rounded-lg border border-[#D6E3FF]"
                      >
                        {r}
                        <button
                          onClick={() => removeFromArr("requirements", r)}
                          className="hover:text-red-500 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Promo link */}
              <div className="space-y-3">
                <label className={labelCls}>Lien de promotion</label>
                <input
                  type="url"
                  value={form.promotionLink}
                  onChange={(e) => set("promotionLink", e.target.value)}
                  placeholder="https://example.com"
                  className={inputCls}
                />
              </div>

              {/* Caption mode */}
              <div className="space-y-4">
                <label className={labelCls}>Texte du post (legende)</label>
                <p className="text-xs text-[#4A4A5A]">
                  La legende, c'est le texte qui accompagne la publication.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => set("captionMode", "free")}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${form.captionMode === "free" ? "border-[#0047FF] bg-[#EEF4FF]" : "border-[#D9DFEB] bg-white hover:border-[#C7D9FF]"}`}
                  >
                    <p
                      className={`font-bold text-sm ${form.captionMode === "free" ? "text-[#0047FF]" : "text-[#0F0F14]"}`}
                    >
                      Libre (recommande)
                    </p>
                    <p className="text-xs text-[#9898AA] mt-0.5">
                      Le createur ecrit le texte avec ses mots en respectant vos
                      regles.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => set("captionMode", "fixed")}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${form.captionMode === "fixed" ? "border-[#0047FF] bg-[#EEF4FF]" : "border-[#D9DFEB] bg-white hover:border-[#C7D9FF]"}`}
                  >
                    <p
                      className={`font-bold text-sm ${form.captionMode === "fixed" ? "text-[#0047FF]" : "text-[#0F0F14]"}`}
                    >
                      Imposée
                    </p>
                    <p className="text-xs text-[#9898AA] mt-0.5">
                      Vous donnez un texte exact a copier/coller tel quel.
                    </p>
                  </button>
                </div>
                <div className="rounded-lg border border-[#E4E4EA] bg-[#FAFBFE] p-3">
                  <p className="text-xs text-[#4A4A5A] leading-relaxed">
                    <strong>Quand choisir "Libre" :</strong> pour laisser le
                    createur parler naturellement a son audience.
                  </p>
                  <p className="text-xs text-[#4A4A5A] leading-relaxed mt-1">
                    <strong>Quand choisir "Imposee" :</strong> si vous avez un
                    message legal, promo ou branding qui doit etre exact.
                  </p>
                </div>
                {form.captionMode === "fixed" && (
                  <textarea
                    value={form.captionFixed}
                    onChange={(e) => set("captionFixed", e.target.value)}
                    placeholder="Ecrivez ici le texte exact que le createur doit publier"
                    rows={3}
                    className={`${textareaCls} mt-3`}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
          PHASE 2 — RESSOURCES
      ════════════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Section Ressources */}
            <div className={sectionCardCls}>
              <h2 className={sectionTitleCls}>Ressources pour les createurs</h2>
              <p className="text-sm text-[#4A4A5A]">
                Partagez des liens vers vos dossiers Drive, images, vidéos ou
                documents de briefing.
              </p>

              <div>
                <label className={labelCls}>Ajouter un lien</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9898AA]" />
                    <input
                      type="url"
                      value={form.resourceInput}
                      onChange={(e) => set("resourceInput", e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        (e.preventDefault(),
                        addToArr("resourceLinks", "resourceInput"))
                      }
                      placeholder="https://drive.google.com/..."
                      className={`${inputCls} pl-10`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => addToArr("resourceLinks", "resourceInput")}
                    className="w-11 h-11 rounded-xl bg-[#EEF4FF] text-[#0047FF] flex items-center justify-center hover:bg-[#DDEAFF] transition-colors flex-shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {form.resourceLinks.length === 0 ? (
                <div className="border border-dashed border-[#D6DCE8] rounded-xl px-6 py-10 text-center bg-[#FCFDFF]">
                  <div className="w-10 h-10 rounded-lg bg-[#EEF4FF] flex items-center justify-center mx-auto mb-3">
                    <Link2 className="w-5 h-5 text-[#0047FF]" />
                  </div>
                  <p className="text-sm text-[#4A4A5A]">
                    Aucune ressource ajoutée
                  </p>
                  <p className="text-xs text-[#9898AA] mt-1">
                    Les ressources sont optionnelles mais aident les créateurs.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {form.resourceLinks.map((url, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFF] border border-[#E3E8F3]"
                    >
                      <Link2 className="w-4 h-4 text-[#0047FF] flex-shrink-0" />
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-sm text-[#0047FF] truncate hover:underline"
                      >
                        {url}
                      </a>
                      <button
                        onClick={() => removeFromArr("resourceLinks", url)}
                        className="text-[#9898AA] hover:text-red-500 transition-colors flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
          PHASE 3 — RESTRICTIONS
      ════════════════════════════════════════════════════════════════════ */}
        {step === 3 && (
          <div className="space-y-6">
            {/* Audience */}
            <div className={sectionCardCls}>
              <h2 className={sectionTitleCls}>Criteres d&apos;audience</h2>

              <div>
                <label className={labelCls}>Abonnés minimum</label>
                <div className="relative">
                  <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9898AA]" />
                  <input
                    type="number"
                    value={form.minFollowers || ""}
                    onChange={(e) =>
                      set("minFollowers", parseInt(e.target.value) || 0)
                    }
                    min={0}
                    step={500}
                    placeholder="1000"
                    className={`${inputCls} pl-10`}
                  />
                </div>
                <p className="text-xs text-[#9898AA] mt-2">
                  Les créateurs en dessous de ce seuil ne verront pas la
                  campagne.
                </p>
              </div>
            </div>

            {/* Géographie & Langue */}
            <div className={sectionCardCls}>
              <h2 className={sectionTitleCls}>Geographie & Langue</h2>

              {/* Countries */}
              <div className="space-y-4">
                <label className={labelCls}>
                  Pays acceptés{" "}
                  <span className="text-[#9898AA] normal-case font-normal">
                    (laisser vide = tous)
                  </span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {countryOptions.map((c) => {
                    const sel = form.countries.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => toggleArr("countries", c)}
                        className={`h-9 px-3 rounded-lg border text-xs font-semibold transition-all ${sel ? "bg-[#0047FF] text-white border-[#0047FF]" : "bg-[#F9FAFD] text-[#4A4A5A] border-[#D9DFEB] hover:border-[#0047FF]"}`}
                      >
                        {sel && <Check className="w-3 h-3 inline mr-1" />}
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Languages */}
              <div className="space-y-4">
                <label className={labelCls}>
                  Langues parlées{" "}
                  <span className="text-[#9898AA] normal-case font-normal">
                    (laisser vide = toutes)
                  </span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {languageOptions.map((l) => {
                    const sel = form.languages.includes(l);
                    return (
                      <button
                        key={l}
                        type="button"
                        onClick={() => toggleArr("languages", l)}
                        className={`h-9 px-3 rounded-lg border text-xs font-semibold transition-all ${sel ? "bg-[#0047FF] text-white border-[#0047FF]" : "bg-[#F9FAFD] text-[#4A4A5A] border-[#D9DFEB] hover:border-[#0047FF]"}`}
                      >
                        {sel && <Check className="w-3 h-3 inline mr-1" />}
                        {l}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Visibilité */}
            <div className={sectionCardCls}>
              <h2 className={sectionTitleCls}>Visibilite</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => set("visibility", "public")}
                  className={`p-5 rounded-xl border text-left transition-all ${form.visibility === "public" ? "border-[#0047FF] bg-[#EEF4FF]" : "border-[#D9DFEB] bg-white hover:border-[#0047FF]"}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Globe
                      className={`w-4 h-4 ${form.visibility === "public" ? "text-[#0047FF]" : "text-[#9898AA]"}`}
                    />
                    <p
                      className={`font-semibold text-sm ${form.visibility === "public" ? "text-[#0047FF]" : "text-[#0F0F14]"}`}
                    >
                      Publique
                    </p>
                    {form.visibility === "public" && (
                      <Check className="w-3.5 h-3.5 text-[#0047FF] ml-auto" />
                    )}
                  </div>
                  <p className="text-xs text-[#4A4A5A] leading-relaxed">
                    Tous les créateurs éligibles peuvent postuler librement.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => set("visibility", "restricted")}
                  className={`p-5 rounded-xl border text-left transition-all ${form.visibility === "restricted" ? "border-[#0047FF] bg-[#EEF4FF]" : "border-[#D9DFEB] bg-white hover:border-[#0047FF]"}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Lock
                      className={`w-4 h-4 ${form.visibility === "restricted" ? "text-[#0047FF]" : "text-[#9898AA]"}`}
                    />
                    <p
                      className={`font-semibold text-sm ${form.visibility === "restricted" ? "text-[#0047FF]" : "text-[#0F0F14]"}`}
                    >
                      Restreinte
                    </p>
                    {form.visibility === "restricted" && (
                      <Check className="w-3.5 h-3.5 text-[#0047FF] ml-auto" />
                    )}
                  </div>
                  <p className="text-xs text-[#4A4A5A] leading-relaxed">
                    Seuls les créateurs invités peuvent postuler.
                  </p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
          PHASE 4 — BUDGET
      ════════════════════════════════════════════════════════════════════ */}
        {step === 4 && (
          <div className="space-y-6">
            {/* Type de budget */}
            <div className={sectionCardCls}>
              <h2 className={sectionTitleCls}>Type de budget</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => set("budgetType", "one_time")}
                  className={`p-5 rounded-xl border text-left transition-all ${form.budgetType === "one_time" ? "border-[#0047FF] bg-[#EEF4FF]" : "border-[#D9DFEB] bg-white hover:border-[#0047FF]"}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign
                      className={`w-4 h-4 ${form.budgetType === "one_time" ? "text-[#0047FF]" : "text-[#9898AA]"}`}
                    />
                    <p
                      className={`font-semibold text-sm ${form.budgetType === "one_time" ? "text-[#0047FF]" : "text-[#0F0F14]"}`}
                    >
                      Ponctuel
                    </p>
                    {form.budgetType === "one_time" && (
                      <Check className="w-3.5 h-3.5 text-[#0047FF] ml-auto" />
                    )}
                  </div>
                  <p className="text-xs text-[#4A4A5A]">
                    Montant fixe, sans renouvellement. Idéal pour une campagne
                    avec date de fin.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => set("budgetType", "monthly")}
                  className={`p-5 rounded-xl border text-left transition-all ${form.budgetType === "monthly" ? "border-[#0047FF] bg-[#EEF4FF]" : "border-[#D9DFEB] bg-white hover:border-[#0047FF]"}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <RefreshCw
                      className={`w-4 h-4 ${form.budgetType === "monthly" ? "text-[#0047FF]" : "text-[#9898AA]"}`}
                    />
                    <p
                      className={`font-semibold text-sm ${form.budgetType === "monthly" ? "text-[#0047FF]" : "text-[#0F0F14]"}`}
                    >
                      Mensuel
                    </p>
                    {form.budgetType === "monthly" && (
                      <Check className="w-3.5 h-3.5 text-[#0047FF] ml-auto" />
                    )}
                  </div>
                  <p className="text-xs text-[#4A4A5A]">
                    Budget renouvelé chaque mois automatiquement. Pour une
                    présence continue.
                  </p>
                </button>
              </div>
            </div>

            {/* Montants */}
            <div className={sectionCardCls}>
              <div className="flex items-center justify-between">
                <h2 className={sectionTitleCls}>Configuration du montant</h2>
                <span className="text-xs text-[#6B7280] bg-[#F6F8FD] border border-[#E3E8F3] px-3 py-1 rounded-full">
                  Commission : {platformFeePercent.toFixed(2)}%
                </span>
              </div>

              {/* Budget total */}
              <div>
                <label className={labelCls}>
                  Budget {form.budgetType === "monthly" ? "mensuel" : "total"}{" "}
                  (USD) *{" "}
                  <span className="text-[#9898AA] font-normal normal-case">
                    — minimum $50
                  </span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#0047FF]">
                    $
                  </span>
                  <input
                    type="number"
                    value={form.budget_total || ""}
                    onChange={(e) =>
                      set("budget_total", parseFloat(e.target.value) || 0)
                    }
                    min={50}
                    step={10}
                    placeholder="500"
                    className={`${inputCls} pl-8`}
                  />
                </div>
              </div>

              {/* Breakdown */}
              {form.budget_total >= 50 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="bg-red-50 border border-red-100 rounded p-3">
                    <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wide mb-1">
                      Commission
                    </p>
                    <p className="text-base font-bold text-red-600">
                      ${commission.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 rounded p-3">
                    <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide mb-1">
                      Créateurs
                    </p>
                    <p className="text-base font-bold text-emerald-700">
                      ${budgetCreators.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-[#EEF4FF] border border-[#C7D9FF] rounded p-3">
                    <p className="text-[10px] font-semibold text-[#0047FF] uppercase tracking-wide mb-1">
                      CPM estimé
                    </p>
                    <p className="text-base font-bold text-[#0047FF]">
                      {estimatedCpmTotal}
                    </p>
                  </div>
                </div>
              )}

              {/* Reward Model */}
              <div className="pt-4">
                <label className={labelCls}>
                  Récompense par CPM (1 000 impressions) *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3 mt-3">
                  {REWARD_MODELS.map(({ key, label, desc, icon: Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => set("reward_model", key as RewardModel)}
                      className={`p-3 rounded-xl border text-left text-xs transition-all ${form.reward_model === key ? "border-[#0047FF] bg-[#EEF4FF]" : "border-[#D9DFEB] bg-white hover:border-[#0047FF]"}`}
                    >
                      <Icon
                        className={`w-4 h-4 mb-1 ${form.reward_model === key ? "text-[#0047FF]" : "text-[#9898AA]"}`}
                      />
                      <p
                        className={`font-semibold ${form.reward_model === key ? "text-[#0047FF]" : "text-[#0F0F14]"}`}
                      >
                        {label}
                      </p>
                      <p className="text-[10px] text-[#9898AA] mt-0.5">
                        {desc}
                      </p>
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#0047FF]">
                    $
                  </span>
                  <input
                    type="number"
                    value={form.reward_value || ""}
                    onChange={(e) =>
                      set("reward_value", parseFloat(e.target.value) || 0)
                    }
                    min={0.01}
                    step={0.01}
                    placeholder="0.50"
                    className={`${inputCls} pl-8`}
                  />
                </div>
                <p className="text-xs text-[#9898AA] mt-2">
                  {form.reward_model === "CPM" &&
                    "Montant versé par tranche de 1 000 vues validées"}
                  {form.reward_model === "CPC" &&
                    "Montant versé par clic unique sur le lien de tracking"}
                  {form.reward_model === "CPL" &&
                    "Montant versé par lead qualifié (inscription, formulaire)"}
                  {form.reward_model === "CPA" &&
                    "Montant versé par vente réalisée via lien ou code promo"}
                  {form.reward_model === "Flat Rate" &&
                    "Montant fixe versé par post publié et approuvé"}
                </p>
              </div>
            </div>

            {/* Paramètres optionnels */}
            <div className={sectionCardCls}>
              <h2 className={sectionTitleCls}>Parametres optionnels</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className={labelCls}>
                    Paiement max / contenu (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#9898AA]">
                      $
                    </span>
                    <input
                      type="number"
                      value={form.maxPayoutPerContent || ""}
                      onChange={(e) =>
                        set(
                          "maxPayoutPerContent",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      min={0}
                      step={1}
                      placeholder="0 = illimité"
                      className={`${inputCls} pl-8`}
                    />
                  </div>
                  <p className="text-xs text-[#9898AA] mt-2">
                    Limite le gain maximum par créateur et par post.
                  </p>
                </div>

                <div>
                  <label className={labelCls}>Bonus forfaitaire (USD)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#9898AA]">
                      $
                    </span>
                    <input
                      type="number"
                      value={form.flatFeeBonus || ""}
                      onChange={(e) =>
                        set("flatFeeBonus", parseFloat(e.target.value) || 0)
                      }
                      min={0}
                      step={1}
                      placeholder="0 = aucun"
                      className={`${inputCls} pl-8`}
                    />
                  </div>
                  <p className="text-xs text-[#9898AA] mt-2">
                    Flat fee additionnelle versée en plus du CPM.
                  </p>
                </div>
              </div>
            </div>

            {/* Récapitulatif final */}
            <div className="rounded-2xl border border-[#0047FF] bg-[linear-gradient(125deg,#0047FF_0%,#0062FF_100%)] p-6 text-white space-y-4 shadow-[0_16px_40px_rgba(0,71,255,0.3)]">
              <h3 className="font-semibold text-base">Récapitulatif</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {[
                  ["Campagne", form.title || "—"],
                  ["Plateformes", form.platforms.join(", ") || "—"],
                  [
                    "Budget total",
                    form.budget_total >= 50
                      ? `$${form.budget_total.toFixed(2)}`
                      : "—",
                  ],
                  [
                    "Budget créateurs",
                    form.budget_total >= 50
                      ? `$${budgetCreators.toFixed(2)}`
                      : "—",
                  ],
                  ["Mode de paiement", form.reward_model],
                  [
                    "Rémunération",
                    form.reward_value > 0
                      ? `$${form.reward_value.toFixed(2)} / ${form.reward_model === "Flat Rate" ? "post" : form.reward_model === "CPM" ? "1K vues" : form.reward_model.toLowerCase()}`
                      : "—",
                  ],
                  [
                    "Type",
                    form.budgetType === "monthly" ? "Mensuel" : "Ponctuel",
                  ],
                  [
                    "Visibilité",
                    form.visibility === "public" ? "Publique" : "Restreinte",
                  ],
                ].map(([k, v]) => (
                  <div key={k} className="bg-white/10 rounded p-2.5">
                    <p className="text-white/60 text-xs mb-0.5">{k}</p>
                    <p className="font-medium text-sm truncate">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Navigation buttons ── */}
        <div className="sticky bottom-3 z-20 flex items-center justify-between gap-4 rounded-2xl border border-[#E3E8F3] bg-white/90 p-3 sm:p-4 shadow-[0_10px_35px_rgba(15,15,20,0.08)] backdrop-blur">
          {step === 1 ? (
            <Link
              href="/company/campaigns"
              className="text-sm text-[#4A4A5A] hover:text-[#0F0F14] font-medium transition-colors"
            >
              Annuler
            </Link>
          ) : (
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 h-11 px-5 rounded-xl border border-[#D9DFEB] bg-white text-sm font-semibold text-[#4A4A5A] hover:border-[#0047FF] hover:text-[#0047FF] transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
          )}

          {step < 4 ? (
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-[#0047FF] text-white text-sm font-semibold hover:bg-[#0038CC] transition-all shadow-[0_6px_18px_rgba(0,71,255,0.3)]"
            >
              Suivant
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 h-11 px-8 rounded-xl bg-[#0047FF] text-white text-sm font-bold hover:bg-[#0038CC] disabled:opacity-60 transition-all shadow-[0_8px_24px_rgba(0,71,255,0.35)]"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              {isSubmitting ? "Lancement en cours…" : "Acheter & lancer"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
