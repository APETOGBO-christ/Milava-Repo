import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export type PostStatus =
  | "submitted"
  | "approved"
  | "rejected"
  | "auto_approved";
export type MetricType =
  | "impressions"
  | "clicks"
  | "leads"
  | "conversions"
  | "shares"
  | "engagements";

export interface Post {
  id: string;
  campaign_id: string;
  creator_id: string;
  content_url: string;
  status: PostStatus;
  submitted_at: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PostMetrics {
  id: string;
  post_id: string;
  creator_id: string;
  campaign_id: string;
  impressions: number;
  clicks: number;
  leads: number;
  conversions: number;
  shares: number;
  engagements: number;
  collected_at: string;
  created_at: string;
}

export interface PostGains {
  id: string;
  post_id: string;
  creator_id: string;
  campaign_id: string;
  reward_model: string;
  metric_value: number;
  reward_value: number;
  total_gain: number;
  calculated_at: string;
  created_at: string;
}

export class PostService {
  private supabase = createBrowserSupabaseClient();

  async submitPost(
    campaignId: string,
    creatorId: string,
    contentUrl: string,
  ): Promise<Post> {
    const { data, error } = await this.supabase
      .from("posts")
      .insert({
        campaign_id: campaignId,
        creator_id: creatorId,
        content_url: contentUrl,
        status: "submitted",
      })
      .select()
      .single();

    if (error) throw error;
    return data as Post;
  }

  async getPost(postId: string): Promise<Post | null> {
    const { data, error } = await this.supabase
      .from("posts")
      .select("*")
      .eq("id", postId)
      .single();

    if (error && error.code === "PGRST116") return null;
    if (error) throw error;
    return data as Post;
  }

  async getCreatorPosts(
    creatorId: string,
    campaignId?: string,
  ): Promise<Post[]> {
    let query = this.supabase
      .from("posts")
      .select("*")
      .eq("creator_id", creatorId);

    if (campaignId) {
      query = query.eq("campaign_id", campaignId);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw error;
    return (data || []) as Post[];
  }

  async getCampaignPosts(campaignId: string): Promise<Post[]> {
    const { data, error } = await this.supabase
      .from("posts")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []) as Post[];
  }

  async updatePostStatus(postId: string, status: PostStatus): Promise<Post> {
    const approvedAt =
      status === "approved" || status === "auto_approved"
        ? new Date().toISOString()
        : null;

    const { data, error } = await this.supabase
      .from("posts")
      .update({
        status,
        ...(approvedAt && { approved_at: approvedAt }),
      })
      .eq("id", postId)
      .select()
      .single();

    if (error) throw error;
    return data as Post;
  }

