-- Local development seed only. Run with `supabase db reset` against a local stack.
-- These auth rows are ownership placeholders; use the website's local test console
-- for identity switching. Do not run this seed against the hosted project.

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'lin-miao@demo.code2art.local', '', now(), '{"provider":"email","providers":["email"]}', '{"name":"林淼"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'chen-yu@demo.code2art.local', '', now(), '{"provider":"email","providers":["email"]}', '{"name":"陈屿"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'zhou-ran@demo.code2art.local', '', now(), '{"provider":"email","providers":["email"]}', '{"name":"周然"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'he-qing@demo.code2art.local', '', now(), '{"provider":"email","providers":["email"]}', '{"name":"何青"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000005', 'authenticated', 'authenticated', 'wu-tong@demo.code2art.local', '', now(), '{"provider":"email","providers":["email"]}', '{"name":"吴桐"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000006', 'authenticated', 'authenticated', 'luo-xi@demo.code2art.local', '', now(), '{"provider":"email","providers":["email"]}', '{"name":"罗希"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000007', 'authenticated', 'authenticated', 'tang-ke@demo.code2art.local', '', now(), '{"provider":"email","providers":["email"]}', '{"name":"唐可"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000008', 'authenticated', 'authenticated', 'song-yi@demo.code2art.local', '', now(), '{"provider":"email","providers":["email"]}', '{"name":"宋一"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000009', 'authenticated', 'authenticated', 'zhao-ning@demo.code2art.local', '', now(), '{"provider":"email","providers":["email"]}', '{"name":"赵宁"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000010', 'authenticated', 'authenticated', 'gao-yue@demo.code2art.local', '', now(), '{"provider":"email","providers":["email"]}', '{"name":"高越"}', now(), now(), '', '', '', '')
on conflict (id) do nothing;

insert into public.submissions (
  user_id, status, submission_type, title, creator_name, creation_year,
  summary, process_notes, tools, source_links, license, rights_confirmed, submitted_at
)
select
  account.id,
  case when work.local_index = account.work_count then 'submitted' else 'published' end,
  case (account.number + work.local_index) % 4 when 0 then 'artwork' when 1 then 'project' when 2 then 'prompt_skill' else 'course' end,
  account.name || '的开发样本 ' || work.local_index,
  account.name,
  (2022 + ((account.number + work.local_index) % 5))::text,
  '用于验证投稿归属、审核状态、作品展示与 Museum Agent 检索的本地开发样本。',
  '此记录由 supabase/seed.sql 生成，仅用于本地数据库复现和 RLS 测试。',
  array[account.tool, 'Museum Agent'],
  array[]::text[],
  'needs-review',
  true,
  now()
from (
  values
    (1, '00000000-0000-4000-8000-000000000001'::uuid, '林淼', 'p5.js', 1),
    (2, '00000000-0000-4000-8000-000000000002'::uuid, '陈屿', 'TouchDesigner', 2),
    (3, '00000000-0000-4000-8000-000000000003'::uuid, '周然', 'ComfyUI', 3),
    (4, '00000000-0000-4000-8000-000000000004'::uuid, '何青', 'Max/MSP', 1),
    (5, '00000000-0000-4000-8000-000000000005'::uuid, '吴桐', 'Processing', 2),
    (6, '00000000-0000-4000-8000-000000000006'::uuid, '罗希', 'Godot', 3),
    (7, '00000000-0000-4000-8000-000000000007'::uuid, '唐可', 'D3.js', 1),
    (8, '00000000-0000-4000-8000-000000000008'::uuid, '宋一', 'TypeScript', 2),
    (9, '00000000-0000-4000-8000-000000000009'::uuid, '赵宁', 'Obsidian', 3),
    (10, '00000000-0000-4000-8000-000000000010'::uuid, '高越', 'Arduino', 2)
) as account(number, id, name, tool, work_count)
cross join lateral generate_series(1, account.work_count) as work(local_index)
where not exists (
  select 1 from public.submissions existing
  where existing.user_id = account.id
    and existing.title = account.name || '的开发样本 ' || work.local_index
);
