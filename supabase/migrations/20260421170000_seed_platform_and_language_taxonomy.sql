-- Ensure platform and language taxonomy values exist for campaign wizard
insert into public.app_taxonomy_items (taxonomy_type, value, sort_order, is_active)
values
  ('social_platform', 'TikTok', 1, true),
  ('social_platform', 'Instagram', 2, true),
  ('social_platform', 'YouTube', 3, true),
  ('social_platform', 'Facebook', 4, true),
  ('social_platform', 'X', 5, true),
  ('social_platform', 'Snapchat', 6, true),
  ('language', 'Français', 1, true),
  ('language', 'Anglais', 2, true)
on conflict (taxonomy_type, value)
do update set
  sort_order = excluded.sort_order,
  is_active = true;
