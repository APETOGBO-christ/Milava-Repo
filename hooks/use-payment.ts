"use client";

import { useState, useCallback } from "react";
import { PaymentService, PaymentProviderConfig } from "@/lib/supabase/payments";
import { PaymentProvider, WithdrawalRequest } from "@/lib/supabase/wallet";

const service = new PaymentService();

export function usePayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getProviderConfig = useCallback((provider: PaymentProvider) => {
    return service.getProviderConfig(provider);
  }, []);

  const getAllProviders = useCallback(() => {
    return service.getAllProviders();
  }, []);

  const validateDestination = useCallback(
    (provider: PaymentProvider, destination: string) => {
      return service.validateDestination(provider, destination);
    },
    [],
  );

  const calculateFee = useCallback(
    (amount: number, provider: PaymentProvider) => {
      setError(null);
      try {
        const feeInfo = service.calculateFee(amount, provider);
        return feeInfo;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Erreur lors du calcul des frais";
        setError(message);
        throw err;
      }
    },
    [],
  );

  const validateWithdrawal = useCallback(
    async (withdrawal: WithdrawalRequest) => {
      setError(null);
      try {
        const validation = await service.validateWithdrawal(withdrawal);
        if (!validation.valid) {
          setError(validation.error || "Validation failed");
        }
        return validation;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erreur lors de la validation";
        setError(message);
        throw err;
      }
    },
    [],
  );

  const initiatePayment = useCallback(async (withdrawal: WithdrawalRequest) => {
    setError(null);
    setLoading(true);
    try {
      const result = await service.initiatePayment(withdrawal);
      if (!result.success) {
        setError(result.error || "Payment initiation failed");
      }
      return result;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erreur lors de l&apos;initiation du paiement";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPaymentProviderIcon = useCallback(
    (provider: PaymentProvider): string => {
      return service.getPaymentProviderIcon(provider);
    },
    [],
  );

  return {
    loading,
    error,
    getProviderConfig,
    getAllProviders,
    validateDestination,
    calculateFee,
    validateWithdrawal,
    initiatePayment,
    getPaymentProviderIcon,
  };
}
