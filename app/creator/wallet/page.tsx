"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useWallet } from "@/hooks/use-wallet";
import { usePayment } from "@/hooks/use-payment";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
} from "lucide-react";
import Link from "next/link";

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
  const { getAllProviders, validateDestination, calculateFee } = usePayment();

  const [wallet, setWallet] = useState<any>(null);
  const [balance, setBalance] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Withdrawal form state
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  const providers = getAllProviders();

  // Load wallet data
  const loadData = useCallback(async () => {
    if (!authUser) return;

    try {
      const [
        walletData,
        balanceData,
        transactionsData,
        withdrawalsData,
        statsData,
      ] = await Promise.all([
        getWallet(authUser.id),
        getBalance(authUser.id),
        getTransactionHistory(authUser.id, 20),
        getWithdrawalRequests(authUser.id),
        getWalletStats(authUser.id),
      ]);

      setWallet(walletData);
      setBalance(balanceData);
      setTransactions(transactionsData);
      setWithdrawals(withdrawalsData);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading wallet:", error);
    } finally {
      setLoading(false);
    }
  }, [
    authUser,
    getWallet,
    getBalance,
    getTransactionHistory,
    getWithdrawalRequests,
    getWalletStats,
  ]);

  useEffect(() => {
    loadData();
  }, [authUser, loadData]);

  const handleRefresh = async () => {
    if (!authUser) return;
    setRefreshing(true);
    try {
      const [balanceData, transactionsData, withdrawalsData] =
        await Promise.all([
          getBalance(authUser.id),
          getTransactionHistory(authUser.id, 20),
          getWithdrawalRequests(authUser.id),
        ]);
      setBalance(balanceData);
      setTransactions(transactionsData);
      setWithdrawals(withdrawalsData);
    } catch (error) {
      console.error("Error refreshing:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSubmitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedProvider || !destination || !amount || !authUser) {
      setFormError("Tous les champs sont requis");
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError("Montant invalide");
      return;
    }

    // Validate destination
    const destValidation = validateDestination(
      selectedProvider as any,
      destination,
    );
    if (!destValidation.valid) {
      setFormError(destValidation.error || "Destination invalide");
      return;
    }

    // Check balance
    if (balance && numAmount > balance.available) {
      setFormError("Solde insuffisant");
      return;
    }

    setFormLoading(true);
    try {
      await requestWithdrawal(
        authUser.id,
        selectedProvider as any,
        numAmount,
        destination,
      );

      setFormSuccess(true);
      setAmount("");
      setDestination("");
      setSelectedProvider("");

      // Reload withdrawals
      const updatedWithdrawals = await getWithdrawalRequests(authUser.id);
      setWithdrawals(updatedWithdrawals);

      // Close modal after 2 seconds
      setTimeout(() => {
        setShowWithdrawalForm(false);
        setFormSuccess(false);
      }, 2000);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur lors de la demande";
      setFormError(message);
    } finally {
      setFormLoading(false);
    }
  };

  const getTransactionIcon = (kind: string) => {
    switch (kind) {
      case "earning_pending":
      case "earning_released":
        return <ArrowDownRight className="w-4 h-4 text-green-500" />;
      case "withdrawal_requested":
      case "withdrawal_completed":
      case "withdrawal_failed":
        return <ArrowUpRight className="w-4 h-4 text-red-500" />;
      default:
        return <ArrowDownRight className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTransactionColor = (kind: string) => {
    if (kind.includes("earning")) return "text-green-600";
    if (kind.includes("withdrawal")) return "text-red-600";
    return "text-gray-600";
  };

  const getWithdrawalStatusBadge = (status: string) => {
    const styles: Record<
      string,
      { bg: string; text: string; icon: any; label: string }
    > = {
      pending: {
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        icon: <Clock className="w-3 h-3" />,
        label: "En attente",
      },
      processing: {
        bg: "bg-blue-100",
        text: "text-blue-700",
        icon: <RefreshCw className="w-3 h-3" />,
        label: "En cours",
      },
      completed: {
        bg: "bg-green-100",
        text: "text-green-700",
        icon: <CheckCircle2 className="w-3 h-3" />,
        label: "Complété",
      },
      failed: {
        bg: "bg-red-100",
        text: "text-red-700",
        icon: <X className="w-3 h-3" />,
        label: "Échoué",
      },
      cancelled: {
        bg: "bg-gray-100",
        text: "text-gray-700",
        icon: <X className="w-3 h-3" />,
        label: "Annulé",
      },
    };

    const style = styles[status] || styles.pending;
    return (
      <Badge className={`${style.bg} ${style.text} gap-1`}>
        {style.icon}
        {style.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Mon Portefeuille</h1>
          <p className="text-gray-600">Gérez vos gains et retraits</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
          Actualiser
        </Button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Available Balance */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-900">
              Solde disponible
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {balance?.available.toLocaleString("fr-FR", {
                minimumFractionDigits: 0,
              })}{" "}
              FCFA
            </div>
            <p className="text-xs text-green-700 mt-1">Prêt à retirer</p>
          </CardContent>
        </Card>

        {/* Pending Balance */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-900">
              Solde en attente
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">
              {balance?.pending.toLocaleString("fr-FR", {
                minimumFractionDigits: 0,
              })}{" "}
              FCFA
            </div>
            <p className="text-xs text-yellow-700 mt-1">
              À partir des gains en cours
            </p>
          </CardContent>
        </Card>

        {/* Total Earned */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total gagnés</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalEarned.toLocaleString("fr-FR", {
                minimumFractionDigits: 0,
              })}{" "}
              FCFA
            </div>
            <p className="text-xs text-gray-500 mt-1">Tous les temps</p>
          </CardContent>
        </Card>

        {/* Total Withdrawn */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total retiré</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalWithdrawn.toLocaleString("fr-FR", {
                minimumFractionDigits: 0,
              })}{" "}
              FCFA
            </div>
            <p className="text-xs text-gray-500 mt-1">Paiements complétés</p>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawal Button */}
      <div className="mb-8">
        <Button
          onClick={() => setShowWithdrawalForm(true)}
          className="bg-green-500 hover:bg-green-600"
        >
          <ArrowUpRight className="w-4 h-4 mr-2" />
          Demander un retrait
        </Button>
      </div>

      {/* Pending Withdrawals */}
      {withdrawals.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Demandes de retrait en cours</CardTitle>
            <CardDescription>Statut de vos retraits récents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {withdrawals.map((withdrawal) => (
                <div
                  key={withdrawal.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {withdrawal.amount.toLocaleString("fr-FR", {
                        minimumFractionDigits: 0,
                      })}{" "}
                      FCFA
                    </p>
                    <div className="flex gap-4 mt-2 text-sm text-gray-600">
                      <span>Via {withdrawal.provider}</span>
                      <span>
                        {new Date(withdrawal.requested_at).toLocaleDateString(
                          "fr-FR",
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    {getWithdrawalStatusBadge(withdrawal.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des transactions</CardTitle>
          <CardDescription>Tous vos gains et retraits</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Aucune transaction pour le moment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border-b last:border-b-0"
                >
                  <div className="flex items-center gap-4 flex-1">
                    {getTransactionIcon(transaction.kind)}
                    <div>
                      <p className="font-semibold text-gray-900">
                        {transaction.description}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.created_at).toLocaleDateString(
                          "fr-FR",
                        )}{" "}
                        {new Date(transaction.created_at).toLocaleTimeString(
                          "fr-FR",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`text-right font-semibold ${getTransactionColor(transaction.kind)}`}
                  >
                    {transaction.amount > 0 ? "+" : ""}
                    {transaction.amount.toLocaleString("fr-FR", {
                      minimumFractionDigits: 0,
                    })}{" "}
                    FCFA
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Withdrawal Form Modal */}
      <Dialog open={showWithdrawalForm} onOpenChange={setShowWithdrawalForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Demander un retrait</DialogTitle>
            <DialogDescription>
              Retirez vos gains disponibles vers votre compte
            </DialogDescription>
          </DialogHeader>

          {formSuccess && (
            <div className="flex gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900">
                  Demande soumise !
                </p>
                <p className="text-sm text-green-700 mt-1">
                  Votre demande de retrait a été enregistrée. Nous
                  l&apos;accorderons rapidement.
                </p>
              </div>
            </div>
          )}

          {formError && !formSuccess && (
            <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Erreur</p>
                <p className="text-sm text-red-700 mt-1">{formError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmitWithdrawal} className="space-y-6">
            {/* Provider Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Méthode de paiement <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {providers.map((provider) => (
                  <label
                    key={provider.code}
                    className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="radio"
                      name="provider"
                      value={provider.code}
                      checked={selectedProvider === provider.code}
                      onChange={(e) => setSelectedProvider(e.target.value)}
                      disabled={formLoading || formSuccess}
                    />
                    <div>
                      <p className="font-medium text-gray-900">
                        {provider.displayName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {provider.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Destination Input */}
            {selectedProvider && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destination <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder={
                    providers.find((p) => p.code === selectedProvider)
                      ?.phoneFormat || "Numéro de compte ou téléphone"
                  }
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  disabled={formLoading || formSuccess}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {providers.find((p) => p.code === selectedProvider)
                    ?.requiresPhone
                    ? "Entrez votre numéro de téléphone au format international"
                    : "Numéro de compte bancaire"}
                </p>
              </div>
            )}

            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Montant <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                placeholder="Montant"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={formLoading || formSuccess}
                min="1"
                max={balance?.available || 0}
              />
              {amount && selectedProvider && (
                <p className="text-xs text-gray-600 mt-2">
                  Vous recevrez:{" "}
                  {amount &&
                    providers.find((p) => p.code === selectedProvider)
                      ?.minAmount &&
                    (
                      parseFloat(amount) -
                      (parseFloat(amount) *
                        (providers.find((p) => p.code === selectedProvider)
                          ?.feePercentage || 0)) /
                        100
                    ).toLocaleString("fr-FR", {
                      minimumFractionDigits: 0,
                    })}{" "}
                  FCFA
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Solde disponible: {balance?.available.toLocaleString("fr-FR")}{" "}
                FCFA
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600"
              disabled={
                formLoading ||
                formSuccess ||
                !selectedProvider ||
                !destination ||
                !amount
              }
            >
              {formLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {formSuccess ? "Demande envoyée" : "Confirmer le retrait"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
