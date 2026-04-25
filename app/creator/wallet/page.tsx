"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useWallet } from "@/hooks/use-wallet";
import { usePayment } from "@/hooks/use-payment";
import {
  DollarSign,
  TrendingUp,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  X,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  Wallet,
  ChevronRight,
} from "lucide-react";

const WALLET_CACHE_TTL_MS = 30 * 1000;
type WalletCacheEntry = {
  balance: any;
  transactions: any[];
  withdrawals: any[];
  stats: any;
  ts: number;
};
const walletCache = new Map<string, WalletCacheEntry>();

export default function WalletPage() {
  const { authUser } = useAuth();
  const {
    getWallet,
    getBalance,
    getTransactionHistory,
    requestWithdrawal,
    getWithdrawalRequests,
    getWalletStats,
  } = useWallet();
  const { getAllProviders, validateDestination } = usePayment();

  const [balance, setBalance] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  const providers = getAllProviders();

  const refreshFromServer = useCallback(
    async (showMainLoader: boolean) => {
      if (!authUser) return;
      if (showMainLoader) {
        setLoading(true);
      }

      try {
        const [balanceData, txData, wdData, statsData] = await Promise.all([
          getBalance(authUser.id),
          getTransactionHistory(authUser.id, 20),
          getWithdrawalRequests(authUser.id),
          getWalletStats(authUser.id),
        ]);

        setBalance(balanceData);
        setTransactions(txData);
        setWithdrawals(wdData);
        setStats(statsData);

        walletCache.set(authUser.id, {
          balance: balanceData,
          transactions: txData,
          withdrawals: wdData,
          stats: statsData,
          ts: Date.now(),
        });
      } catch (e) {
        console.error(e);
      } finally {
        if (showMainLoader) {
          setLoading(false);
        }
      }
    },
    [
      authUser,
      getBalance,
      getTransactionHistory,
      getWithdrawalRequests,
      getWalletStats,
    ],
  );

  const loadData = useCallback(async () => {
    if (!authUser) return;
    const cached = walletCache.get(authUser.id);
    const isFresh = cached && Date.now() - cached.ts < WALLET_CACHE_TTL_MS;

    if (isFresh) {
      setBalance(cached.balance);
      setTransactions(cached.transactions);
      setWithdrawals(cached.withdrawals);
      setStats(cached.stats);
      setLoading(false);
      void refreshFromServer(false);
      return;
    }

    await refreshFromServer(true);
  }, [authUser, refreshFromServer]);

  useEffect(() => {
    loadData();
  }, [authUser, loadData]);

  const handleRefresh = async () => {
    if (!authUser) return;
    setRefreshing(true);
    await refreshFromServer(false);
    setRefreshing(false);
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!selectedProvider || !destination || !amount || !authUser) {
      setFormError("Tous les champs sont requis");
      return;
    }
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setFormError("Montant invalide");
      return;
    }
    const v = validateDestination(selectedProvider as any, destination);
    if (!v.valid) {
      setFormError(v.error || "Destination invalide");
      return;
    }
    if (balance && num > balance.available) {
      setFormError("Solde insuffisant");
      return;
    }
    setFormLoading(true);
    try {
      await requestWithdrawal(
        authUser.id,
        selectedProvider as any,
        num,
        destination,
      );
      setFormSuccess(true);
      setAmount("");
      setDestination("");
      setSelectedProvider("");
      const updated = await getWithdrawalRequests(authUser.id);
      setWithdrawals(updated);
      setTimeout(() => {
        setShowForm(false);
        setFormSuccess(false);
      }, 2000);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Erreur lors de la demande",
      );
    } finally {
      setFormLoading(false);
    }
  };

  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: {
      label: "En attente",
      color: "bg-amber-50 text-amber-700 border-amber-200",
    },
    processing: {
      label: "En cours",
      color: "bg-[#EEF4FF] text-[#0047FF] border-[#C7D9FF]",
    },
    completed: {
      label: "Complété",
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    failed: { label: "Échoué", color: "bg-red-50 text-red-700 border-red-200" },
    cancelled: {
      label: "Annulé",
      color: "bg-[#F4F4F6] text-[#4A4A5A] border-[#E4E4EA]",
    },
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9898AA] mb-1">
            Finances
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-[-0.03em] text-[#0F0F14]">
            Mon portefeuille
          </h1>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl border border-[#E4E4EA] bg-white text-xs font-semibold text-[#4A4A5A] hover:border-[#0047FF] hover:text-[#0047FF] transition-all"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
          />
          Actualiser
        </button>
      </div>

      {/* Balance hero card */}
      <div className="bg-[#0047FF] rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <p className="text-white/60 text-xs font-semibold uppercase tracking-[0.18em] mb-1">
                Solde disponible
              </p>
              <p className="text-4xl font-bold tracking-tight">
                ${balance?.available?.toFixed(2) ?? "0.00"}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <Wallet className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mb-6">
            <div className="bg-white/10 rounded-xl px-4 py-2.5">
              <p className="text-white/60 text-xs mb-0.5">En attente</p>
              <p className="font-bold">
                ${balance?.pending?.toFixed(2) ?? "0.00"}
              </p>
            </div>
            <div className="bg-white/10 rounded-xl px-4 py-2.5">
              <p className="text-white/60 text-xs mb-0.5">Total gagné</p>
              <p className="font-bold">
                ${stats?.totalEarned?.toFixed(2) ?? "0.00"}
              </p>
            </div>
            <div className="bg-white/10 rounded-xl px-4 py-2.5">
              <p className="text-white/60 text-xs mb-0.5">Total retiré</p>
              <p className="font-bold">
                ${stats?.totalWithdrawn?.toFixed(2) ?? "0.00"}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-white text-[#0047FF] text-sm font-bold hover:bg-white/90 transition-all"
          >
            <ArrowUpRight className="w-4 h-4" />
            Retirer mes gains
          </button>
        </div>
      </div>

      {/* Pending withdrawals */}
      {withdrawals.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E4E4EA] shadow-[0_2px_12px_rgba(15,15,20,0.04)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E4E4EA]">
            <h2 className="font-bold text-[#0F0F14]">Retraits en cours</h2>
          </div>
          <div className="divide-y divide-[#E4E4EA]">
            {withdrawals.map((w) => {
              const s = statusConfig[w.status] || statusConfig.pending;
              return (
                <div
                  key={w.id}
                  className="flex items-center justify-between px-6 py-4 gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#EEF4FF] flex items-center justify-center flex-shrink-0">
                      <ArrowUpRight className="w-4 h-4 text-[#0047FF]" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#0F0F14]">
                        ${w.amount?.toFixed(2)}
                      </p>
                      <p className="text-xs text-[#9898AA]">
                        Via {w.provider} ·{" "}
                        {new Date(w.requested_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${s.color}`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Transactions */}
      <div className="bg-white rounded-2xl border border-[#E4E4EA] shadow-[0_2px_12px_rgba(15,15,20,0.04)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E4E4EA]">
          <h2 className="font-bold text-[#0F0F14]">Historique</h2>
        </div>
        {transactions.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#EEF4FF] flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-5 h-5 text-[#0047FF]" />
            </div>
            <p className="text-sm text-[#4A4A5A]">
              Aucune transaction pour le moment
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E4E4EA]">
            {transactions.map((tx) => {
              const isCredit = tx.kind?.includes("earning");
              return (
                <div key={tx.id} className="flex items-center gap-4 px-6 py-4">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isCredit ? "bg-emerald-50" : "bg-red-50"}`}
                  >
                    {isCredit ? (
                      <ArrowDownRight className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#0F0F14] text-sm truncate">
                      {tx.description}
                    </p>
                    <p className="text-xs text-[#9898AA]">
                      {new Date(tx.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <p
                    className={`font-bold text-sm flex-shrink-0 ${isCredit ? "text-emerald-600" : "text-red-500"}`}
                  >
                    {tx.amount > 0 ? "+" : ""}${Math.abs(tx.amount)?.toFixed(2)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Withdrawal modal overlay */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4"
          onClick={() => !formLoading && setShowForm(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4E4EA]">
              <h3 className="font-bold text-[#0F0F14]">Retirer mes gains</h3>
              <button
                onClick={() => !formLoading && setShowForm(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F4F4F6] text-[#9898AA] hover:text-[#0F0F14] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {formSuccess && (
                <div className="flex gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-emerald-900 text-sm">
                      Demande envoyée
                    </p>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      Traitement sous 24h ouvrées.
                    </p>
                  </div>
                </div>
              )}
              {formError && !formSuccess && (
                <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{formError}</p>
                </div>
              )}

              <form onSubmit={handleWithdraw} className="space-y-5">
                {/* Provider */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#0F0F14] uppercase tracking-wide">
                    Méthode de paiement
                  </label>
                  <div className="space-y-2">
                    {providers.map((p) => (
                      <label
                        key={p.code}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${selectedProvider === p.code ? "border-[#0047FF] bg-[#EEF4FF]" : "border-[#E4E4EA] bg-[#F4F4F6] hover:border-[#C7D9FF]"}`}
                      >
                        <input
                          type="radio"
                          name="provider"
                          value={p.code}
                          checked={selectedProvider === p.code}
                          onChange={(e) => setSelectedProvider(e.target.value)}
                          className="hidden"
                          disabled={formLoading || formSuccess}
                        />
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedProvider === p.code ? "border-[#0047FF]" : "border-[#D0D0DA]"}`}
                        >
                          {selectedProvider === p.code && (
                            <div className="w-2 h-2 rounded-full bg-[#0047FF]" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-[#0F0F14] text-sm">
                            {p.displayName}
                          </p>
                          <p className="text-xs text-[#9898AA]">
                            {p.description}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Destination */}
                {selectedProvider && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#0F0F14] uppercase tracking-wide">
                      Destination
                    </label>
                    <input
                      type="text"
                      placeholder={
                        providers.find((p) => p.code === selectedProvider)
                          ?.phoneFormat || "Numéro ou IBAN"
                      }
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      disabled={formLoading || formSuccess}
                      className="w-full h-11 px-4 rounded-xl border border-[#E4E4EA] bg-[#F4F4F6] text-sm text-[#0F0F14] placeholder-[#9898AA] outline-none focus:border-[#0047FF] focus:bg-white transition-all"
                    />
                  </div>
                )}

                {/* Amount */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#0F0F14] uppercase tracking-wide">
                    Montant (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#0047FF]">
                      $
                    </span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      disabled={formLoading || formSuccess}
                      min="5"
                      max={balance?.available || 0}
                      className="w-full h-11 pl-8 pr-4 rounded-xl border border-[#E4E4EA] bg-[#F4F4F6] text-sm text-[#0F0F14] placeholder-[#9898AA] outline-none focus:border-[#0047FF] focus:bg-white transition-all"
                    />
                  </div>
                  <p className="text-xs text-[#9898AA]">
                    Solde disponible :{" "}
                    <span className="font-semibold text-[#0F0F14]">
                      ${balance?.available?.toFixed(2) ?? "0.00"}
                    </span>{" "}
                    · Minimum : $5.00
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={
                    formLoading ||
                    formSuccess ||
                    !selectedProvider ||
                    !destination ||
                    !amount
                  }
                  className="w-full h-11 flex items-center justify-center gap-2 bg-[#0047FF] text-white text-sm font-semibold rounded-xl hover:bg-[#0038CC] disabled:opacity-50 transition-all"
                >
                  {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {formSuccess ? "Demande envoyée !" : "Confirmer le retrait"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
