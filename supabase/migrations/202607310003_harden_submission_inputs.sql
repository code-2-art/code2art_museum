create or replace function private.text_array_within_limits(
  p_values text[],
  p_max_items integer,
  p_max_length integer
)
returns boolean
language sql
immutable
strict
set search_path = ''
as $$
  select cardinality(p_values) <= p_max_items
    and not exists (
      select 1
      from unnest(p_values) as item
      where item = ''
        or item <> btrim(item)
        or char_length(item) > p_max_length
    );
$$;

create or replace function private.valid_source_links(p_values text[])
returns boolean
language sql
immutable
strict
set search_path = ''
as $$
  select private.text_array_within_limits(p_values, 20, 2048)
    and not exists (
      select 1
      from unnest(p_values) as item
      where item !~* '^https?://[^[:space:]]+$'
    );
$$;

revoke execute on function private.text_array_within_limits(text[], integer, integer) from public, anon, authenticated;
revoke execute on function private.valid_source_links(text[]) from public, anon, authenticated;

update public.submissions
set source_links = (
  select array_agg(
    case
      when link_value ~* '^[a-z0-9.-]+\.[a-z]{2,}([/:?#].*)?$' then 'https://' || link_value
      else link_value
    end
    order by position
  )
  from unnest(source_links) with ordinality as links(link_value, position)
)
where exists (
  select 1
  from unnest(source_links) as link_value
  where link_value ~* '^[a-z0-9.-]+\.[a-z]{2,}([/:?#].*)?$'
);

alter table public.submissions
  add constraint submissions_trimmed_text_check check (
    title = btrim(title)
    and creator_name = btrim(creator_name)
    and summary = btrim(summary)
    and license = btrim(license)
    and license <> ''
    and (creation_year is null or creation_year = btrim(creation_year))
    and (process_notes is null or (process_notes = btrim(process_notes) and process_notes <> ''))
  ),
  add constraint submissions_tools_limits_check check (
    private.text_array_within_limits(tools, 40, 120)
  ),
  add constraint submissions_source_links_check check (
    private.valid_source_links(source_links)
  );

alter table public.submission_media
  add constraint submission_media_mime_type_not_blank_check check (
    mime_type = btrim(mime_type) and mime_type <> ''
  );

revoke insert on public.submissions from authenticated;
grant insert (
  user_id,
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

revoke insert on public.submission_media from authenticated;
grant insert (
  submission_id,
  user_id,
  storage_path,
  original_name,
  mime_type,
  size_bytes
) on public.submission_media to authenticated;
