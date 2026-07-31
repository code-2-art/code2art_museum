drop policy if exists submissions_owner_select on public.submissions;
drop policy if exists submissions_curator_select on public.submissions;

create policy submissions_read
on public.submissions for select to authenticated
using (
  (select auth.uid()) = user_id
  or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'curator'
);

drop policy if exists submission_media_owner_select on public.submission_media;
drop policy if exists submission_media_curator_select on public.submission_media;

create policy submission_media_read
on public.submission_media for select to authenticated
using (
  (select auth.uid()) = user_id
  or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'curator'
);

drop policy if exists submission_reviews_owner_select on public.submission_reviews;
drop policy if exists submission_reviews_curator_select on public.submission_reviews;

create policy submission_reviews_read
on public.submission_reviews for select to authenticated
using (
  exists (
    select 1 from public.submissions
    where submissions.id = submission_id
      and submissions.user_id = (select auth.uid())
  )
  or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'curator'
);

drop policy if exists submission_reviews_curator_insert on public.submission_reviews;

create policy submission_reviews_curator_insert
on public.submission_reviews for insert to authenticated
with check (
  (select auth.uid()) = reviewer_id
  and ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'curator'
);

drop policy if exists submission_objects_owner_select on storage.objects;
drop policy if exists submission_objects_curator_select on storage.objects;

create policy submission_objects_read
on storage.objects for select to authenticated
using (
  bucket_id = 'submission-media'
  and (
    owner_id = (select auth.uid()::text)
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'curator'
  )
);
