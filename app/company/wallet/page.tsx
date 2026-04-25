"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  ArrowRight,
  CreditCard,
  Loader2,
  RefreshCw,
  Wallet,
} from "lucide-react";

type CompanyPaymentProvider =
  | "wave"
  | "orange_money"
  | "mtn_momo"
  | "card"
  | "bank_transfer";

type FundingSummary = {
  availableBalance: number;
  totalDeposits: number;
  totalRefunds: number;
  totalCommitted: number;
  transactions: Array<{
    id: string;
    provider: CompanyPaymentProvider;
    direction: "deposit" | "refund";
    amount: number;
    status: string;
    requested_at: string;
    processed_at?: string | null;
    external_reference?: string | null;
  }>;
};

const providers: Array<{ value: CompanyPaymentProvider; label: string }> = [
  { value: "card", label: "Carte bancaire" },
  { value: "wave", label: "Wave" },
  { value: "orange_money", label: "Orange Money" },
  { value: "mtn_momo", label: "MTN MoMo" },
  { value: "bank_transfer", label: "Virement bancaire" },
];

function formatUsd(value: number) {
  return `$${Number(value || 0).toFixed(2)}`;
}

export default function CompanyWalletPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [summary, setSummary] = useState<FundingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [amount, setAmount] = useState("");
  const [provider, setProvider] = useState<CompanyPaymentProvider>("card");

  const required = Number(searchParams.get("required") || 0);
  const available = Number(searchParams.get("available") || 0);
  const missing = Number(searchParams.get("missing") || 0);
  const returnTo = searchParams.get("returnTo") || "/company/campaigns/new";

  const canGoBackToValidation = useMemo(() => {
    if (!summary) return false;
    if (!Number.isFinite(required) || required <= 0) return true;
    return summary.availableBalance >= required;
  }, [required, summary]);

  const loadSummary = useCallback(async (isSilent = false) => {
    setError(null);
    if (isSilent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const supabase = createBrowserSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Session expirée. Veuillez vous reconnecter.");
      }

      const response = await fetch("/api/company/wallet", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload?.error || "Impossible de charger le portefeuille.",
        );
      }

      setSummary(payload.summary as FundingSummary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const handleDeposit = async () => {
    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Saisissez un montant valide.");
      return;
    }

    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const supabase = createBrowserSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Session expirée. Veuillez vous reconnecter.");
      }

      const response = await fetch("/api/company/wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          amount: parsedAmount,
          provider,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Recharge impossible.");
      }

      setSummary(payload.summary as FundingSummary);
      setSuccess("Recharge effectuee avec succes.");
      setAmount("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Recharge impossible.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-[#0047FF]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9898AA] mb-1">
            Espace marque
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-[-0.03em] text-[#0F0F14]">
            Portefeuille
          </h1>
        </div>
        <button
          type="button"
          onClick={() => void loadSummary(true)}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-[#D9DFEB] bg-white text-sm font-semibold text-[#4A4A5A] hover:border-[#0047FF] hover:text-[#0047FF] transition-all"
        >
          {refreshing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Actualiser
        </button>
      </div>

      {required > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-sm font-semibold text-amber-800">
            Fonds insuffisants pour la campagne
          </p>
          <p className="text-sm text-amber-700 mt-1">
            Requis: {formatUsd(required)} | Disponible: {formatUsd(available)} |
            Manquant: {formatUsd(missing)}
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[#E3E8F3] bg-white p-5 shadow-[0_4px_16px_rgba(15,15,20,0.04)]">
          <p className="text-xs uppercase font-semibold tracking-wide text-[#9898AA]">
            Solde disponible
          </p>
          <p className="text-3xl font-bold text-[#0F0F14] mt-2">
            {formatUsd(summary?.availableBalance || 0)}
          </p>
        </div>

        <div className="rounded-2xl border border-[#E3E8F3] bg-white p-5 shadow-[0_4px_16px_rgba(15,15,20,0.04)]">
          <p className="text-xs uppercase font-semibold tracking-wide text-[#9898AA]">
            Total recharge
          </p>
          <p className="text-2xl font-bold text-[#0F0F14] mt-2">
            {formatUsd(summary?.totalDeposits || 0)}
          </p>
        </div>

        <div className="rounded-2xl border border-[#E3E8F3] bg-white p-5 shadow-[0_4px_16px_rgba(15,15,20,0.04)]">
          <p className="text-xs uppercase font-semibold tracking-wide text-[#9898AA]">
            Fonds engages
          </p>
          <p className="text-2xl font-bold text-[#0F0F14] mt-2">
            {formatUsd(summary?.totalCommitted || 0)}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-[#E3E8F3] bg-white p-5 sm:p-6 space-y-5 shadow-[0_6px_20px_rgba(15,15,20,0.05)]">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-[#0047FF]" />
          <h2 className="text-lg font-semibold text-[#0F0F14]">
            Recharger le portefeuille
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#374151] mb-2">
              Montant (USD)
            </label>
            <input
              type="number"
              min={1}
              step={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="500"
              className="w-full h-11 px-3 border border-[#D9DFEB] rounded-xl bg-white text-[#0F0F14] text-sm placeholder-[#A2A8B7] outline-none focus:border-[#0047FF] focus:ring-4 focus:ring-[#DCE7FF] transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-2">
              Moyen
            </label>
            <select
              value={provider}
              onChange={(e) =>
                setProvider(e.target.value as CompanyPaymentProvider)
              }
              className="w-full h-11 px-3 border border-[#D9DFEB] rounded-xl bg-white text-[#0F0F14] text-sm outline-none focus:border-[#0047FF] focus:ring-4 focus:ring-[#DCE7FF] transition-all"
            >
              {providers.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleDeposit}
            disabled={submitting}
            className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-[#0047FF] text-white text-sm font-semibold hover:bg-[#0038CC] disabled:opacity-60 transition-all shadow-[0_6px_18px_rgba(0,71,255,0.3)]"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CreditCard className="w-4 h-4" />
            )}
            {submitting ? "Recharge en cours..." : "Recharger maintenant"}
          </button>

          <button
            type="button"
            onClick={() => router.push(returnTo)}
            disabled={!canGoBackToValidation}
            className="inline-flex items-center gap-2 h-11 px-5 rounded-xl border border-[#D9DFEB] bg-white text-sm font-semibold text-[#4A4A5A] hover:border-[#0047FF] hover:text-[#0047FF] disabled:opacity-50 transition-all"
          >
            Revenir valider la campagne
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-[#E3E8F3] bg-white p-5 sm:p-6 shadow-[0_6px_20px_rgba(15,15,20,0.05)]">
        <h2 className="text-lg font-semibold text-[#0F0F14] mb-4">
          Dernieres transactions
        </h2>

        {!summary || summary.transactions.length === 0 ? (
          <p className="text-sm text-[#6B7280]">
            Aucune transaction pour le moment.
          </p>
        ) : (
          <div className="space-y-2">
            {summary.transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#E3E8F3] bg-[#FAFCFF] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-[#0F0F14] capitalize">
                    {tx.direction === "deposit" ? "Recharge" : "Remboursement"}{" "}
                    - {tx.provider.replace("_", " ")}
                  </p>
                  <p className="text-xs text-[#6B7280]">
                    {new Date(tx.requested_at).toLocaleString("fr-FR")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[#0047FF]">
                    {formatUsd(tx.amount)}
                  </p>
                  <p className="text-xs text-[#6B7280]">{tx.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
