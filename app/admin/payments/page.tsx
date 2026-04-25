"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { LoadingSkeleton } from "@/components/ui/error-display";
import { toast } from "@/lib/toast";

const PAGE_SIZE = 25;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
);

interface WithdrawalRequest {
  id: string;
  creator_id: string;
  amount: number;
  provider: string;
  status: string;
  destination_label: string;
  requested_at: string;
  processed_at: string | null;
}

export default function PaymentsPage() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<string | null>(
    null,
  );

  useEffect(() => {
    loadWithdrawals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const loadWithdrawals = async () => {
    try {
      setLoading(true);
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from("withdrawal_requests")
        .select("*", { count: "exact" });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const {
        data,
        error: err,
        count,
      } = await query
        .order("requested_at", {
          ascending: false,
        })
        .range(from, to);

      if (err) throw err;
      setWithdrawals(data || []);
      setTotal(count || 0);
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load withdrawals";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const updateWithdrawalStatus = async (id: string, status: string) => {
    try {
      const { error: err } = await supabase
        .from("withdrawal_requests")
        .update({ status, updated_at: new Date() })
        .eq("id", id);

      if (err) throw err;

      toast.success(`Withdrawal marked as ${status}`);
      await loadWithdrawals();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update withdrawal";
      toast.error(message);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">
          Withdrawal Requests
        </h2>
        <p className="text-gray-600 mt-2">
          Manage and process creator withdrawals
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        {["all", "pending", "processing", "completed", "failed"].map(
          (status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                statusFilter === status
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-200 text-gray-700 hover:border-gray-300"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ),
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton count={5} height="h-16" />
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="p-8 text-center text-gray-600">
            No withdrawal requests found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Creator ID
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Provider
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Destination
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Requested
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {withdrawals.map((withdrawal) => (
                  <tr
                    key={withdrawal.id}
                    className={`hover:bg-gray-50 transition ${
                      selectedWithdrawal === withdrawal.id ? "bg-blue-50" : ""
                    }`}
                  >
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {withdrawal.creator_id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {withdrawal.amount.toLocaleString()} FCFA
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                      {withdrawal.provider}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {withdrawal.destination_label}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(withdrawal.status)}`}
                      >
                        {withdrawal.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(withdrawal.requested_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {withdrawal.status === "pending" && (
                          <>
                            <button
                              onClick={() =>
                                updateWithdrawalStatus(
                                  withdrawal.id,
                                  "processing",
                                )
                              }
                              className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() =>
                                updateWithdrawalStatus(withdrawal.id, "failed")
                              }
                              className="px-3 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 transition"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {withdrawal.status === "processing" && (
                          <button
                            onClick={() =>
                              updateWithdrawalStatus(withdrawal.id, "completed")
                            }
                            className="px-3 py-1 text-xs bg-green-50 text-green-600 rounded hover:bg-green-100 transition"
                          >
                            Complete
                          </button>
                        )}
                        <button
                          onClick={() =>
                            setSelectedWithdrawal(
                              selectedWithdrawal === withdrawal.id
                                ? null
                                : withdrawal.id,
                            )
                          }
                          className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition"
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && total > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <p>
            Page {page} / {totalPages} ({total} retraits)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1}
              className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
