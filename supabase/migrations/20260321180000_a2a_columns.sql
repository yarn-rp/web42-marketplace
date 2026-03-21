alter table agents
  add column if not exists a2a_enabled boolean not null default false,
  add column if not exists a2a_url text,
  add column if not exists gateway_status text not null default 'offline',
  add column if not exists last_seen_at timestamptz;

comment on column agents.a2a_enabled is 'Whether this agent supports live A2A calls';
comment on column agents.a2a_url is 'Public URL of the running A2A server (ngrok or similar)';
comment on column agents.gateway_status is 'live | offline';
comment on column agents.last_seen_at is 'Last time web42 serve registered this URL';
