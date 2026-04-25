"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { AlertCircle, Loader2, Eye, EyeOff, Building2 } from "lucide-react";

const inputCls =
  "w-full h-11 px-4 rounded-xl border border-[#E4E4EA] bg-[#F4F4F6] text-[#0F0F14] text-sm placeholder-[#9898AA] outline-none focus:border-[#0047FF] focus:bg-white transition-all disabled:opacity-50";
const labelCls =
  "block text-xs font-semibold text-[#0F0F14] uppercase tracking-wide mb-1.5";

export default function CompanySignupPage() {
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    country: "",
    website: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [countries, setCountries] = useState<string[]>([]);

  useEffect(() => {
    const loadCountries = async () => {
      try {
        const res = await fetch("/api/public/taxonomy?type=country");
        if (!res.ok) return;
        const payload = await res.json();
        setCountries(payload.values || []);
      } catch {
        setCountries([]);
      }
    };

    loadCountries();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (
      !formData.email ||
      !formData.password ||
      !formData.companyName ||
      !formData.country
    ) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (formData.password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (!agreed) {
      setError("Vous devez accepter les conditions d'utilisation.");
      return;
    }
    setLoading(true);
    try {
      await signUp(formData.email, formData.password, "company", {
        companyName: formData.companyName,
        country: formData.country,
        website: formData.website,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de l'inscription.",
      );
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F4F4F6] flex flex-col">
      <div className="h-14 flex items-center px-6 border-b border-[#E4E4EA] bg-white">
        <Link href="/" className="text-lg font-bold text-[#0F0F14]">
          Milava<span className="text-[#0047FF]">.</span>
        </Link>
      </div>

      <div className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EEF4FF] flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-[#0047FF]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#0F0F14] tracking-tight">
                Créer un compte marque
              </h1>
              <p className="text-xs text-[#9898AA]">
                Lancez des campagnes et trouvez vos créateurs
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E4E4EA] shadow-[0_4px_24px_rgba(15,15,20,0.06)] p-6 space-y-4">
            {error && (
              <div className="flex gap-2.5 p-3 rounded-xl bg-red-50 border border-red-100">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className={labelCls}>Nom de l'entreprise *</label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Tech Africa"
                    disabled={loading}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Email professionnel *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="contact@entreprise.com"
                    disabled={loading}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Pays *</label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    disabled={loading}
                    className={inputCls}
                  >
                    <option value="">Sélectionner un pays</option>
                    {countries.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Site web</label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://entreprise.com"
                    disabled={loading}
                    className={inputCls}
                  />
                </div>

                <div className="border-t border-[#E4E4EA] pt-4 space-y-4">
                  <div>
                    <label className={labelCls}>Mot de passe *</label>
                    <div className="relative">
                      <input
                        type={showPwd ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="8 caractères minimum"
                        disabled={loading}
                        className={`${inputCls} pr-11`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd(!showPwd)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9898AA]"
                      >
                        {showPwd ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>
                      Confirmer le mot de passe *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirm ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="••••••••"
                        disabled={loading}
                        className={`${inputCls} pr-11`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9898AA]"
                      >
                        {showConfirm ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <div
                    className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${agreed ? "bg-[#0047FF] border-[#0047FF]" : "border-[#D0D0DA] bg-white"}`}
                    onClick={() => setAgreed(!agreed)}
                  >
                    {agreed && (
                      <svg
                        className="w-3 h-3 text-white"
                        viewBox="0 0 12 12"
                        fill="none"
                      >
                        <path
                          d="M2 6l3 3 5-5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-xs text-[#4A4A5A] leading-relaxed">
                    J'accepte les{" "}
                    <Link
                      href="/terms"
                      className="text-[#0047FF] hover:underline"
                    >
                      conditions d'utilisation
                    </Link>{" "}
                    et la{" "}
                    <Link
                      href="/privacy"
                      className="text-[#0047FF] hover:underline"
                    >
                      politique de confidentialité
                    </Link>
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 flex items-center justify-center gap-2 bg-[#0047FF] text-white text-sm font-semibold rounded-xl hover:bg-[#0038CC] disabled:opacity-60 transition-all shadow-[0_2px_12px_rgba(0,71,255,0.2)]"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Création du compte..." : "Créer mon compte marque"}
              </button>
            </form>
          </div>

          <div className="text-center space-y-2 text-sm text-[#4A4A5A]">
            <p>
              Déjà un compte ?{" "}
              <Link
                href="/auth/signin"
                className="text-[#0047FF] font-semibold hover:underline"
              >
                Se connecter
              </Link>
            </p>
            <p>
              Vous êtes créateur ?{" "}
              <Link
                href="/auth/creator-signup"
                className="text-[#0047FF] font-semibold hover:underline"
              >
                S'inscrire ici
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
