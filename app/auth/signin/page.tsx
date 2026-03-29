"use client";

import { useState } from "react";
import Link from "next/link";
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

export default function SignInPage() {
  const { signIn } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    <main className="flex-1 flex flex-col items-center justify-center p-4 bg-[#F4F4F6] min-h-screen">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold font-display text-[#0F0F14] mb-2">
            Milava
          </h1>
          <p className="text-[#4A4A5A]">Connectez-vous à votre compte.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Connexion</CardTitle>
            <CardDescription>
              Entrez vos identifiants pour accéder à votre espace.
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
                  Email
                </label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="contact@exemple.com"
                  disabled={loading}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-[#0F0F14]">
                    Mot de passe
                  </label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs text-[#0047FF] underline"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>
                <Input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {loading ? "Connexion en cours..." : "Se connecter"}
              </Button>
            </form>

            <p className="text-center text-sm text-[#4A4A5A] mt-6">
              Vous n&apos;avez pas de compte ?{" "}
              <span className="inline-block">
                <Link
                  href="/auth/signup"
                  className="text-[#0047FF] font-medium underline mr-2"
                >
                  Entreprise
                </Link>
                ou
                <Link
                  href="/auth/creator-signup"
                  className="text-[#0047FF] font-medium underline ml-2"
                >
                  Créateur
                </Link>
              </span>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
