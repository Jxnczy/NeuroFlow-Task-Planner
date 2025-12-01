-- Enable UUID generation if not already present
create extension if not exists "uuid-ossp";

-- Core tasks table
create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users (id) on delete cascade,
  created_at timestamptz default now() not null,
  title text not null,
  duration integer,
  priority text,
  category text,
  status text default 'unscheduled',
  eisenhower_quad text,
  scheduled_date date,
  is_completed boolean default false,
  is_frozen boolean default false,
  completed_at timestamptz,
  sort_order integer default 0,
  constraint tasks_status_check check (status in ('unscheduled', 'scheduled', 'completed', 'rescheduled'))
);

create index if not exists tasks_user_id_idx on public.tasks (user_id);
create index if not exists tasks_user_date_idx on public.tasks (user_id, scheduled_date);

-- Habits table
create table if not exists public.habits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users (id) on delete cascade,
  name text not null,
  goal integer default 7,
  daily_history jsonb default '[]'::jsonb
);

create index if not exists habits_user_id_idx on public.habits (user_id);

-- Notes / Brain dump table
create table if not exists public.notes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users (id) on delete cascade,
  title text,
  content text,
  updated_at timestamptz default now()
);

create index if not exists notes_user_id_idx on public.notes (user_id);
