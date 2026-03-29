"use client";

import { useState, useCallback } from "react";
import {
  WalletService,
  WalletAccount,
  WalletTransaction,
  WithdrawalRequest,
  WithdrawalStatus,
  PaymentProvider,
} from "@/lib/supabase/wallet";

const service = new WalletService();

export function useWallet() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getWallet = useCallback(async (creatorId: string) => {
    setError(null);
    setLoading(true);
    try {
      const wallet = await service.getWallet(creatorId);
      return wallet;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement du portefeuille";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getBalance = useCallback(async (creatorId: string) => {
    setError(null);
    setLoading(true);
    try {
      const balance = await service.getBalance(creatorId);
      return balance;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement du solde";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getTransactionHistory = useCallback(
    async (creatorId: string, limit: number = 50, offset: number = 0) => {
      setError(null);
      setLoading(true);
      try {
        const transactions = await service.getTransactionHistory(
          creatorId,
          limit,
          offset,
        );
        return transactions;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Erreur lors du chargement de l&apos;historique";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const addEarning = useCallback(
    async (creatorId: string, postId: string, gainAmount: number) => {
      setError(null);
      setLoading(true);
      try {
        await service.addEarning(creatorId, postId, gainAmount);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Erreur lors de l&apos;ajout du gain";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const releasePendingBalance = useCallback(
    async (creatorId: string, amount: number) => {
      setError(null);
      setLoading(true);
      try {
        await service.releasePendingBalance(creatorId, amount);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Erreur lors de la libération des fonds";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const requestWithdrawal = useCallback(
    async (
      creatorId: string,
      provider: PaymentProvider,
      amount: number,
      destination: string,
    ) => {
      setError(null);
      setLoading(true);
      try {
        const withdrawal = await service.requestWithdrawal(
          creatorId,
          provider,
          amount,
          destination,
        );
        return withdrawal;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Erreur lors de la demande de retrait";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const getWithdrawalRequests = useCallback(
    async (creatorId: string, status?: WithdrawalStatus) => {
      setError(null);
      setLoading(true);
      try {
        const withdrawals = await service.getWithdrawalRequests(
          creatorId,
          status,
        );
        return withdrawals;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Erreur lors du chargement des retraits";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const getWithdrawalRequest = useCallback(async (id: string) => {
    setError(null);
    setLoading(true);
    try {
      const withdrawal = await service.getWithdrawalRequest(id);
      return withdrawal;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement du retrait";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelWithdrawal = useCallback(
    async (withdrawalId: string, reason: string) => {
      setError(null);
      setLoading(true);
      try {
        await service.cancelWithdrawal(withdrawalId, reason);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Erreur lors de l&apos;annulation du retrait";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const getWalletStats = useCallback(async (creatorId: string) => {
    setError(null);
    setLoading(true);
    try {
      const stats = await service.getWalletStats(creatorId);
      return stats;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des statistiques";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getWallet,
    getBalance,
    getTransactionHistory,
    addEarning,
    releasePendingBalance,
    requestWithdrawal,
    getWithdrawalRequests,
    getWithdrawalRequest,
    cancelWithdrawal,
    getWalletStats,
  };
}
