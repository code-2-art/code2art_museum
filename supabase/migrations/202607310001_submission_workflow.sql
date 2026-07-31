create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.submissions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'draft' check (
    status in ('draft', 'submitted', 'in_review', 'changes_requested', 'approved', 'rejected', 'published')
  ),
  submission_type text not null check (
    submission_type in ('artwork', 'project', 'prompt_skill', 'course', 'history', 'profile')
  ),
  title text not null check (char_length(title) between 2 and 160),
  creator_name text not null check (char_length(creator_name) between 1 and 120),
  creation_year text check (creation_year is null or char_length(creation_year) <= 24),
  summary text not null check (char_length(summary) between 20 and 1200),
  process_notes text check (process_notes is null or char_length(process_notes) <= 6000),
  tools text[] not null default '{}',
  source_links text[] not null default '{}',
  license text not null default 'needs-review' check (char_length(license) <= 120),
  rights_confirmed boolean not null default false,
  review_note text,
  published_record_id text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status = 'draft' or rights_confirmed)
);

create table public.submission_media (
  id bigint generated always as identity primary key,
  submission_id bigint not null references public.submissions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  storage_path text not null unique,
  original_name text not null check (char_length(original_name) between 1 and 255),
  mime_type text not null check (char_length(mime_type) <= 120),
  size_bytes bigint not null check (size_bytes between 1 and 26214400),
  created_at timestamptz not null default now()
);

create table public.submission_reviews (
  id bigint generated always as identity primary key,
  submission_id bigint not null references public.submissions (id) on delete cascade,
  reviewer_id uuid not null references auth.users (id) on delete restrict,
  from_status text,
  to_status text not null check (
    to_status in ('in_review', 'changes_requested', 'approved', 'rejected', 'published')
  ),
  note text check (note is null or char_length(note) <= 4000),
  created_at timestamptz not null default now()
);

create index submissions_user_id_idx on public.submissions (user_id);
create index submissions_status_created_at_idx on public.submissions (status, created_at desc);
create index submissions_pending_review_idx on public.submissions (created_at, id)
  where status in ('submitted', 'in_review');
create index submission_media_submission_id_idx on public.submission_media (submission_id);
create index submission_media_user_id_idx on public.submission_media (user_id);
create index submission_reviews_submission_id_idx on public.submission_reviews (submission_id);
create index submission_reviews_reviewer_id_idx on public.submission_reviews (reviewer_id);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function private.set_updated_at() from public, anon, authenticated;

create trigger submissions_set_updated_at
before update on public.submissions
for each row execute function private.set_updated_at();

alter table public.submissions enable row level security;
alter table public.submission_media enable row level security;
alter table public.submission_reviews enable row level security;

create policy submissions_owner_select
on public.submissions for select to authenticated
using ((select auth.uid()) = user_id);

create policy submissions_curator_select
on public.submissions for select to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'curator');

create policy submissions_owner_insert
on public.submissions for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and status = 'draft'
);

create policy submissions_owner_update
on public.submissions for update to authenticated
using (
  (select auth.uid()) = user_id
  and status in ('draft', 'changes_requested')
)
with check (
  (select auth.uid()) = user_id
  and status in ('draft', 'submitted')
);

create policy submissions_owner_delete_draft
on public.submissions for delete to authenticated
using ((select auth.uid()) = user_id and status = 'draft');

create policy submission_media_owner_select
on public.submission_media for select to authenticated
using ((select auth.uid()) = user_id);

create policy submission_media_curator_select
on public.submission_media for select to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'curator');

create policy submission_media_owner_insert
on public.submission_media for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.submissions
    where submissions.id = submission_id
      and submissions.user_id = (select auth.uid())
      and submissions.status = 'draft'
  )
);

create policy submission_media_owner_delete
on public.submission_media for delete to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.submissions
    where submissions.id = submission_id
      and submissions.user_id = (select auth.uid())
      and submissions.status = 'draft'
  )
);

create policy submission_reviews_owner_select
on public.submission_reviews for select to authenticated
using (
  exists (
    select 1 from public.submissions
    where submissions.id = submission_id
      and submissions.user_id = (select auth.uid())
  )
);

create policy submission_reviews_curator_select
on public.submission_reviews for select to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'curator');

create policy submission_reviews_curator_insert
on public.submission_reviews for insert to authenticated
with check (
  (select auth.uid()) = reviewer_id
  and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'curator'
);

create or replace function public.review_submission(
  p_submission_id bigint,
  p_to_status text,
  p_note text default null
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  previous_status text;
begin
  if coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'curator' then
    raise exception 'curator role required';
  end if;

  if p_to_status not in ('in_review', 'changes_requested', 'approved', 'rejected') then
    raise exception 'invalid review status';
  end if;

  select status into previous_status
  from public.submissions
  where id = p_submission_id
  for update;

  if previous_status is null then
    raise exception 'submission not found';
  end if;

  if previous_status not in ('submitted', 'in_review', 'changes_requested', 'approved') then
    raise exception 'submission is not reviewable';
  end if;

  update public.submissions
  set
    status = p_to_status,
    review_note = nullif(btrim(p_note), ''),
    reviewed_at = now()
  where id = p_submission_id;

  insert into public.submission_reviews (
    submission_id,
    reviewer_id,
    from_status,
    to_status,
    note
  ) values (
    p_submission_id,
    (select auth.uid()),
    previous_status,
    p_to_status,
    nullif(btrim(p_note), '')
  );

  return p_submission_id;
end;
$$;

revoke execute on function public.review_submission(bigint, text, text) from public, anon;
grant execute on function public.review_submission(bigint, text, text) to authenticated;

revoke all on public.submissions, public.submission_media, public.submission_reviews from anon;
grant select, insert, delete on public.submissions to authenticated;
grant update (
  status,
  submission_type,
  title,
  creator_name,
  creation_year,
  summary,
  process_notes,
  tools,
  source_links,
  license,
  rights_confirmed,
  submitted_at
) on public.submissions to authenticated;
grant select, insert, delete on public.submission_media to authenticated;
grant select on public.submission_reviews to authenticated;
grant usage, select on sequence public.submissions_id_seq to authenticated;
grant usage, select on sequence public.submission_media_id_seq to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'submission-media',
  'submission-media',
  false,
  26214400,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy submission_objects_owner_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'submission-media'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and exists (
    select 1 from public.submissions
    where submissions.id::text = (storage.foldername(name))[2]
      and submissions.user_id = (select auth.uid())
      and submissions.status = 'draft'
  )
);

create policy submission_objects_owner_select
on storage.objects for select to authenticated
using (
  bucket_id = 'submission-media'
  and owner_id = (select auth.uid()::text)
);

create policy submission_objects_curator_select
on storage.objects for select to authenticated
using (
  bucket_id = 'submission-media'
  and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'curator'
);

create policy submission_objects_owner_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'submission-media'
  and owner_id = (select auth.uid()::text)
  and exists (
    select 1 from public.submissions
    where submissions.id::text = (storage.foldername(name))[2]
      and submissions.user_id = (select auth.uid())
      and submissions.status = 'draft'
  )
);
