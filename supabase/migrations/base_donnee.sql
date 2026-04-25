-- ============================================================================
-- MILAVA DATABASE - COMPLETE SCHEMA (CORRECTED)
-- Safe to run on a fresh Supabase project
-- ============================================================================

-- ============================================================================
-- EXTENSIONS
-- ============================================================================
create extension if not exists pgcrypto;

-- ============================================================================
-- ENUMS
-- ============================================================================
do $$ begin
  create type public.user_role as enum ('company', 'creator', 'admin');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.social_platform as enum ('TikTok', 'Instagram', 'YouTube', 'Facebook', 'X', 'Snapchat');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.campaign_objective as enum ('awareness', 'traffic', 'leads', 'sales');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.reward_model as enum ('cpm', 'cpc', 'cpl', 'cpa', 'flat_rate');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.campaign_status as enum ('draft', 'pending_funding', 'active', 'completed', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.application_status as enum ('pending', 'accepted', 'rejected', 'auto_accepted', 'withdrawn');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.assignment_status as enum ('active', 'completed', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.post_status as enum ('submitted', 'approved', 'rejected', 'auto_approved');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.asset_kind as enum ('video', 'image', 'text', 'link', 'pdf');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.metric_source as enum ('scrape', 'manual_screenshot', 'tracking_link', 'conversion_import');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.conversion_type as enum ('lead', 'sale');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.conversion_status as enum ('pending', 'validated', 'rejected');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.wallet_transaction_kind as enum (
    'earning_pending',
    'earning_released',
    'withdrawal_requested',
    'withdrawal_completed',
    'withdrawal_failed',
    'campaign_refund'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.payment_provider as enum ('wave', 'orange_money', 'mtn_momo', 'card', 'bank_transfer');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.payment_status as enum ('pending', 'processing', 'completed', 'failed', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.notification_channel as enum ('email', 'sms', 'in_app');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.notification_status as enum ('queued', 'sent', 'failed');
exception when duplicate_object then null;
end $$;

-- Add refunded to payment_status if not exists
do $$ begin
  alter type public.payment_status add value if not exists 'refunded';
exception when undefined_object then null;
end $$;

-- Additional enums for app services
do $$ begin
  create type public.candidature_status as enum ('pending', 'accepted', 'rejected', 'auto_accepted');
exception when duplicate_object then null;
end $$;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.prepare_campaign_budget()
returns trigger
language plpgsql
as $$
begin
  if new.platform_fee_amount = 0 then
    new.platform_fee_amount = round(new.budget_amount * new.platform_fee_rate, 2);
  end if;

  if new.gross_deposit_amount = 0 then
    new.gross_deposit_amount = new.budget_amount + new.platform_fee_amount;
  end if;

  if new.remaining_amount = 0 then
    new.remaining_amount = greatest(new.budget_amount - new.spent_amount, 0);
  end if;

  return new;
end;
$$;

create or replace function public.is_admin(p_user_id uuid)
returns boolean
language plpgsql
stable
as $$
begin
  if to_regclass('public.user_roles') is null then
    return false;
  end if;

  return exists (
    select 1
    from public.user_roles ur
    where ur.user_id = p_user_id
      and ur.role in ('admin', 'moderator')
  );
end;
$$;

-- ============================================================================
-- CORE TABLES
-- ============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null,
  email text not null unique,
  country text not null default '',
  phone text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.company_profiles (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  company_name text not null default '',
  sector text,
  website_url text,
  description text,
  logo_path text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.creator_profiles (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  bio text,
  avatar_path text,
  reliability_score numeric(3, 2) not null default 5.00 check (reliability_score between 0 and 5),
  total_completed_campaigns integer not null default 0 check (total_completed_campaigns >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creator_profiles (profile_id) on delete cascade,
  platform public.social_platform not null,
  profile_url text not null,
  username text not null,
  display_name text,
  bio_snapshot text,
  is_verified boolean not null default false,
  verification_code text,
  verification_expires_at timestamptz,
  verified_at timestamptz,
  followers_count integer not null default 0 check (followers_count >= 0),
  engagement_rate numeric(5, 2) not null default 0 check (engagement_rate between 0 and 100),
  last_synced_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (creator_id, platform, profile_url)
);

create table if not exists public.social_account_metric_snapshots (
  id uuid primary key default gen_random_uuid(),
  social_account_id uuid not null references public.social_accounts (id) on delete cascade,
  followers_count integer not null check (followers_count >= 0),
  engagement_rate numeric(5, 2) not null check (engagement_rate between 0 and 100),
  captured_at timestamptz not null default timezone('utc', now())
);

-- ============================================================================
-- CAMPAIGNS AND RELATED TABLES
-- ============================================================================
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company_profiles (profile_id) on delete cascade,
  title text not null,
  objective public.campaign_objective not null,
  description text not null,
  creative_brief text not null,
  destination_url text,
  required_hashtags text[] not null default '{}',
  required_mentions text[] not null default '{}',
  start_date date not null,
  end_date date not null,
  max_creators integer check (max_creators is null or max_creators > 0),
  reward_model public.reward_model not null,
  reward_rate numeric(12, 2) not null check (reward_rate >= 0),
  budget_amount numeric(12, 2) not null check (budget_amount > 0),
  platform_fee_rate numeric(5, 4) not null default 0.2000 check (platform_fee_rate between 0 and 1),
  platform_fee_amount numeric(12, 2) not null default 0 check (platform_fee_amount >= 0),
  gross_deposit_amount numeric(12, 2) not null default 0 check (gross_deposit_amount >= 0),
  spent_amount numeric(12, 2) not null default 0 check (spent_amount >= 0),
  remaining_amount numeric(12, 2) not null default 0 check (remaining_amount >= 0),
  status public.campaign_status not null default 'draft',
  auto_accept_hours integer not null default 72 check (auto_accept_hours > 0),
  auto_approve_hours integer not null default 48 check (auto_approve_hours > 0),
  launched_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (end_date >= start_date),
  check (remaining_amount <= budget_amount)
);

-- Add compatibility columns for app services
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'campaigns' and column_name = 'objectives') then
    alter table public.campaigns add column objectives text not null default '';
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'campaigns' and column_name = 'budget_total') then
    alter table public.campaigns add column budget_total numeric(12,2) not null default 0;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'campaigns' and column_name = 'budget_usable') then
    alter table public.campaigns add column budget_usable numeric(12,2) not null default 0;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'campaigns' and column_name = 'reward_value') then
    alter table public.campaigns add column reward_value numeric(12,2) not null default 0;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'campaigns' and column_name = 'started_at') then
    alter table public.campaigns add column started_at timestamptz;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'campaigns' and column_name = 'ended_at') then
    alter table public.campaigns add column ended_at timestamptz;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'campaigns' and column_name = 'category') then
    alter table public.campaigns add column category text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'campaigns' and column_name = 'content_type') then
    alter table public.campaigns add column content_type text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'campaigns' and column_name = 'required_networks') then
    alter table public.campaigns add column required_networks text[] default '{}'::text[];
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'campaigns' and column_name = 'countries') then
    alter table public.campaigns add column countries text[] default '{}'::text[];
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'campaigns' and column_name = 'languages') then
    alter table public.campaigns add column languages text[] default '{}'::text[];
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'campaigns' and column_name = 'min_followers') then
    alter table public.campaigns add column min_followers integer default 0;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'campaigns' and column_name = 'max_payout_per_content') then
    alter table public.campaigns add column max_payout_per_content numeric(12,2) default 0;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'campaigns' and column_name = 'participant_count') then
    alter table public.campaigns add column participant_count integer default 0;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'campaigns' and column_name = 'archived_at') then
    alter table public.campaigns add column archived_at timestamptz;
  end if;
