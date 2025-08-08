-- Create profiles table for user information
create table if not exists public.profiles (
  user_id uuid primary key,
  email text,
  full_name text,
  phone text,
  avatar_url text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- RLS Policies: users manage only their own profile
create policy if not exists "Users can view their own profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy if not exists "Users can insert their own profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy if not exists "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = user_id);

create policy if not exists "Users can delete their own profile"
  on public.profiles
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Timestamp trigger function
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger for profiles
create or replace trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.update_updated_at_column();