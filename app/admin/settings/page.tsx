"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { toast } from "@/lib/toast";

interface SettingsFormData {
  withdrawal_threshold: number;
  max_withdrawal_amount: number;
  processing_days: number;
  platform_fee_percentage: number;
  auto_processing: boolean;
  maintenance_mode: boolean;
  max_simultaneous_payments: number;
}

export default function AdminSettings() {
  const router = useRouter();
  const currentUser = useStore((state) => state.currentUser);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SettingsFormData>({
    withdrawal_threshold: 5000,
    max_withdrawal_amount: 500000,
    processing_days: 2,
    platform_fee_percentage: 2.5,
    auto_processing: false,
    maintenance_mode: false,
    max_simultaneous_payments: 5,
  });

  useEffect(() => {
    const loadSettings = async () => {
      if (!currentUser?.id) {
        router.push("/auth/signin");
        return;
      }

      try {
        const response = await fetch("/api/admin/settings");

        if (!response.ok) {
          toast.error("Access denied or failed to load settings");
          router.push("/admin");
          return;
        }

        setIsAdmin(true);

        const data = await response.json();
        const allSettings = data.settings;

        setSettings({
          withdrawal_threshold:
            (allSettings.withdrawal_threshold as number) || 5000,
          max_withdrawal_amount:
            (allSettings.max_withdrawal_amount as number) || 500000,
          processing_days: (allSettings.processing_days as number) || 2,
          platform_fee_percentage:
            (allSettings.platform_fee_percentage as number) || 2.5,
          auto_processing: (allSettings.auto_processing as boolean) || false,
          maintenance_mode: (allSettings.maintenance_mode as boolean) || false,
          max_simultaneous_payments:
            (allSettings.max_simultaneous_payments as number) || 5,
        });
      } catch (error) {
        console.error("Failed to load settings:", error);
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [currentUser, router]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        fetch("/api/admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: "withdrawal_threshold",
            value: settings.withdrawal_threshold,
          }),
        }),
        fetch("/api/admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: "max_withdrawal_amount",
            value: settings.max_withdrawal_amount,
          }),
        }),
        fetch("/api/admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: "processing_days",
            value: settings.processing_days,
          }),
        }),
        fetch("/api/admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: "platform_fee_percentage",
            value: settings.platform_fee_percentage,
          }),
        }),
        fetch("/api/admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: "auto_processing",
            value: settings.auto_processing,
          }),
        }),
        fetch("/api/admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: "maintenance_mode",
            value: settings.maintenance_mode,
          }),
        }),
        fetch("/api/admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: "max_simultaneous_payments",
            value: settings.max_simultaneous_payments,
          }),
        }),
      ]);

      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save settings",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-600 mt-2">
          Configure platform-wide payment and withdrawal settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Withdrawal Limits
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Amount (FCFA)
              </label>
              <input
                type="number"
                value={settings.withdrawal_threshold}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    withdrawal_threshold: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum amount creators must withdraw
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Amount (FCFA)
              </label>
              <input
                type="number"
                value={settings.max_withdrawal_amount}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    max_withdrawal_amount: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum amount per withdrawal request
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Processing Days
              </label>
              <input
                type="number"
                value={settings.processing_days}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    processing_days: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Expected processing time in days
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Fee Configuration
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Platform Fee (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={settings.platform_fee_percentage}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    platform_fee_percentage: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Platform fee percentage on all withdrawals
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Simultaneous Payments
              </label>
              <input
                type="number"
                value={settings.max_simultaneous_payments}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    max_simultaneous_payments: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum concurrent payment processes
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          System Controls
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <label className="font-medium text-gray-900">
                Auto-Processing
              </label>
              <p className="text-xs text-gray-600 mt-1">
                Automatically process approved withdrawals
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setSettings({
                  ...settings,
                  auto_processing: !settings.auto_processing,
                })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.auto_processing ? "bg-green-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.auto_processing ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <label className="font-medium text-gray-900">
                Maintenance Mode
              </label>
              <p className="text-xs text-gray-600 mt-1">
                Disable all payment processing
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setSettings({
                  ...settings,
                  maintenance_mode: !settings.maintenance_mode,
                })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.maintenance_mode ? "bg-red-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.maintenance_mode ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
        <button
          onClick={() => router.back()}
          className="px-6 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