end $$;

-- Update compatibility columns with data from existing columns
update public.campaigns
set
  objectives = coalesce(objectives, objective::text, ''),
  budget_total = coalesce(budget_total, budget_amount, 0),
  budget_usable = coalesce(budget_usable, remaining_amount, 0),
  reward_value = coalesce(reward_value, reward_rate, 0)
where objectives = '' or budget_total = 0 or budget_usable = 0 or reward_value = 0;

create table if not exists public.campaign_selection_criteria (
  campaign_id uuid primary key references public.campaigns (id) on delete cascade,
  min_followers integer not null default 0 check (min_followers >= 0),
  allowed_countries text[] not null default '{}',
  min_reliability_score numeric(3, 2) not null default 0 check (min_reliability_score between 0 and 5),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.campaign_target_networks (
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  platform public.social_platform not null,
  primary key (campaign_id, platform)
);

create table if not exists public.campaign_assets (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  kind public.asset_kind not null,
  title text not null,
  storage_bucket text,
  storage_path text,
  public_url text,
  mime_type text,
  file_size_bytes bigint check (file_size_bytes is null or file_size_bytes >= 0),
  text_content text,
  external_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.campaign_applications (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  creator_id uuid not null references public.creator_profiles (profile_id) on delete cascade,
  status public.application_status not null default 'pending',
  snapshot_followers_count integer not null default 0 check (snapshot_followers_count >= 0),
  snapshot_engagement_rate numeric(5, 2) not null default 0 check (snapshot_engagement_rate between 0 and 100),
  snapshot_social_accounts jsonb not null default '[]'::jsonb,
  applied_at timestamptz not null default timezone('utc', now()),
  decision_due_at timestamptz not null default timezone('utc', now()) + interval '72 hours',
  decided_at timestamptz,
  rejection_reason text,
  decision_source text not null default 'manual' check (decision_source in ('manual', 'auto')),
  unique (campaign_id, creator_id)
);

create table if not exists public.campaign_assignments (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  application_id uuid not null unique references public.campaign_applications (id) on delete cascade,
  creator_id uuid not null references public.creator_profiles (profile_id) on delete cascade,
  status public.assignment_status not null default 'active',
  tracking_code text not null unique,
  promo_code text unique,
  accepted_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.campaign_posts (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.campaign_assignments (id) on delete cascade,
  social_account_id uuid not null references public.social_accounts (id) on delete restrict,
  post_url text not null unique,
  status public.post_status not null default 'submitted',
  submitted_at timestamptz not null default timezone('utc', now()),
  decision_due_at timestamptz not null default timezone('utc', now()) + interval '48 hours',
  reviewed_at timestamptz,
  approved_at timestamptz,
  rejection_reason text,
  auto_approved boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.post_metric_snapshots (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.campaign_posts (id) on delete cascade,
  views_count integer not null default 0 check (views_count >= 0),
  likes_count integer not null default 0 check (likes_count >= 0),
  comments_count integer not null default 0 check (comments_count >= 0),
  clicks_count integer not null default 0 check (clicks_count >= 0),
  source public.metric_source not null default 'scrape',
  screenshot_bucket text,
  screenshot_path text,
  captured_at timestamptz not null default timezone('utc', now())
);

-- ============================================================================
-- APP-SPECIFIC SIMPLIFIED TABLES (for frontend services)
-- ============================================================================
create table if not exists public.candidatures (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  creator_id uuid not null references public.creator_profiles(profile_id) on delete cascade,
  status public.candidature_status not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  auto_accept_at timestamptz not null default timezone('utc', now()) + interval '72 hours',
  response_at timestamptz,
  rejected_at timestamptz,
  accepted_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now()),
  unique (campaign_id, creator_id)
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  creator_id uuid not null references public.creator_profiles(profile_id) on delete cascade,
  content_url text not null,
  post_url text generated always as (content_url) stored,
  status text not null default 'submitted',
  submitted_at timestamptz not null default timezone('utc', now()),
  approved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.metrics (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  creator_id uuid not null references public.creator_profiles(profile_id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  impressions integer not null default 0 check (impressions >= 0),
  views_count integer generated always as (impressions) stored,
  clicks integer not null default 0 check (clicks >= 0),
  clicks_count integer generated always as (clicks) stored,
  leads integer not null default 0 check (leads >= 0),
  conversions integer not null default 0 check (conversions >= 0),
  shares integer not null default 0 check (shares >= 0),
  engagements integer not null default 0 check (engagements >= 0),
  collected_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.gains (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  creator_id uuid not null references public.creator_profiles(profile_id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  reward_model text not null,
  metric_value numeric(14,2) not null default 0,
  reward_value numeric(12,2) not null default 0,
  total_gain numeric(12,2) not null default 0,
  amount numeric(12,2) generated always as (total_gain) stored,
  calculated_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

-- ============================================================================
-- TRACKING AND CONVERSION TABLES
-- ============================================================================
create table if not exists public.tracking_links (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null unique references public.campaign_assignments (id) on delete cascade,
  short_code text not null unique,
  destination_url text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.click_events (
  id uuid primary key default gen_random_uuid(),
  tracking_link_id uuid not null references public.tracking_links (id) on delete cascade,
  clicked_at timestamptz not null default timezone('utc', now()),
  country text,
  device_type text,
  referrer text,
  ip_hash text
);

create table if not exists public.conversion_events (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.campaign_assignments (id) on delete cascade,
  conversion_type public.conversion_type not null,
  status public.conversion_status not null default 'pending',
  external_reference text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default timezone('utc', now()),
  validated_at timestamptz
);

-- ============================================================================
-- WALLET AND PAYMENT TABLES
-- ============================================================================
create table if not exists public.wallet_accounts (
  creator_id uuid primary key references public.creator_profiles (profile_id) on delete cascade,
  available_balance numeric(12, 2) not null default 0 check (available_balance >= 0),
  pending_balance numeric(12, 2) not null default 0 check (pending_balance >= 0),
  currency text not null default 'USD' check (currency in ('USD', 'FCFA', 'XOF')),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creator_profiles (profile_id) on delete cascade,
  provider public.payment_provider not null,
  amount numeric(12, 2) not null check (amount >= 5),
  status public.payment_status not null default 'pending',
  payout_reference text,
  destination_label text not null,
  requested_at timestamptz not null default timezone('utc', now()),
  processed_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now()),
  notes text,
  transaction_id uuid
);

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creator_profiles (profile_id) on delete cascade,
  assignment_id uuid references public.campaign_assignments (id) on delete set null,
  post_id uuid references public.campaign_posts (id) on delete set null,
  withdrawal_request_id uuid references public.withdrawal_requests (id) on delete set null,
  kind public.wallet_transaction_kind not null,
  amount numeric(12, 2) not null check (amount <> 0),
  description text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.company_payment_transactions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company_profiles (profile_id) on delete cascade,
  campaign_id uuid references public.campaigns (id) on delete set null,
  provider public.payment_provider not null,
  direction text not null check (direction in ('deposit', 'refund')),
  amount numeric(12, 2) not null check (amount > 0),
  status public.payment_status not null default 'pending',
  external_reference text,
  requested_at timestamptz not null default timezone('utc', now()),
  processed_at timestamptz
);

-- Additional payment tracking table
create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  withdrawal_id uuid not null references public.withdrawal_requests(id) on delete cascade,
  creator_id uuid not null references public.creator_profiles(profile_id) on delete cascade,
  provider_name varchar(50) not null,
  provider_transaction_id varchar(255) unique,
  destination varchar(255) not null,
  amount numeric(12, 2) not null,
  fee numeric(12, 2) not null,
  total numeric(12, 2) not null,
  status varchar(50) not null default 'pending',
  error_message text,
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz
);

-- Add foreign key from withdrawal_requests to payment_transactions if not exists
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'withdrawal_requests_transaction_id_fkey'
  ) then
    alter table public.withdrawal_requests
      add constraint withdrawal_requests_transaction_id_fkey
      foreign key (transaction_id)
      references public.payment_transactions(id)
      on delete set null;
  end if;
end $$;

-- ============================================================================
-- ADMIN AND SETTINGS TABLES
-- ============================================================================
create table if not exists public.platform_settings (
  id uuid primary key default gen_random_uuid(),
  key varchar(100) unique not null,
  value jsonb not null,
  description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role varchar(50) not null default 'user',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(user_id, role)
);

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider_name varchar(50) not null,
  event_type varchar(100) not null,
  transaction_id varchar(255),
  payload jsonb not null,
  status varchar(50) default 'pending',
  error_message text,
  retry_count int default 0,
  last_retry_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  processed_at timestamptz
);

-- ============================================================================
-- NOTIFICATIONS AND TAXONOMY
-- ============================================================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  channel public.notification_channel not null,
  status public.notification_status not null default 'queued',
  event_type text not null,
  title text not null,
  body text not null,
  metadata jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.app_taxonomy_items (
  id uuid primary key default gen_random_uuid(),
  taxonomy_type text not null,
  value text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  unique (taxonomy_type, value)
);

-- ============================================================================
-- REFERRAL MODULE TABLES
-- ============================================================================
create table if not exists public.referral_links (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  invitee_type text not null check (invitee_type in ('creator', 'company')),
  code text not null unique,
  commission_rate numeric(5,2) not null check (commission_rate >= 0),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.referral_events (
  id uuid primary key default gen_random_uuid(),
  referral_link_id uuid not null references public.referral_links(id) on delete cascade,
  referred_user_id uuid references public.profiles(id) on delete set null,
  referred_role text not null check (referred_role in ('creator', 'company')),
  commission_amount numeric(12,2) not null default 0,
  status text not null default 'pending' check (status in ('pending', 'approved', 'paid', 'rejected')),
  created_at timestamptz not null default timezone('utc', now())
);

-- ============================================================================
-- TRIGGERS
-- ============================================================================
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role public.user_role;
begin
  requested_role :=
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'creator'::public.user_role);

  insert into public.profiles (id, role, email)
  values (new.id, requested_role, coalesce(new.email, ''));

  if requested_role = 'company' then
    insert into public.company_profiles (profile_id, company_name)
    values (new.id, coalesce(new.raw_user_meta_data ->> 'company_name', ''));
  elsif requested_role = 'creator' then
    insert into public.creator_profiles (profile_id, first_name, last_name)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'first_name', ''),
      coalesce(new.raw_user_meta_data ->> 'last_name', '')
    );

    insert into public.wallet_accounts (creator_id)
    values (new.id);
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_auth_user();

-- Set updated_at triggers
drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_company_profiles_updated_at on public.company_profiles;
create trigger set_company_profiles_updated_at
before update on public.company_profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_creator_profiles_updated_at on public.creator_profiles;
create trigger set_creator_profiles_updated_at
before update on public.creator_profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_social_accounts_updated_at on public.social_accounts;
create trigger set_social_accounts_updated_at
before update on public.social_accounts
for each row execute function public.set_updated_at();

drop trigger if exists set_campaigns_budget_defaults on public.campaigns;
create trigger set_campaigns_budget_defaults
before insert or update on public.campaigns
for each row execute function public.prepare_campaign_budget();

drop trigger if exists set_campaigns_updated_at on public.campaigns;
create trigger set_campaigns_updated_at
before update on public.campaigns
for each row execute function public.set_updated_at();

drop trigger if exists set_campaign_selection_criteria_updated_at on public.campaign_selection_criteria;
create trigger set_campaign_selection_criteria_updated_at
before update on public.campaign_selection_criteria
for each row execute function public.set_updated_at();

drop trigger if exists set_campaign_assignments_updated_at on public.campaign_assignments;
create trigger set_campaign_assignments_updated_at
before update on public.campaign_assignments
for each row execute function public.set_updated_at();

drop trigger if exists set_campaign_posts_updated_at on public.campaign_posts;
create trigger set_campaign_posts_updated_at
before update on public.campaign_posts
for each row execute function public.set_updated_at();

-- Additional triggers for app tables
drop trigger if exists trg_candidatures_updated_at on public.candidatures;
create trigger trg_candidatures_updated_at
before update on public.candidatures
for each row execute function public.set_updated_at();

drop trigger if exists trg_posts_updated_at on public.posts;
create trigger trg_posts_updated_at
before update on public.posts
for each row execute function public.set_updated_at();

drop trigger if exists trg_withdrawal_requests_updated_at on public.withdrawal_requests;
create trigger trg_withdrawal_requests_updated_at
before update on public.withdrawal_requests
for each row execute function public.set_updated_at();

drop trigger if exists trg_payment_transactions_updated_at on public.payment_transactions;
create trigger trg_payment_transactions_updated_at
before update on public.payment_transactions
for each row execute function public.set_updated_at();

drop trigger if exists trg_platform_settings_updated_at on public.platform_settings;
create trigger trg_platform_settings_updated_at
before update on public.platform_settings
for each row execute function public.set_updated_at();

drop trigger if exists trg_user_roles_updated_at on public.user_roles;
create trigger trg_user_roles_updated_at
before update on public.user_roles
for each row execute function public.set_updated_at();

-- ============================================================================
-- INDEXES
-- ============================================================================
create index if not exists idx_social_accounts_creator_id on public.social_accounts (creator_id);
create index if not exists idx_social_accounts_verification on public.social_accounts (is_verified, verification_expires_at);
create index if not exists idx_campaigns_company_status on public.campaigns (company_id, status);
create index if not exists idx_campaigns_dates on public.campaigns (start_date, end_date);
create index if not exists idx_campaign_applications_campaign_status on public.campaign_applications (campaign_id, status);
create index if not exists idx_campaign_applications_creator_id on public.campaign_applications (creator_id);
create index if not exists idx_campaign_posts_assignment_status on public.campaign_posts (assignment_id, status);
create index if not exists idx_post_metric_snapshots_post_id on public.post_metric_snapshots (post_id, captured_at desc);
create index if not exists idx_click_events_tracking_link_id on public.click_events (tracking_link_id, clicked_at desc);
create index if not exists idx_conversion_events_assignment_id on public.conversion_events (assignment_id, status);
create index if not exists idx_wallet_transactions_creator_id on public.wallet_transactions (creator_id, created_at desc);
create index if not exists idx_withdrawal_requests_creator_id on public.withdrawal_requests (creator_id, status);
create index if not exists idx_notifications_recipient_id on public.notifications (recipient_id, status, created_at desc);

-- Additional indexes
create index if not exists idx_candidatures_campaign_status on public.candidatures (campaign_id, status);
create index if not exists idx_candidatures_creator on public.candidatures (creator_id, created_at desc);
create index if not exists idx_posts_creator_status on public.posts (creator_id, status, created_at desc);
create index if not exists idx_posts_campaign on public.posts (campaign_id, created_at desc);
create index if not exists idx_metrics_post_collected on public.metrics (post_id, collected_at desc);
create index if not exists idx_metrics_campaign_collected on public.metrics (campaign_id, collected_at desc);
create index if not exists idx_gains_creator_created on public.gains (creator_id, created_at desc);
create index if not exists idx_gains_post_calculated on public.gains (post_id, calculated_at desc);
create index if not exists idx_payment_transactions_withdrawal_id on public.payment_transactions(withdrawal_id);
create index if not exists idx_payment_transactions_creator_id on public.payment_transactions(creator_id);
create index if not exists idx_payment_transactions_provider on public.payment_transactions(provider_name);
create index if not exists idx_payment_transactions_status on public.payment_transactions(status);
create index if not exists idx_payment_transactions_created_at on public.payment_transactions(created_at);
create index if not exists idx_user_roles_user_id on public.user_roles(user_id);
create index if not exists idx_webhook_events_provider on public.webhook_events(provider_name);
create index if not exists idx_webhook_events_status on public.webhook_events(status);
create index if not exists idx_webhook_events_created_at on public.webhook_events(created_at);
create index if not exists idx_app_taxonomy_items_type_active on public.app_taxonomy_items (taxonomy_type, is_active, sort_order);
create index if not exists idx_referral_links_owner on public.referral_links(owner_id, invitee_type);
create index if not exists idx_referral_events_link_status on public.referral_events(referral_link_id, status);

-- ============================================================================
-- ANALYTICS FUNCTIONS
-- ============================================================================
create or replace function public.admin_monthly_withdrawals(p_months int default 6)
returns table(month_label text, amount numeric, fees numeric, transactions bigint)
language plpgsql
stable
as $$
begin
  if to_regclass('public.payment_transactions') is null then
    return;
  end if;

  return query
  with m as (
    select date_trunc('month', created_at) as month_bucket,
           sum(amount) as amount,
           sum(fee) as fees,
           count(*) as transactions
    from public.payment_transactions
    where created_at >= date_trunc('month', timezone('utc', now())) - ((greatest(p_months, 1) - 1) * interval '1 month')
    group by 1
  )
  select to_char(month_bucket, 'Mon') as month_label,
         coalesce(amount, 0) as amount,
         coalesce(fees, 0) as fees,
         coalesce(transactions, 0) as transactions
  from m
  order by month_bucket;
end;
$$;

create or replace function public.admin_provider_breakdown()
returns table(provider text, amount numeric, percentage numeric)
language plpgsql
stable
as $$
begin
  if to_regclass('public.payment_transactions') is null then
    return;
  end if;

  return query
  with agg as (
    select provider_name as provider, sum(amount) as amount
    from public.payment_transactions
    group by provider_name
  ), tot as (
    select coalesce(sum(amount), 0) as total_amount from agg
  )
  select a.provider,
         a.amount,
         case when t.total_amount = 0 then 0 else round((a.amount / t.total_amount) * 100, 2) end as percentage
  from agg a
  cross join tot t
  order by a.amount desc;
end;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
do $$
declare
  t text;
  tables_list text[] := array['profiles','company_profiles','creator_profiles','social_accounts','campaigns',
    'candidatures','posts','metrics','gains','wallet_accounts','wallet_transactions',
    'withdrawal_requests','payment_transactions','platform_settings','user_roles',
    'webhook_events','referral_links','referral_events','app_taxonomy_items',
    'campaign_selection_criteria','campaign_target_networks','campaign_assets',
    'campaign_applications','campaign_assignments','campaign_posts','post_metric_snapshots',
    'tracking_links','click_events','conversion_events','company_payment_transactions',
    'notifications','social_account_metric_snapshots'];
begin
  foreach t in array tables_list
  loop
    if to_regclass(format('public.%s', t)) is not null then
      execute format('alter table public.%I enable row level security', t);
    end if;
  end loop;
end $$;

-- Profiles policies
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'profiles' and policyname = 'profiles_select_own') then
    create policy profiles_select_own on public.profiles
      for select using (auth.uid() = id or public.is_admin(auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'profiles' and policyname = 'profiles_update_own') then
    create policy profiles_update_own on public.profiles
      for update using (auth.uid() = id) with check (auth.uid() = id);
  end if;
end $$;

-- Creator profiles policies
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'creator_profiles' and policyname = 'creator_profiles_read_auth') then
    create policy creator_profiles_read_auth on public.creator_profiles
      for select using (auth.uid() is not null);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'creator_profiles' and policyname = 'creator_profiles_update_own') then
    create policy creator_profiles_update_own on public.creator_profiles
      for update using (auth.uid() = profile_id) with check (auth.uid() = profile_id);
  end if;
