"use client";

import { useState } from "react";
import Link from "next/link";
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
import { AlertCircle, Loader2 } from "lucide-react";

export default function CompanySignupPage() {
  const router = useRouter();
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
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
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

    if (!agreedToTerms) {
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
    <main className="flex-1 flex flex-col items-center justify-center p-4 bg-[#F4F4F6] min-h-screen">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold font-display text-[#0F0F14] mb-2">
            Inscrivez votre entreprise
          </h1>
          <p className="text-[#4A4A5A]">
            Lancez des campagnes d&apos;influence et trouvez les meilleurs
            créateurs.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Créer un compte Milava</CardTitle>
            <CardDescription>
              Remplissez vos informations pour commencer.
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

              <div>
                <label className="block text-sm font-medium text-[#0F0F14] mb-1">
                  Email professionnel *
                </label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="contact@entreprise.com"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0F0F14] mb-1">
                  Nom de l&apos;entreprise *
                </label>
                <Input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Tech Africa"
                  disabled={loading}
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
                  disabled={loading}
                  className="w-full px-3 py-2 border border-[#E4E4EA] rounded-lg focus:outline-none focus:border-[#0047FF] bg-white text-[#0F0F14]"
                >
                  <option value="">Sélectionnez un pays</option>
                  <option value="Sénégal">Sénégal</option>
                  <option value="Côte d'Ivoire">Côte d&apos;Ivoire</option>
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
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0F0F14] mb-1">
                  Mot de passe *
                </label>
                <Input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0F0F14] mb-1">
                  Confirmer le mot de passe *
                </label>
                <Input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  disabled={loading}
                  className="w-4 h-4 rounded border-[#E4E4EA]"
                />
                <label htmlFor="terms" className="text-sm text-[#4A4A5A]">
                  J&apos;accepte les{" "}
                  <Link href="/terms" className="text-[#0047FF] underline">
                    conditions d&apos;utilisation
                  </Link>
                </label>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {loading ? "Inscription en cours..." : "S'inscrire"}
              </Button>
            </form>

            <p className="text-center text-sm text-[#4A4A5A] mt-6">
              Vous avez déjà un compte ?{" "}
              <Link
                href="/auth/signin"
                className="text-[#0047FF] font-medium underline"
              >
                Se connecter
              </Link>
            </p>

            <p className="text-center text-sm text-[#4A4A5A] mt-4">
              Vous êtes créateur ?{" "}
              <Link
                href="/auth/creator-signup"
                className="text-[#0047FF] font-medium underline"
              >
                S&apos;inscrire comme créateur
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
