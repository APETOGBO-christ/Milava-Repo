"use client";

import { useEffect, useState } from "react";
import { DEFAULT_PROVIDER_CONFIGS } from "@/lib/supabase/payment-providers/factory";

export default function PaymentProvidersPage() {
  const [providers, setProviders] = useState(
    Object.values(DEFAULT_PROVIDER_CONFIGS),
  );
  const [editingProvider, setEditingProvider] = useState<string | null>(null);

  const toggleProvider = (name: string) => {
    setProviders(
      providers.map((p) =>
        p.name === name ? { ...p, isEnabled: !p.isEnabled } : p,
      ),
    );
  };

  const toggleTestMode = (name: string) => {
    setProviders(
      providers.map((p) =>
        p.name === name ? { ...p, isTestMode: !p.isTestMode } : p,
      ),
    );
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Payment Providers</h2>
        <p className="text-gray-600 mt-2">
          Configure and manage payment provider integrations
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {providers.map((provider) => (
          <div
            key={provider.name}
            className="bg-white rounded-lg shadow p-6 border-l-4"
            style={{
              borderColor: provider.isEnabled ? "#3b82f6" : "#d1d5db",
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {provider.displayName}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {provider.isEnabled ? "Enabled" : "Disabled"}
                  {provider.isTestMode && " · Test Mode"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleTestMode(provider.name)}
                  className={`px-3 py-1 text-xs rounded font-medium transition ${
                    provider.isTestMode
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {provider.isTestMode ? "TEST MODE" : "Production"}
                </button>
                <button
                  onClick={() => toggleProvider(provider.name)}
                  className={`px-3 py-1 text-xs rounded font-medium transition ${
                    provider.isEnabled
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {provider.isEnabled ? "ACTIVE" : "INACTIVE"}
                </button>
              </div>
            </div>

            {/* Provider Details */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 pb-4 border-b border-gray-200">
              <div>
                <p className="text-xs text-gray-500">Min Amount</p>
                <p className="font-semibold text-gray-900">
                  {provider.minAmount.toLocaleString()} {provider.currency}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Max Amount</p>
                <p className="font-semibold text-gray-900">
                  {provider.maxAmount.toLocaleString()} {provider.currency}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Fee</p>
                <p className="font-semibold text-gray-900">
                  {(provider.fee * 100).toFixed(1)}%
                  {provider.fixedFee && ` + $${provider.fixedFee}`}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Currency</p>
                <p className="font-semibold text-gray-900">
                  {provider.currency}
                </p>
              </div>
              {provider.countries && (
                <div>
                  <p className="text-xs text-gray-500">Countries</p>
                  <p className="font-semibold text-gray-900">
                    {provider.countries.length} countries
                  </p>
                </div>
              )}
            </div>

            {/* Configuration Status */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    provider.apiKey ? "bg-green-500" : "bg-red-500"
                  }`}
                ></div>
                <span className="text-sm text-gray-600">
                  API Key: {provider.apiKey ? "Configured" : "Not Configured"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    provider.webhookSecret ? "bg-green-500" : "bg-gray-300"
                  }`}
                ></div>
                <span className="text-sm text-gray-600">
                  Webhook:{" "}
                  {provider.webhookSecret ? "Configured" : "Not Configured"}
                </span>
              </div>
            </div>

            {/* Edit Button */}
            <button
              onClick={() =>
                setEditingProvider(
                  editingProvider === provider.name ? null : provider.name,
                )
              }
              className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {editingProvider === provider.name ? "Hide" : "Edit"}{" "}
              Configuration
            </button>

            {/* Edit Form */}
            {editingProvider === provider.name && (
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Key
                  </label>
                  <input
                    type="password"
                    placeholder="Enter API key"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Webhook Secret
                  </label>
                  <input
                    type="password"
                    placeholder="Enter webhook secret"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
                  Save Configuration
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Support Text */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 <strong>Tip:</strong> Use Test Mode to validate payment flows
          before going live. Each provider requires proper API credentials for
          production use.
        </p>
      </div>
    </div>
  );
}
