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

    const postsWithData = await Promise.all(
      posts.map(async (post) => {
        const metrics = await this.getLatestMetrics(post.id);
        const gains = await this.getPostGains(post.id);
        return { post, metrics, gains };
      }),
    );

    return postsWithData;
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

    let totals = {
      totalImpressions: 0,
      totalClicks: 0,
      totalLeads: 0,
      totalConversions: 0,
      totalGain: 0,
      postCount: posts.length,
      approvedCount: approvedPosts.length,
    };

    // Fetch metrics and gains for all posts
    for (const post of posts) {
      const metrics = await this.getLatestMetrics(post.id);
      const gains = await this.getPostGains(post.id);

      if (metrics) {
        totals.totalImpressions += metrics.impressions;
        totals.totalClicks += metrics.clicks;
        totals.totalLeads += metrics.leads;
        totals.totalConversions += metrics.conversions;
      }

      if (gains) {
        totals.totalGain += gains.total_gain;
      }
    }

    return totals;
  }
}
