"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/store/useStore";

interface AnalyticsData {
  totalWithdrawals: number;
  totalFees: number;
  completedTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  monthlyData: Array<{
    month: string;
    amount: number;
    fees: number;
    transactions: number;
  }>;
  providerBreakdown: Array<{
    provider: string;
    amount: number;
    percentage: number;
  }>;
}

export default function AdminAnalytics() {
  const currentUser = useStore((state) => state.currentUser);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalWithdrawals: 0,
    totalFees: 0,
    completedTransactions: 0,
    failedTransactions: 0,
    pendingTransactions: 0,
    monthlyData: [],
    providerBreakdown: [],
  });

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!currentUser?.id) return;

      try {
        const response = await fetch("/api/admin/analytics");

        if (!response.ok) {
          throw new Error("Failed to load analytics");
        }

        const data = await response.json();
        const stats = data.stats;

        setAnalytics({
          totalWithdrawals: stats.totalAmount,
          totalFees: stats.totalFees,
          completedTransactions: stats.completedCount,
          failedTransactions: stats.failedCount,
          pendingTransactions: stats.pendingCount,
          monthlyData: data.monthlyData || [],
          providerBreakdown: data.providerBreakdown || [],
        });
      } catch (error) {
        console.error("Failed to load analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totalTransactions =
    analytics.completedTransactions +
    analytics.failedTransactions +
    analytics.pendingTransactions;
  const avgAmount =
    totalTransactions > 0 ? analytics.totalWithdrawals / totalTransactions : 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Analytics</h2>
        <p className="text-gray-600 mt-2">
          Platform financial analytics and reporting
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 font-medium mb-2">
            Total Withdrawals
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {(analytics.totalWithdrawals / 1000).toFixed(1)}K FCFA
          </div>
          <div className="text-xs text-gray-500 mt-2">
            {totalTransactions} transactions
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 font-medium mb-2">
            Total Fees
          </div>
          <div className="text-3xl font-bold text-green-600">
            {(analytics.totalFees / 1000).toFixed(1)}K FCFA
          </div>
          <div className="text-xs text-gray-500 mt-2">Platform revenue</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 font-medium mb-2">
            Success Rate
          </div>
          <div className="text-3xl font-bold text-blue-600">
            {totalTransactions > 0
              ? (
                  (analytics.completedTransactions / totalTransactions) *
                  100
                ).toFixed(1)
              : 0}
            %
          </div>
          <div className="text-xs text-gray-500 mt-2">
            {analytics.completedTransactions} successful
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 font-medium mb-2">
            Average Amount
          </div>
          <div className="text-3xl font-bold text-purple-600">
            {(avgAmount / 1000).toFixed(1)}K FCFA
          </div>
          <div className="text-xs text-gray-500 mt-2">Per transaction</div>
        </div>
      </div>

      {/* Transaction Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Transaction Status
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Completed</span>
                <span className="text-sm font-medium text-green-600">
                  {analytics.completedTransactions}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{
                    width:
                      totalTransactions > 0
                        ? `${(analytics.completedTransactions / totalTransactions) * 100}%`
                        : 0,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Pending</span>
                <span className="text-sm font-medium text-yellow-600">
                  {analytics.pendingTransactions}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-600 h-2 rounded-full"
                  style={{
                    width:
                      totalTransactions > 0
                        ? `${(analytics.pendingTransactions / totalTransactions) * 100}%`
                        : 0,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Failed</span>
                <span className="text-sm font-medium text-red-600">
                  {analytics.failedTransactions}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-600 h-2 rounded-full"
                  style={{
                    width:
                      totalTransactions > 0
                        ? `${(analytics.failedTransactions / totalTransactions) * 100}%`
                        : 0,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Provider Breakdown */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Payment Provider Breakdown
          </h3>
          <div className="space-y-3">
            {analytics.providerBreakdown.map((provider) => (
              <div key={provider.provider}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">
                    {provider.provider}
                  </span>
                  <span className="text-sm text-gray-600">
                    {(provider.amount / 1000).toFixed(0)}K FCFA (
                    {provider.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${provider.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Monthly Trends
        </h3>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Month
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Fees Collected
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Transactions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {analytics.monthlyData.map((data) => (
                <tr key={data.month} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {data.month}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {(data.amount / 1000).toFixed(0)}K FCFA
                  </td>
                  <td className="px-6 py-4 text-sm text-green-600 font-medium">
                    {(data.fees / 1000).toFixed(1)}K FCFA
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {data.transactions}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
