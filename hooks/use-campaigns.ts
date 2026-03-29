import { useState, useCallback } from "react";
import {
  CampaignService,
  Campaign,
  Candidature,
  RewardModel,
  CandidatureWithCreator,
  CreatorProfile,
} from "@/lib/supabase/campaigns";

export function useCampaigns() {
  const service = new CampaignService();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // CREATE campaign
  const createCampaign = useCallback(
    async (
      companyId: string,
      data: {
        title: string;
        description: string;
        objectives: string;
        budget_total: number;
        reward_model: RewardModel;
        reward_value: number;
      },
    ): Promise<Campaign | null> => {
      setLoading(true);
      setError("");
      try {
        const campaign = await service.createCampaign(companyId, data);
        return campaign;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error creating campaign",
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // GET single campaign
  const getCampaign = useCallback(
    async (campaignId: string): Promise<Campaign | null> => {
      setLoading(true);
      setError("");
      try {
        const campaign = await service.getCampaign(campaignId);
        return campaign;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error fetching campaign",
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // GET company campaigns
  const getCompanyCampaigns = useCallback(
    async (companyId: string): Promise<Campaign[]> => {
      setLoading(true);
      setError("");
      try {
        const campaigns = await service.getCompanyCampaigns(companyId);
        return campaigns;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error fetching campaigns",
        );
        return [];
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // GET active campaigns
  const getActiveCampaigns = useCallback(
    async (limit = 20, offset = 0): Promise<Campaign[]> => {
      setLoading(true);
      setError("");
      try {
        const campaigns = await service.getActiveCampaigns(limit, offset);
        return campaigns;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error fetching campaigns",
        );
        return [];
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // UPDATE campaign status
  const updateCampaignStatus = useCallback(
    async (
      campaignId: string,
      status: "draft" | "active" | "completed",
    ): Promise<Campaign | null> => {
      setLoading(true);
      setError("");
      try {
        const campaign = await service.updateCampaignStatus(campaignId, status);
        return campaign;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error updating campaign",
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // CREATE candidature
  const createCandidature = useCallback(
    async (
      campaignId: string,
      creatorId: string,
    ): Promise<Candidature | null> => {
      setLoading(true);
      setError("");
      try {
        const candidature = await service.createCandidature(
          campaignId,
          creatorId,
        );
        return candidature;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error creating candidature",
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // GET campaign candidatures
  const getCampaignCandidatures = useCallback(
    async (campaignId: string): Promise<CandidatureWithCreator[]> => {
      setLoading(true);
      setError("");
      try {
        const candidatures = await service.getCampaignCandidatures(campaignId);
        return candidatures;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error fetching candidatures",
        );
        return [];
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // ACCEPT candidature
  const acceptCandidature = useCallback(
    async (candidatureId: string): Promise<Candidature | null> => {
      setLoading(true);
      setError("");
      try {
        const candidature = await service.acceptCandidature(candidatureId);
        return candidature;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error accepting candidature",
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // REJECT candidature
  const rejectCandidature = useCallback(
    async (candidatureId: string): Promise<Candidature | null> => {
      setLoading(true);
      setError("");
      try {
        const candidature = await service.rejectCandidature(candidatureId);
        return candidature;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error rejecting candidature",
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // GET creator candidatures
  const getCreatorCandidatures = useCallback(
    async (creatorId: string): Promise<Candidature[]> => {
      setLoading(true);
      setError("");
      try {
        const candidatures = await service.getCreatorCandidatures(creatorId);
        return candidatures;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error fetching candidatures",
        );
        return [];
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // SEARCH creators
  const searchCreators = useCallback(
    async (
      specialties?: string[],
      minFollowers?: number,
      minEngagement?: number,
      verifiedOnly?: boolean,
    ): Promise<CreatorProfile[]> => {
      setLoading(true);
      setError("");
      try {
        const creators = await service.searchCreators(
          specialties,
          minFollowers,
          minEngagement,
          verifiedOnly,
        );
        return creators;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error searching creators",
        );
        return [];
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    loading,
    error,
    createCampaign,
    getCampaign,
    getCompanyCampaigns,
    getActiveCampaigns,
    updateCampaignStatus,
    createCandidature,
    getCampaignCandidatures,
    getCreatorCandidatures,
    acceptCandidature,
    rejectCandidature,
    searchCreators,
  };
}