  async recordMetrics(
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
  ): Promise<PostMetrics> {
    const { data, error } = await this.supabase
      .from("metrics")
      .insert({
        post_id: postId,
        creator_id: creatorId,
        campaign_id: campaignId,
        impressions: metrics.impressions,
        clicks: metrics.clicks,
        leads: metrics.leads,
        conversions: metrics.conversions,
        shares: metrics.shares,
        engagements: metrics.engagements,
        collected_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as PostMetrics;
  }

  async getLatestMetrics(postId: string): Promise<PostMetrics | null> {
    const { data, error } = await this.supabase
      .from("metrics")
      .select("*")
      .eq("post_id", postId)
      .order("collected_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code === "PGRST116") return null;
    if (error) throw error;
    return data as PostMetrics;
  }

  async getAllMetrics(postId: string): Promise<PostMetrics[]> {
    const { data, error } = await this.supabase
      .from("metrics")
      .select("*")
      .eq("post_id", postId)
      .order("collected_at", { ascending: true });

    if (error) throw error;
    return (data || []) as PostMetrics[];
  }

  async calculateGains(
    postId: string,
    rewardModel: string,
    rewardValue: number,
  ): Promise<PostGains | null> {
    const metrics = await this.getLatestMetrics(postId);
    if (!metrics) return null;

    let metricValue = 0;
    let gain = 0;

    switch (rewardModel) {
      case "CPM":
        metricValue = metrics.impressions;
        gain = (metricValue / 1000) * rewardValue;
        break;
      case "CPC":
        metricValue = metrics.clicks;
        gain = metricValue * rewardValue;
        break;
      case "CPL":
        metricValue = metrics.leads;
        gain = metricValue * rewardValue;
        break;
      case "CPA":
        metricValue = metrics.conversions;
        gain = metricValue * rewardValue;
        break;
      case "Flat Rate":
        metricValue = 1;
        gain = rewardValue;
        break;
    }

    const { data, error } = await this.supabase
      .from("gains")
      .insert({
        post_id: postId,
        creator_id: metrics.creator_id,
        campaign_id: metrics.campaign_id,
        reward_model: rewardModel,
        metric_value: metricValue,
        reward_value: rewardValue,
        total_gain: gain,
        calculated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as PostGains;
  }

  async getPostGains(postId: string): Promise<PostGains | null> {
    const { data, error } = await this.supabase
      .from("gains")
      .select("*")
      .eq("post_id", postId)
      .order("calculated_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code === "PGRST116") return null;
    if (error) throw error;
    return data as PostGains;
  }

  async getCreatorTotalGains(creatorId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from("gains")
      .select("total_gain")
      .eq("creator_id", creatorId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return ((data || []) as PostGains[]).reduce(
      (sum, gain) => sum + gain.total_gain,
      0,
    );
  }

  async getCreatorPostsWithMetrics(creatorId: string): Promise<
    Array<{
      post: Post;
      metrics: PostMetrics | null;
      gains: PostGains | null;
    }>
  > {
    const posts = await this.getCreatorPosts(creatorId);
    if (posts.length === 0) {
      return [];
    }

    const postIds = posts.map((post) => post.id);

    const [metricsResult, gainsResult] = await Promise.all([
      this.supabase
        .from("metrics")
        .select("*")
        .in("post_id", postIds)
        .order("collected_at", { ascending: false }),
      this.supabase
        .from("gains")
        .select("*")
        .in("post_id", postIds)
        .order("calculated_at", { ascending: false }),
    ]);

    if (metricsResult.error) throw metricsResult.error;
    if (gainsResult.error) throw gainsResult.error;

    const latestMetricsByPost = new Map<string, PostMetrics>();
    for (const metric of (metricsResult.data || []) as PostMetrics[]) {
      if (!latestMetricsByPost.has(metric.post_id)) {
        latestMetricsByPost.set(metric.post_id, metric);
      }
    }

    const latestGainsByPost = new Map<string, PostGains>();
    for (const gain of (gainsResult.data || []) as PostGains[]) {
      if (!latestGainsByPost.has(gain.post_id)) {
        latestGainsByPost.set(gain.post_id, gain);
      }
    }

    return posts.map((post) => ({
      post,
      metrics: latestMetricsByPost.get(post.id) || null,
      gains: latestGainsByPost.get(post.id) || null,
    }));
  }

  async getCampaignMetrics(campaignId: string): Promise<{
    totalImpressions: number;
    totalClicks: number;
    totalLeads: number;
    totalConversions: number;
    totalGain: number;
    postCount: number;
    approvedCount: number;
  }> {
    const posts = await this.getCampaignPosts(campaignId);
    const approvedPosts = posts.filter(
      (p) => p.status === "approved" || p.status === "auto_approved",
    );
    const postIds = posts.map((post) => post.id);

    const totals = {
      totalImpressions: 0,
      totalClicks: 0,
      totalLeads: 0,
      totalConversions: 0,
      totalGain: 0,
      postCount: posts.length,
      approvedCount: approvedPosts.length,
    };

    if (postIds.length === 0) {
      return totals;
    }

    const [metricsResult, gainsResult] = await Promise.all([
      this.supabase
        .from("metrics")
        .select(
          "post_id, impressions, clicks, leads, conversions, collected_at",
        )
        .in("post_id", postIds)
        .order("collected_at", { ascending: false }),
      this.supabase
        .from("gains")
        .select("post_id, total_gain, calculated_at")
        .in("post_id", postIds)
        .order("calculated_at", { ascending: false }),
    ]);

    if (metricsResult.error) throw metricsResult.error;
    if (gainsResult.error) throw gainsResult.error;

    const metricsRows = (metricsResult.data || []) as Array<{
      post_id: string;
      impressions: number;
      clicks: number;
      leads: number;
      conversions: number;
    }>;

    const gainsRows = (gainsResult.data || []) as Array<{
      post_id: string;
      total_gain: number;
    }>;

    const latestMetricsByPost = new Map<
      string,
      {
        impressions: number;
        clicks: number;
        leads: number;
        conversions: number;
      }
    >();

    for (const metric of metricsRows) {
      if (!latestMetricsByPost.has(metric.post_id)) {
        latestMetricsByPost.set(metric.post_id, {
          impressions: metric.impressions,
          clicks: metric.clicks,
          leads: metric.leads,
          conversions: metric.conversions,
        });
      }
    }

    const latestGainByPost = new Map<string, number>();

    for (const gain of gainsRows) {
      if (!latestGainByPost.has(gain.post_id)) {
        latestGainByPost.set(gain.post_id, gain.total_gain || 0);
      }
    }

    for (const postId of postIds) {
      const metrics = latestMetricsByPost.get(postId);
      const gain = latestGainByPost.get(postId) || 0;

      if (metrics) {
        totals.totalImpressions += metrics.impressions;
        totals.totalClicks += metrics.clicks;
        totals.totalLeads += metrics.leads;
        totals.totalConversions += metrics.conversions;
      }

      totals.totalGain += gain;
    }

    return totals;
  }
}
