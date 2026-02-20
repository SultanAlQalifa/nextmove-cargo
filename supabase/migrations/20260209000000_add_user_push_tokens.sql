-- Create table for storing device push tokens
create table if not exists public.user_push_tokens (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    token text unique not null,
    platform text not null,
    last_seen_at timestamp with time zone default now(),
    created_at timestamp with time zone default now()
);
-- Enable RLS
alter table public.user_push_tokens enable row level security;
-- Policies
create policy "Users can manage their own push tokens" on public.user_push_tokens for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Index for performance
create index if not exists idx_user_push_tokens_user_id on public.user_push_tokens(user_id);