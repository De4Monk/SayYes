-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles (RBAC & User Data)
create table public.profiles (
    id uuid references auth.users on delete cascade not null primary key,
    telegram_id text unique,
    role text check (role in ('master', 'admin', 'owner', 'client')) not null default 'client',
    native_name text,
    avatar_url text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 2. Masters Settings (Commission & Trust)
create table public.masters_settings (
    id uuid default uuid_generate_v4() primary key,
    master_id uuid references public.profiles(id) on delete cascade not null,
    trust_coefficient int default 100, -- e.g., 0 to 100
    bar_commission_rate float default 0.0, -- e.g., 0.10 for 10%
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique(master_id)
);

-- 3. Appointments (Read-Only Transit from Dikidi)
create table public.appointments (
    id uuid default uuid_generate_v4() primary key,
    external_id text unique not null, -- ID from Dikidi
    client_name text not null,
    service_name text,
    status text, -- 'scheduled', 'in_progress', 'completed', 'cancelled'
    start_time timestamptz not null,
    end_time timestamptz,
    master_id uuid references public.profiles(id), -- Optional link if master is matched
    created_at timestamptz default now()
);

-- 4. Inventory Catalog (Product Definitions)
create table public.inventory_catalog (
    id uuid default uuid_generate_v4() primary key,
    brand text not null,
    name text not null,
    volume_ml int not null,
    type text check (type in ('dye', 'oxidizer', 'powder', 'care', 'retail')),
    created_at timestamptz default now()
);

-- 5. Inventory Units (Physical Tracking)
create table public.inventory_units (
    id uuid default uuid_generate_v4() primary key,
    catalog_id uuid references public.inventory_catalog(id) not null,
    external_qr_code text unique, -- Scanned QR code on the tube/bottle
    status text check (status in ('new', 'opened', 'empty')) default 'new',
    remaining_grams float not null, -- Track precise weight
    initial_weight_grams float, -- For reference
    open_date timestamptz,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 6. Usage Logs (Immutable Transaction Log)
create table public.usage_logs (
    id uuid default uuid_generate_v4() primary key,
    appointment_id uuid references public.appointments(id),
    master_id uuid references public.profiles(id) not null,
    unit_id uuid references public.inventory_units(id), -- Can be null if generic usage
    grams_used float not null,
    modifiers_snapshot jsonb, -- Snapshot of SmartModifiers at time of usage
    is_deviation boolean default false, -- Flagged if usage exceeds standard limits
    notes text,
    created_at timestamptz default now() -- Immutable timestamp
);

-- 7. RLS Policies (Basic Setup - Secure by default)
alter table public.profiles enable row level security;
alter table public.masters_settings enable row level security;
alter table public.appointments enable row level security;
alter table public.inventory_catalog enable row level security;
alter table public.inventory_units enable row level security;
alter table public.usage_logs enable row level security;

-- Allow read access to authenticated users (simplify for MVP)
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Masters can view their own settings" on public.masters_settings for select using (auth.uid() = master_id);
create policy "Authenticated users can view appointments" on public.appointments for select using (auth.role() = 'authenticated');
create policy "Authenticated users can view inventory" on public.inventory_catalog for select using (auth.role() = 'authenticated');
create policy "Authenticated users can view inventory units" on public.inventory_units for select using (auth.role() = 'authenticated');
create policy "Authenticated users can view usage logs" on public.usage_logs for select using (auth.role() = 'authenticated');

-- Allow insert/update based on roles (To be refined)
create policy "Masters can insert usage logs" on public.usage_logs for insert with check (auth.uid() = master_id);
