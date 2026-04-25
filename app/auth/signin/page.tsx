"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";

export default function SignInPage() {
  const { signIn } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!formData.email || !formData.password) {
      setError("Veuillez entrer votre email et mot de passe.");
      return;
    }
    setLoading(true);
    try {
      await signIn(formData.email, formData.password);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la connexion.",
      );
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F4F4F6] flex flex-col">
      {/* Top bar */}
      <div className="h-14 flex items-center px-6 border-b border-[#E4E4EA] bg-white">
        <Link href="/" className="text-lg font-bold text-[#0F0F14]">
          Milava<span className="text-[#0047FF]">.</span>
        </Link>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold text-[#0F0F14] tracking-tight">
              Bon retour
            </h1>
            <p className="text-sm text-[#4A4A5A]">
              Connectez-vous à votre espace Milava
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#E4E4EA] shadow-[0_4px_24px_rgba(15,15,20,0.06)] p-6 space-y-4">
            {error && (
              <div className="flex gap-2.5 p-3 rounded-xl bg-red-50 border border-red-100">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#0F0F14] uppercase tracking-wide">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="contact@exemple.com"
                  disabled={loading}
                  className="w-full h-11 px-4 rounded-xl border border-[#E4E4EA] bg-[#F4F4F6] text-[#0F0F14] text-sm placeholder-[#9898AA] outline-none focus:border-[#0047FF] focus:bg-white transition-all"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#0F0F14] uppercase tracking-wide">
                    Mot de passe
                  </label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs text-[#0047FF] hover:underline"
                  >
                    Oublié ?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    disabled={loading}
                    className="w-full h-11 px-4 pr-11 rounded-xl border border-[#E4E4EA] bg-[#F4F4F6] text-[#0F0F14] text-sm placeholder-[#9898AA] outline-none focus:border-[#0047FF] focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9898AA] hover:text-[#4A4A5A]"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 flex items-center justify-center gap-2 bg-[#0047FF] text-white text-sm font-semibold rounded-xl hover:bg-[#0038CC] disabled:opacity-60 transition-all shadow-[0_2px_12px_rgba(0,71,255,0.2)]"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Connexion..." : "Se connecter"}
              </button>
            </form>
          </div>

          <div className="text-center text-sm text-[#4A4A5A]">
            Pas encore de compte ?{" "}
            <Link
              href="/auth/signup"
              className="text-[#0047FF] font-semibold hover:underline"
            >
              Marque
            </Link>{" "}
            ou{" "}
            <Link
              href="/auth/creator-signup"
              className="text-[#0047FF] font-semibold hover:underline"
            >
              Créateur
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
