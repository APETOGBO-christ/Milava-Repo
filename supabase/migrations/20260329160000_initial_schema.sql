create extension if not exists pgcrypto;

create type public.user_role as enum ('company', 'creator', 'admin');
create type public.social_platform as enum ('TikTok', 'Instagram', 'YouTube', 'Facebook', 'X', 'Snapchat');
create type public.campaign_objective as enum ('awareness', 'traffic', 'leads', 'sales');
create type public.reward_model as enum ('cpm', 'cpc', 'cpl', 'cpa', 'flat_rate');
create type public.campaign_status as enum ('draft', 'pending_funding', 'active', 'completed', 'cancelled');
create type public.application_status as enum ('pending', 'accepted', 'rejected', 'auto_accepted', 'withdrawn');
create type public.assignment_status as enum ('active', 'completed', 'cancelled');
create type public.post_status as enum ('submitted', 'approved', 'rejected', 'auto_approved');
create type public.asset_kind as enum ('video', 'image', 'text', 'link', 'pdf');
create type public.metric_source as enum ('scrape', 'manual_screenshot', 'tracking_link', 'conversion_import');
create type public.conversion_type as enum ('lead', 'sale');
create type public.conversion_status as enum ('pending', 'validated', 'rejected');
create type public.wallet_transaction_kind as enum (
  'earning_pending',
  'earning_released',
  'withdrawal_requested',
  'withdrawal_completed',
  'withdrawal_failed',
  'campaign_refund'
);
create type public.payment_provider as enum ('wave', 'orange_money', 'mtn_momo', 'card', 'bank_transfer');
create type public.payment_status as enum ('pending', 'processing', 'completed', 'failed', 'cancelled');
create type public.notification_channel as enum ('email', 'sms', 'in_app');
create type public.notification_status as enum ('queued', 'sent', 'failed');

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

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null,
  email text not null unique,
  country text not null default '',
  phone text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.company_profiles (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  company_name text not null default '',
  sector text,
  website_url text,
  description text,
  logo_path text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.creator_profiles (
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

create table public.social_accounts (
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

create table public.social_account_metric_snapshots (
  id uuid primary key default gen_random_uuid(),
  social_account_id uuid not null references public.social_accounts (id) on delete cascade,
  followers_count integer not null check (followers_count >= 0),
  engagement_rate numeric(5, 2) not null check (engagement_rate between 0 and 100),
  captured_at timestamptz not null default timezone('utc', now())
);

create table public.campaigns (
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

create table public.campaign_selection_criteria (
  campaign_id uuid primary key references public.campaigns (id) on delete cascade,
  min_followers integer not null default 0 check (min_followers >= 0),
  allowed_countries text[] not null default '{}',
  min_reliability_score numeric(3, 2) not null default 0 check (min_reliability_score between 0 and 5),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.campaign_target_networks (
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  platform public.social_platform not null,
  primary key (campaign_id, platform)
);

create table public.campaign_assets (
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

create table public.campaign_applications (
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

create table public.campaign_assignments (
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

create table public.campaign_posts (
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

create table public.post_metric_snapshots (
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

create table public.tracking_links (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null unique references public.campaign_assignments (id) on delete cascade,
  short_code text not null unique,
  destination_url text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.click_events (
  id uuid primary key default gen_random_uuid(),
  tracking_link_id uuid not null references public.tracking_links (id) on delete cascade,
  clicked_at timestamptz not null default timezone('utc', now()),
  country text,
  device_type text,
  referrer text,
  ip_hash text
);

create table public.conversion_events (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.campaign_assignments (id) on delete cascade,
  conversion_type public.conversion_type not null,
  status public.conversion_status not null default 'pending',
  external_reference text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default timezone('utc', now()),
  validated_at timestamptz
);

create table public.wallet_accounts (
  creator_id uuid primary key references public.creator_profiles (profile_id) on delete cascade,
  available_balance numeric(12, 2) not null default 0 check (available_balance >= 0),
  pending_balance numeric(12, 2) not null default 0 check (pending_balance >= 0),
  currency text not null default 'USD' check (currency = 'USD'),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creator_profiles (profile_id) on delete cascade,
  provider public.payment_provider not null,
  amount numeric(12, 2) not null check (amount >= 5),
  status public.payment_status not null default 'pending',
  payout_reference text,
  destination_label text not null,
  requested_at timestamptz not null default timezone('utc', now()),
  processed_at timestamptz
);

create table public.wallet_transactions (
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

create table public.company_payment_transactions (
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

create table public.notifications (
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

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_auth_user();

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_company_profiles_updated_at
before update on public.company_profiles
for each row execute function public.set_updated_at();

create trigger set_creator_profiles_updated_at
before update on public.creator_profiles
for each row execute function public.set_updated_at();

create trigger set_social_accounts_updated_at
before update on public.social_accounts
for each row execute function public.set_updated_at();

create trigger set_campaigns_budget_defaults
before insert or update on public.campaigns
for each row execute function public.prepare_campaign_budget();

create trigger set_campaigns_updated_at
before update on public.campaigns
for each row execute function public.set_updated_at();

create trigger set_campaign_selection_criteria_updated_at
before update on public.campaign_selection_criteria
for each row execute function public.set_updated_at();

create trigger set_campaign_assignments_updated_at
before update on public.campaign_assignments
for each row execute function public.set_updated_at();

create trigger set_campaign_posts_updated_at
before update on public.campaign_posts
for each row execute function public.set_updated_at();

create index idx_social_accounts_creator_id on public.social_accounts (creator_id);
create index idx_social_accounts_verification on public.social_accounts (is_verified, verification_expires_at);
create index idx_campaigns_company_status on public.campaigns (company_id, status);
create index idx_campaigns_dates on public.campaigns (start_date, end_date);
create index idx_campaign_applications_campaign_status on public.campaign_applications (campaign_id, status);
create index idx_campaign_applications_creator_id on public.campaign_applications (creator_id);
create index idx_campaign_posts_assignment_status on public.campaign_posts (assignment_id, status);
create index idx_post_metric_snapshots_post_id on public.post_metric_snapshots (post_id, captured_at desc);
create index idx_click_events_tracking_link_id on public.click_events (tracking_link_id, clicked_at desc);
create index idx_conversion_events_assignment_id on public.conversion_events (assignment_id, status);
create index idx_wallet_transactions_creator_id on public.wallet_transactions (creator_id, created_at desc);
create index idx_withdrawal_requests_creator_id on public.withdrawal_requests (creator_id, status);
create index idx_notifications_recipient_id on public.notifications (recipient_id, status, created_at desc);
