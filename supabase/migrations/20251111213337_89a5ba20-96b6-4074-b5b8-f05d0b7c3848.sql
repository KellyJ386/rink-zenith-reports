-- Create enum types
create type public.app_role as enum ('admin', 'manager', 'staff');

-- Create facilities table
create table public.facilities (
  id uuid not null default gen_random_uuid() primary key,
  name text not null,
  address text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Create rinks table
create table public.rinks (
  id uuid not null default gen_random_uuid() primary key,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  name text not null,
  created_at timestamp with time zone not null default now()
);

-- Create resurfacing_machines table
create table public.resurfacing_machines (
  id uuid not null default gen_random_uuid() primary key,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  name text not null,
  model text,
  created_at timestamp with time zone not null default now()
);

-- Create profiles table for additional user information
create table public.profiles (
  id uuid not null primary key,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete set null,
  name text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Create user_roles table (separate from profiles for security)
create table public.user_roles (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  unique (user_id, role)
);

-- Create user_permissions table for module access
create table public.user_permissions (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  module_name text not null,
  can_access boolean not null default false,
  unique (user_id, module_name)
);

-- Enable Row Level Security
alter table public.facilities enable row level security;
alter table public.rinks enable row level security;
alter table public.resurfacing_machines enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.user_permissions enable row level security;

-- Create security definer function to check user role
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- RLS Policies for profiles
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = user_id);

-- RLS Policies for facilities (admins and managers can view, admins can modify)
create policy "Authenticated users can view facilities"
  on public.facilities for select
  to authenticated
  using (true);

create policy "Admins can manage facilities"
  on public.facilities for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for rinks
create policy "Authenticated users can view rinks"
  on public.rinks for select
  to authenticated
  using (true);

create policy "Admins can manage rinks"
  on public.rinks for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for resurfacing_machines
create policy "Authenticated users can view machines"
  on public.resurfacing_machines for select
  to authenticated
  using (true);

create policy "Admins can manage machines"
  on public.resurfacing_machines for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles (only admins can modify)
create policy "Users can view their own roles"
  on public.user_roles for select
  using (auth.uid() = user_id);

create policy "Admins can manage user roles"
  on public.user_roles for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_permissions
create policy "Users can view their own permissions"
  on public.user_permissions for select
  using (auth.uid() = user_id);

create policy "Admins can manage permissions"
  on public.user_permissions for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Create function to automatically create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, user_id, name)
  values (gen_random_uuid(), new.id, coalesce(new.raw_user_meta_data->>'name', new.email));
  return new;
end;
$$;

-- Trigger to create profile on user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Triggers for updated_at
create trigger update_facilities_updated_at
  before update on public.facilities
  for each row execute procedure public.update_updated_at_column();

create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at_column();