end $$;

-- Company profiles policies
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'company_profiles' and policyname = 'company_profiles_read_auth') then
    create policy company_profiles_read_auth on public.company_profiles
      for select using (auth.uid() is not null);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'company_profiles' and policyname = 'company_profiles_update_own') then
    create policy company_profiles_update_own on public.company_profiles
      for update using (auth.uid() = profile_id) with check (auth.uid() = profile_id);
  end if;
end $$;

-- Social accounts policies
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'social_accounts' and policyname = 'social_accounts_read_auth') then
    create policy social_accounts_read_auth on public.social_accounts
      for select using (auth.uid() is not null);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'social_accounts' and policyname = 'social_accounts_insert_own') then
    create policy social_accounts_insert_own on public.social_accounts
      for insert with check (auth.uid() = creator_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'social_accounts' and policyname = 'social_accounts_update_own') then
    create policy social_accounts_update_own on public.social_accounts
      for update using (auth.uid() = creator_id) with check (auth.uid() = creator_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'social_accounts' and policyname = 'social_accounts_delete_own') then
    create policy social_accounts_delete_own on public.social_accounts
      for delete using (auth.uid() = creator_id);
  end if;
end $$;

-- Campaigns policies
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'campaigns' and policyname = 'campaigns_read_public_active') then
    create policy campaigns_read_public_active on public.campaigns
      for select using (status::text = 'active' or auth.uid() is not null);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'campaigns' and policyname = 'campaigns_insert_company') then
    create policy campaigns_insert_company on public.campaigns
      for insert with check (auth.uid() = company_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'campaigns' and policyname = 'campaigns_update_company') then
    create policy campaigns_update_company on public.campaigns
      for update using (auth.uid() = company_id or public.is_admin(auth.uid()))
      with check (auth.uid() = company_id or public.is_admin(auth.uid()));
  end if;
