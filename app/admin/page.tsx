"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

interface AdminStats {
  totalWithdrawals: number;
  pendingApprovals: number;
  completedToday: number;
  totalProcessed: number;
  totalFees: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalWithdrawals: 0,
    pendingApprovals: 0,
    completedToday: 0,
    totalProcessed: 0,
    totalFees: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || "",
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
        );

        // Fetch withdrawal stats from database
        const { data: withdrawals, error: withdrawalError } = await supabase
          .from("withdrawal_requests")
          .select("*");

        if (withdrawalError) throw withdrawalError;

        if (withdrawals) {
          const pending = withdrawals.filter(
            (w: any) => w.status === "pending",
          ).length;
          const today = new Date().toISOString().split("T")[0];
          const completedToday = withdrawals.filter(
            (w: any) =>
              w.status === "completed" && w.processed_at?.startsWith(today),
          ).length;
          const completed = withdrawals.filter(
            (w: any) => w.status === "completed",
          );
          const totalProcessed = completed.reduce(
            (sum: number, w: any) => sum + parseInt(w.amount || 0),
            0,
          );

          setStats({
            totalWithdrawals: withdrawals.length,
            pendingApprovals: pending,
            completedToday,
            totalProcessed,
            totalFees: 0, // TODO: Calculate from transactions
          });
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load stats";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600 mt-2">
          Overview of platform payments and withdrawals
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          label="Total Withdrawals"
          value={stats.totalWithdrawals}
          color="blue"
        />
        <StatCard
          label="Pending Approvals"
          value={stats.pendingApprovals}
          color="yellow"
        />
        <StatCard
          label="Completed Today"
          value={stats.completedToday}
          color="green"
        />
        <StatCard
          label="Total Processed"
          value={`${(stats.totalProcessed / 1000000).toFixed(1)}M FCFA`}
          color="purple"
        />
        <StatCard
          label="Total Fees"
          value={`${(stats.totalFees / 1000000).toFixed(1)}M FCFA`}
          color="indigo"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/payments"
            className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 font-medium hover:bg-blue-100 transition text-center"
          >
            Review Withdrawals
          </a>
          <a
            href="/admin/providers"
            className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-700 font-medium hover:bg-green-100 transition text-center"
          >
            Payment Providers
          </a>
          <a
            href="/admin/analytics"
            className="px-4 py-3 bg-purple-50 border border-purple-200 rounded-lg text-purple-700 font-medium hover:bg-purple-100 transition text-center"
          >
            View Analytics
          </a>
        </div>
      </div>

      {/* Recent Withdrawals Preview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Activity
        </h3>
        <p className="text-gray-600 text-center py-8">
          Go to{" "}
          <a href="/admin/payments" className="text-blue-600 hover:underline">
            Withdrawal Requests
          </a>{" "}
          to view and manage withdrawals
        </p>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  color: "blue" | "yellow" | "green" | "purple" | "indigo";
}

function StatCard({ label, value, color }: StatCardProps) {
  const colors = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
    green: "bg-green-50 border-green-200 text-green-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700",
    indigo: "bg-indigo-50 border-indigo-200 text-indigo-700",
  };

  return (
    <div className={`rounded-lg border p-6 ${colors[color]}`}>
      <p className="text-sm font-medium opacity-75">{label}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}
