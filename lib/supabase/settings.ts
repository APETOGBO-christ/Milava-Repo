// Platform settings management
import { createAdminSupabaseClient } from "./admin";

export interface PlatformSetting {
  id: string;
  key: string;
  value: Record<string, unknown>;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface PlatformSettingsData {
  withdrawal_threshold: { amount: number; currency: string };
  max_withdrawal_amount: { amount: number; currency: string };
  processing_days: { days: number };
  platform_fee_percentage: { percentage: number };
  auto_processing: { enabled: boolean };
  maintenance_mode: { enabled: boolean };
  max_simultaneous_payments: { count: number };
}

export class SettingsService {
  private supabase = createAdminSupabaseClient();
  private cache: Map<string, PlatformSetting> = new Map();

  async getAllSettings(): Promise<PlatformSettingsData> {
    const { data, error } = await this.supabase
      .from("platform_settings")
      .select();

    if (error) throw new Error(`Failed to fetch settings: ${error.message}`);

    const settings: any = {};
    (data || []).forEach((setting: PlatformSetting) => {
      settings[setting.key] = setting.value;
      this.cache.set(setting.key, setting);
    });

    return settings as PlatformSettingsData;
  }

  async getSetting(
    key: keyof PlatformSettingsData,
  ): Promise<PlatformSetting | null> {
    // Check cache first
    if (this.cache.has(key)) {
      return this.cache.get(key) || null;
    }

    const { data, error } = await this.supabase
      .from("platform_settings")
      .select()
      .eq("key", key)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(`Failed to fetch setting: ${error.message}`);
    }

    if (data) {
      this.cache.set(key, data);
    }

    return data || null;
  }

  async updateSetting(
    key: keyof PlatformSettingsData,
    value: Record<string, unknown>,
    description?: string,
  ): Promise<PlatformSetting> {
    const { data, error } = await this.supabase
      .from("platform_settings")
      .upsert({
        key,
        value,
        description,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to update setting: ${error.message}`);

    // Update cache
    this.cache.set(key, data);

    return data;
  }

  async clearCache(): Promise<void> {
    this.cache.clear();
  }

  // Helper methods for common operations
  async isMaintenanceMode(): Promise<boolean> {
    try {
      const setting = await this.getSetting("maintenance_mode");
      return (setting?.value as any)?.enabled || false;
    } catch {
      return false;
    }
  }

  async getWithdrawalThreshold(): Promise<number> {
    try {
      const setting = await this.getSetting("withdrawal_threshold");
      return (setting?.value as any)?.amount || 5000;
    } catch {
      return 5000;
    }
  }

  async getMaxWithdrawalAmount(): Promise<number> {
    try {
      const setting = await this.getSetting("max_withdrawal_amount");
      return (setting?.value as any)?.amount || 500000;
    } catch {
      return 500000;
    }
  }

  async getPlatformFeePercentage(): Promise<number> {
    try {
      const setting = await this.getSetting("platform_fee_percentage");
      return (setting?.value as any)?.percentage || 2.5;
    } catch {
      return 2.5;
    }
  }

  async isAutoProcessingEnabled(): Promise<boolean> {
    try {
      const setting = await this.getSetting("auto_processing");
      return (setting?.value as any)?.enabled || false;
    } catch {
      return false;
    }
  }
}

export const settingsService = new SettingsService();
