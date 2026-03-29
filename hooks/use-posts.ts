"use client";

import { useState, useCallback } from "react";
import {
  PostService,
  Post,
  PostMetrics,
  PostGains,
  PostStatus,
} from "@/lib/supabase/posts";

const service = new PostService();

export function usePosts() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitPost = useCallback(
    async (campaignId: string, creatorId: string, contentUrl: string) => {
      setError(null);
      setLoading(true);
      try {
        const post = await service.submitPost(
          campaignId,
          creatorId,
          contentUrl,
        );
        return post;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erreur lors de la soumission";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const getPost = useCallback(async (postId: string) => {
    setError(null);
    setLoading(true);
    try {
      const post = await service.getPost(postId);
      return post;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur lors du chargement";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getCreatorPosts = useCallback(
    async (creatorId: string, campaignId?: string) => {
      setError(null);
      setLoading(true);
      try {
        const posts = await service.getCreatorPosts(creatorId, campaignId);
        return posts;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erreur lors du chargement";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const getCampaignPosts = useCallback(async (campaignId: string) => {
    setError(null);
    setLoading(true);
    try {
      const posts = await service.getCampaignPosts(campaignId);
      return posts;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur lors du chargement";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePostStatus = useCallback(
    async (postId: string, status: PostStatus) => {
      setError(null);
      setLoading(true);
      try {
        const post = await service.updatePostStatus(postId, status);
        return post;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erreur lors de la mise à jour";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const recordMetrics = useCallback(
    async (
      postId: string,
      creatorId: string,
      campaignId: string,
      metrics: {
        impressions: number;
        clicks: number;
        leads: number;
        conversions: number;
        shares: number;
        engagements: number;
      },
    ) => {
      setError(null);
      setLoading(true);
      try {
        const recorded = await service.recordMetrics(
          postId,
          creatorId,
          campaignId,
          metrics,
        );
        return recorded;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Erreur lors de l&apos;enregistrement des métriques";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const getLatestMetrics = useCallback(async (postId: string) => {
    setError(null);
    setLoading(true);
    try {
      const metrics = await service.getLatestMetrics(postId);
      return metrics;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur lors du chargement";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAllMetrics = useCallback(async (postId: string) => {
    setError(null);
    setLoading(true);
    try {
      const metrics = await service.getAllMetrics(postId);
      return metrics;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur lors du chargement";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateGains = useCallback(
    async (postId: string, rewardModel: string, rewardValue: number) => {
      setError(null);
      setLoading(true);
      try {
        const gains = await service.calculateGains(
          postId,
          rewardModel,
          rewardValue,
        );
        return gains;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Erreur lors du calcul des gains";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const getPostGains = useCallback(async (postId: string) => {
    setError(null);
    setLoading(true);
    try {
      const gains = await service.getPostGains(postId);
      return gains;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur lors du chargement";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getCreatorTotalGains = useCallback(async (creatorId: string) => {
    setError(null);
    setLoading(true);
    try {
      const total = await service.getCreatorTotalGains(creatorId);
      return total;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur lors du chargement";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getCreatorPostsWithMetrics = useCallback(async (creatorId: string) => {
    setError(null);
    setLoading(true);
    try {
      const posts = await service.getCreatorPostsWithMetrics(creatorId);
      return posts;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur lors du chargement";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getCampaignMetrics = useCallback(async (campaignId: string) => {
    setError(null);
    setLoading(true);
    try {
      const metrics = await service.getCampaignMetrics(campaignId);
      return metrics;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur lors du chargement";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    submitPost,
    getPost,
    getCreatorPosts,
    getCampaignPosts,
    updatePostStatus,
    recordMetrics,
    getLatestMetrics,
    getAllMetrics,
    calculateGains,
    getPostGains,
    getCreatorTotalGains,
    getCreatorPostsWithMetrics,
    getCampaignMetrics,
  };
}
