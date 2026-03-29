import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export type RewardModel = "CPM" | "CPC" | "CPL" | "CPA" | "Flat Rate";
export type CampaignStatus = "draft" | "active" | "completed";
export type CandidatureStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "auto_accepted";

export interface Campaign {
  id: string;
  company_id: string;
  title: string;
  description: string;
  objectives: string;
  budget_total: number;
  budget_usable: number;
  reward_model: RewardModel;
  reward_value: number; // CPM = per 1000 impressions, CPC = per click, etc.
  status: CampaignStatus;
  created_at: string;
  updated_at: string;
  started_at?: string;
  ended_at?: string;
}

export interface Candidature {
  id: string;
  campaign_id: string;
  creator_id: string;
  status: CandidatureStatus;
  created_at: string;
  auto_accept_at: string; // created_at + 72h
  response_at?: string;
  rejected_at?: string;
  accepted_at?: string;
}

export interface CreatorProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  specialties: string[]; // e.g., ["Fashion", "Beauty", "Tech"]
  follower_count: number;
  engagement_rate: number;
  verified_networks_count: number;
  bio?: string;
  country?: string;
  phone?: string;
  image?: string;
}

export interface CandidatureWithCreator extends Candidature {
  creator: CreatorProfile;
}

export class CampaignService {
  private supabase = createBrowserSupabaseClient();

  // CREATE campaign
  async createCampaign(
    companyId: string,
    data: {
      title: string;
      description: string;
      objectives: string;
      budget_total: number;
      reward_model: RewardModel;
      reward_value: number;
    },
  ): Promise<Campaign> {
    const commission = data.budget_total * 0.2; // 20% commission
    const budgetUsable = data.budget_total - commission;

    const { data: campaign, error } = await this.supabase
      .from("campaigns")
      .insert({
        company_id: companyId,
        title: data.title,
        description: data.description,
        objectives: data.objectives,
        budget_total: data.budget_total,
        budget_usable: budgetUsable,
        reward_model: data.reward_model,
        reward_value: data.reward_value,
        status: "draft",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return campaign;
  }

  // GET single campaign
  async getCampaign(campaignId: string): Promise<Campaign> {
    const { data, error } = await this.supabase
      .from("campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (error) throw error;
    return data;
  }

  // GET company campaigns
  async getCompanyCampaigns(companyId: string): Promise<Campaign[]> {
    const { data, error } = await this.supabase
      .from("campaigns")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // GET active campaigns (for marketplace)
  async getActiveCampaigns(limit = 20, offset = 0): Promise<Campaign[]> {
    const { data, error } = await this.supabase
      .from("campaigns")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  }

  // UPDATE campaign status
  async updateCampaignStatus(
    campaignId: string,
    status: CampaignStatus,
  ): Promise<Campaign> {
    const updates: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === "active") {
      updates.started_at = new Date().toISOString();
    }

    const { data, error } = await this.supabase
      .from("campaigns")
      .update(updates)
      .eq("id", campaignId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // CREATE candidature
  async createCandidature(
    campaignId: string,
    creatorId: string,
  ): Promise<Candidature> {
    const now = new Date();
    const autoAcceptAt = new Date(now.getTime() + 72 * 60 * 60 * 1000); // +72h

    const { data, error } = await this.supabase
      .from("candidatures")
      .insert({
        campaign_id: campaignId,
        creator_id: creatorId,
        status: "pending",
        created_at: now.toISOString(),
        auto_accept_at: autoAcceptAt.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // GET candidature
  async getCandidature(candidatureId: string): Promise<Candidature> {
    const { data, error } = await this.supabase
      .from("candidatures")
      .select("*")
      .eq("id", candidatureId)
      .single();

    if (error) throw error;
    return data;
  }

  // GET campaign candidatures with creators
  async getCampaignCandidatures(
    campaignId: string,
  ): Promise<CandidatureWithCreator[]> {
    const { data, error } = await this.supabase
      .from("candidatures")
      .select(
        `
        *,
        creator:creator_id (
          id,
          user_id,
          first_name,
          last_name,
          specialties,
          follower_count,
          engagement_rate,
          verified_networks_count,
          bio,
          country,
          phone,
          image
        )
      `,
      )
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // GET creator candidatures
  async getCreatorCandidatures(creatorId: string): Promise<Candidature[]> {
    const { data, error } = await this.supabase
      .from("candidatures")
      .select("*")
      .eq("creator_id", creatorId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // UPDATE candidature status
  async updateCandidatureStatus(
    candidatureId: string,
    status: CandidatureStatus,
  ): Promise<Candidature> {
    const updates: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === "accepted") {
      updates.accepted_at = new Date().toISOString();
      updates.response_at = new Date().toISOString();
    } else if (status === "rejected") {
      updates.rejected_at = new Date().toISOString();
      updates.response_at = new Date().toISOString();
    } else if (status === "auto_accepted") {
      updates.accepted_at = new Date().toISOString();
    }

    const { data, error } = await this.supabase
      .from("candidatures")
      .update(updates)
      .eq("id", candidatureId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ACCEPT candidature (company action)
  async acceptCandidature(candidatureId: string): Promise<Candidature> {
    return this.updateCandidatureStatus(candidatureId, "accepted");
  }

  // REJECT candidature (company action)
  async rejectCandidature(candidatureId: string): Promise<Candidature> {
    return this.updateCandidatureStatus(candidatureId, "rejected");
  }

  // GET creator profile
  async getCreatorProfile(creatorId: string): Promise<CreatorProfile> {
    const { data, error } = await this.supabase
      .from("creator_profiles")
      .select("*")
      .eq("id", creatorId)
      .single();

    if (error) throw error;
    return data;
  }

  // SEARCH creators by specialties
  async searchCreators(
    specialties?: string[],
    minFollowers?: number,
    minEngagement?: number,
    verifiedOnly?: boolean,
  ): Promise<CreatorProfile[]> {
    let query = this.supabase.from("creator_profiles").select("*");

    if (minFollowers) {
      query = query.gte("follower_count", minFollowers);
    }

    if (minEngagement) {
      query = query.gte("engagement_rate", minEngagement);
    }

    if (verifiedOnly) {
      query = query.gt("verified_networks_count", 0);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Filter by specialties (client-side for now)
    if (specialties && specialties.length > 0) {
      return (
        data?.filter((creator: CreatorProfile) =>
          specialties.some((spec) => creator.specialties?.includes(spec)),
        ) || []
      );
    }

    return data || [];
  }
}