end $$;

-- Candidatures policies
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'candidatures' and policyname = 'candidatures_insert_creator') then
    create policy candidatures_insert_creator on public.candidatures
      for insert with check (auth.uid() = creator_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'candidatures' and policyname = 'candidatures_read_owner_or_company') then
    create policy candidatures_read_owner_or_company on public.candidatures
      for select using (
        auth.uid() = creator_id
        or exists (select 1 from public.campaigns c where c.id = campaign_id and c.company_id = auth.uid())
        or public.is_admin(auth.uid())
      );
  end if;
  if not exists (select 1 from pg_policies where tablename = 'candidatures' and policyname = 'candidatures_update_company') then
    create policy candidatures_update_company on public.candidatures
      for update using (
        exists (select 1 from public.campaigns c where c.id = campaign_id and c.company_id = auth.uid())
        or public.is_admin(auth.uid())
      ) with check (
        exists (select 1 from public.campaigns c where c.id = campaign_id and c.company_id = auth.uid())
        or public.is_admin(auth.uid())
      );
  end if;
end $$;

-- Posts, metrics, gains policies
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'posts' and policyname = 'posts_rw_creator_company') then
    create policy posts_rw_creator_company on public.posts
      for all using (
        auth.uid() = creator_id
        or exists (select 1 from public.campaigns c where c.id = campaign_id and c.company_id = auth.uid())
        or public.is_admin(auth.uid())
      ) with check (
        auth.uid() = creator_id
        or exists (select 1 from public.campaigns c where c.id = campaign_id and c.company_id = auth.uid())
        or public.is_admin(auth.uid())
      );
  end if;
  if not exists (select 1 from pg_policies where tablename = 'metrics' and policyname = 'metrics_rw_creator_company') then
    create policy metrics_rw_creator_company on public.metrics
      for all using (
        auth.uid() = creator_id
        or exists (select 1 from public.campaigns c where c.id = campaign_id and c.company_id = auth.uid())
        or public.is_admin(auth.uid())
      ) with check (
        auth.uid() = creator_id
        or exists (select 1 from public.campaigns c where c.id = campaign_id and c.company_id = auth.uid())
        or public.is_admin(auth.uid())
      );
  end if;
  if not exists (select 1 from pg_policies where tablename = 'gains' and policyname = 'gains_rw_creator_company') then
    create policy gains_rw_creator_company on public.gains
      for all using (
        auth.uid() = creator_id
        or exists (select 1 from public.campaigns c where c.id = campaign_id and c.company_id = auth.uid())
        or public.is_admin(auth.uid())
      ) with check (
        auth.uid() = creator_id
        or exists (select 1 from public.campaigns c where c.id = campaign_id and c.company_id = auth.uid())
        or public.is_admin(auth.uid())
      );
  end if;
