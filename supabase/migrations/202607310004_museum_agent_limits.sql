create table public.agent_rate_limits (
  client_hash text primary key,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 1,
  updated_at timestamptz not null default now(),
  constraint agent_rate_limits_client_hash_check check (client_hash ~ '^[a-f0-9]{64}$'),
  constraint agent_rate_limits_request_count_check check (request_count > 0)
);

alter table public.agent_rate_limits enable row level security;

revoke all on table public.agent_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on table public.agent_rate_limits to service_role;

create table public.agent_response_cache (
  cache_key text primary key,
  answer text not null,
  model text not null,
  usage jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  constraint agent_response_cache_key_check check (cache_key ~ '^[a-f0-9]{64}$'),
  constraint agent_response_cache_answer_check check (
    answer = btrim(answer)
    and char_length(answer) between 1 and 6000
  ),
  constraint agent_response_cache_model_check check (
    model = btrim(model)
    and char_length(model) between 1 and 80
  ),
  constraint agent_response_cache_expiry_check check (expires_at > created_at)
);

create index agent_response_cache_expires_at_idx
  on public.agent_response_cache (expires_at);

alter table public.agent_response_cache enable row level security;

revoke all on table public.agent_response_cache from public, anon, authenticated;
grant select, insert, update, delete on table public.agent_response_cache to service_role;

create or replace function public.consume_agent_rate_limit(
  p_client_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns table (allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_window_started_at timestamptz;
  v_request_count integer;
begin
  if p_client_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'invalid client hash';
  end if;

  if p_limit not between 1 and 100000 or p_window_seconds not between 10 and 86400 then
    raise exception 'invalid rate limit configuration';
  end if;

  insert into public.agent_rate_limits as current_limit (
    client_hash,
    window_started_at,
    request_count,
    updated_at
  )
  values (p_client_hash, v_now, 1, v_now)
  on conflict (client_hash) do update
  set
    window_started_at = case
      when current_limit.window_started_at <= v_now - make_interval(secs => p_window_seconds)
        then v_now
      else current_limit.window_started_at
    end,
    request_count = case
      when current_limit.window_started_at <= v_now - make_interval(secs => p_window_seconds)
        then 1
      else current_limit.request_count + 1
    end,
    updated_at = v_now
  returning window_started_at, request_count
  into v_window_started_at, v_request_count;

  return query select
    v_request_count <= p_limit,
    case
      when v_request_count <= p_limit then 0
      else greatest(
        1,
        ceil(extract(epoch from (
          v_window_started_at + make_interval(secs => p_window_seconds) - v_now
        )))::integer
      )
    end;
end;
$$;

revoke execute on function public.consume_agent_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_agent_rate_limit(text, integer, integer)
  to service_role;