end $$;

-- Wallet policies
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'wallet_accounts' and policyname = 'wallet_accounts_own') then
    create policy wallet_accounts_own on public.wallet_accounts
      for all using (auth.uid() = creator_id or public.is_admin(auth.uid()))
      with check (auth.uid() = creator_id or public.is_admin(auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'wallet_transactions' and policyname = 'wallet_transactions_own') then
    create policy wallet_transactions_own on public.wallet_transactions
      for all using (auth.uid() = creator_id or public.is_admin(auth.uid()))
      with check (auth.uid() = creator_id or public.is_admin(auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'withdrawal_requests' and policyname = 'withdrawals_own') then
    create policy withdrawals_own on public.withdrawal_requests
      for all using (auth.uid() = creator_id or public.is_admin(auth.uid()))
      with check (auth.uid() = creator_id or public.is_admin(auth.uid()));
  end if;
end $$;

-- Admin-only tables policies
do $$
begin
  if to_regclass('public.payment_transactions') is not null and not exists (select 1 from pg_policies where tablename = 'payment_transactions' and policyname = 'payment_transactions_admin') then
    create policy payment_transactions_admin on public.payment_transactions
      for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
  end if;
  if to_regclass('public.platform_settings') is not null and not exists (select 1 from pg_policies where tablename = 'platform_settings' and policyname = 'platform_settings_admin_readwrite') then
    create policy platform_settings_admin_readwrite on public.platform_settings
      for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
  end if;
  if to_regclass('public.user_roles') is not null and not exists (select 1 from pg_policies where tablename = 'user_roles' and policyname = 'user_roles_admin_readwrite') then
    create policy user_roles_admin_readwrite on public.user_roles
      for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
  end if;
  if to_regclass('public.webhook_events') is not null and not exists (select 1 from pg_policies where tablename = 'webhook_events' and policyname = 'webhook_events_admin_readwrite') then
    create policy webhook_events_admin_readwrite on public.webhook_events
      for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
  end if;
end $$;

-- Taxonomy policies
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'app_taxonomy_items' and policyname = 'app_taxonomy_read_auth') then
    create policy app_taxonomy_read_auth on public.app_taxonomy_items
      for select using (auth.uid() is not null);
  end if;
end $$;

-- Referral policies
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'referral_links' and policyname = 'referral_links_owner') then
    create policy referral_links_owner on public.referral_links
      for all using (auth.uid() = owner_id or public.is_admin(auth.uid()))
      with check (auth.uid() = owner_id or public.is_admin(auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'referral_events' and policyname = 'referral_events_owner') then
    create policy referral_events_owner on public.referral_events
      for select using (
        public.is_admin(auth.uid())
        or exists (
          select 1 from public.referral_links rl where rl.id = referral_link_id and rl.owner_id = auth.uid()
        )
      );
  end if;
end $$;

-- ============================================================================
-- SEED DATA (Taxonomies and Platform Settings)
-- ============================================================================
insert into public.app_taxonomy_items (taxonomy_type, value, sort_order)
values
  ('country', 'Côte d''Ivoire', 1), ('country', 'Sénégal', 2), ('country', 'Bénin', 3),
  ('country', 'Togo', 4), ('country', 'Mali', 5), ('country', 'Ghana', 6),
  ('country', 'Cameroun', 7), ('country', 'Burkina Faso', 8), ('country', 'Niger', 9),
  ('campaign_category', 'Technologie', 1), ('campaign_category', 'Mode', 2), ('campaign_category', 'Beauté', 3),
  ('campaign_category', 'Alimentation', 4), ('campaign_category', 'Éducation', 5), ('campaign_category', 'Finance', 6),
  ('campaign_category', 'Santé', 7), ('campaign_category', 'Sport', 8), ('campaign_category', 'Voyage', 9),
  ('campaign_category', 'Divertissement', 10), ('campaign_category', 'Lifestyle', 11), ('campaign_category', 'Autre', 12),
  ('content_type', 'Vidéo courte', 1), ('content_type', 'Fil', 2), ('content_type', 'Histoire', 3),
  ('content_type', 'Découpage de contenu', 4), ('content_type', 'Review produit', 5), ('content_type', 'Tutoriel', 6),
  ('content_type', 'Unboxing', 7), ('content_type', 'Live', 8),
  ('social_platform', 'TikTok', 1), ('social_platform', 'Instagram', 2), ('social_platform', 'YouTube', 3),
  ('social_platform', 'Facebook', 4), ('social_platform', 'X', 5), ('social_platform', 'Snapchat', 6),
  ('language', 'Français', 1), ('language', 'Anglais', 2)
on conflict (taxonomy_type, value) do nothing;

insert into public.platform_settings (key, value, description)
values
  ('withdrawal_threshold', '5000'::jsonb, 'Minimum withdrawal amount'),
  ('max_withdrawal_amount', '500000'::jsonb, 'Maximum withdrawal amount'),
  ('processing_days', '2'::jsonb, 'Expected processing days'),
  ('platform_fee_percentage', '2.5'::jsonb, 'Global platform fee percent'),
  ('auto_processing', 'false'::jsonb, 'Enable auto processing'),
  ('maintenance_mode', 'false'::jsonb, 'Enable maintenance mode'),
  ('max_simultaneous_payments', '5'::jsonb, 'Max simultaneous payments')
on conflict (key) do update
set value = excluded.value,
    description = excluded.description,
    updated_at = timezone('utc', now());



-- =====================================================
-- CORRECTIONS POST-DEPLOIEMENT - VERSION FINALE
-- =====================================================

-- 1. Corriger reward_model pour matcher l'app
ALTER TABLE public.campaigns
  ALTER COLUMN reward_model TYPE text
  USING (
    CASE reward_model::text
      WHEN 'cpm' THEN 'CPM'
      WHEN 'cpc' THEN 'CPC'
      WHEN 'cpl' THEN 'CPL'
      WHEN 'cpa' THEN 'CPA'
      WHEN 'flat_rate' THEN 'Flat Rate'
      ELSE reward_model::text
    END
  );

ALTER TABLE public.campaigns
  DROP CONSTRAINT IF EXISTS campaigns_reward_model_check;

ALTER TABLE public.campaigns
  ADD CONSTRAINT campaigns_reward_model_check
  CHECK (reward_model IN ('CPM','CPC','CPL','CPA','Flat Rate'));

ALTER TABLE public.campaigns
  ALTER COLUMN reward_model SET DEFAULT 'CPM';

-- 2. Corriger la FK wallet_transactions.post_id
ALTER TABLE public.wallet_transactions
  DROP CONSTRAINT IF EXISTS wallet_transactions_post_id_fkey;

ALTER TABLE public.wallet_transactions
  ADD CONSTRAINT wallet_transactions_post_id_fkey
  FOREIGN KEY (post_id)
  REFERENCES public.posts(id)
  ON DELETE SET NULL;

-- 3. Ajouter les colonnes de compatibilité (sans dupliquer l'id)
ALTER TABLE public.creator_profiles 
  ADD COLUMN IF NOT EXISTS specialties text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS follower_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS engagement_rate numeric(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS verified_networks_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS image text,
  ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS phone text;

-- Mettre à jour avec les données existantes
UPDATE public.creator_profiles
SET
  image = COALESCE(image, avatar_path),
  country = COALESCE(country, (SELECT country FROM public.profiles WHERE id = profile_id)),
  phone = COALESCE(phone, (SELECT phone FROM public.profiles WHERE id = profile_id)),
  follower_count = COALESCE(follower_count, (
    SELECT COALESCE(SUM(followers_count), 0) 
    FROM public.social_accounts 
    WHERE creator_id = profile_id
  ));

-- 4. Créer une vue de compatibilité (meilleure pratique)
CREATE OR REPLACE VIEW public.creator_profiles_compat AS
SELECT 
  profile_id as id,
  profile_id as user_id,
  first_name,
  last_name,
  bio,
  image,
  specialties,
  reliability_score as reliability_score,
  total_completed_campaigns,
  follower_count,
  engagement_rate,
  verified_networks_count,
  country,
  phone,
  created_at,
  updated_at
FROM public.creator_profiles;

-- 5. Améliorer la politique RLS des campagnes
DROP POLICY IF EXISTS campaigns_read_public_active ON public.campaigns;

CREATE POLICY campaigns_read_public_active ON public.campaigns
FOR SELECT
USING (
  status::text = 'active'
  OR company_id = auth.uid()
  OR public.is_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.candidatures c 
    WHERE c.campaign_id = campaigns.id 
    AND c.creator_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.campaign_assignments ca 
    WHERE ca.campaign_id = campaigns.id 
    AND ca.creator_id = auth.uid()
  )
);

-- 6. Vérifications post-migration
DO $$
DECLARE
  v_count integer;
BEGIN
  -- Vérifier les reward_model
  SELECT COUNT(*) INTO v_count 
  FROM public.campaigns 
  WHERE reward_model NOT IN ('CPM','CPC','CPL','CPA','Flat Rate');
  
  IF v_count > 0 THEN
    RAISE NOTICE 'Attention: % campagnes avec reward_model invalide', v_count;
  ELSE
    RAISE NOTICE '✓ Tous les reward_model sont valides';
  END IF;
  
  -- Vérifier la FK
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'wallet_transactions_post_id_fkey'
  ) THEN
    RAISE NOTICE '✓ La FK wallet_transactions.post_id est correcte';
  END IF;
END $$;