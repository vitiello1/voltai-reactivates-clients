-- ============================================
-- VOLTAI — Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Professionals (linked to auth.users)
create table public.professionals (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  salon_name text not null,
  email text not null,
  whatsapp_number text,
  whatsapp_connected boolean default false,
  evolution_instance_name text,
  evolution_api_key text,
  created_at timestamptz default now()
);

-- Services
create table public.services (
  id uuid default uuid_generate_v4() primary key,
  professional_id uuid references public.professionals(id) on delete cascade not null,
  name text not null,
  interval_days integer not null default 30,
  message_template text not null default 'Oi {nome}! 😊 Já faz {dias} dias desde o seu {serviço} aqui no salão. Que tal renovar? Tenho horário disponível essa semana — me chama aqui e já garantimos o seu! 🗓️',
  is_custom boolean default false,
  created_at timestamptz default now()
);

-- Clients
create table public.clients (
  id uuid default uuid_generate_v4() primary key,
  professional_id uuid references public.professionals(id) on delete cascade not null,
  name text not null,
  phone text not null,
  created_at timestamptz default now()
);

-- Appointments
create table public.appointments (
  id uuid default uuid_generate_v4() primary key,
  professional_id uuid references public.professionals(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete cascade not null,
  service_id uuid references public.services(id) on delete set null,
  date date not null,
  return_date date not null,
  created_at timestamptz default now()
);

-- Reminders
create table public.reminders (
  id uuid default uuid_generate_v4() primary key,
  appointment_id uuid references public.appointments(id) on delete cascade not null,
  professional_id uuid references public.professionals(id) on delete cascade not null,
  sent_at timestamptz default now(),
  status text check (status in ('sent', 'failed')) not null,
  returned_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table public.professionals enable row level security;
alter table public.services enable row level security;
alter table public.clients enable row level security;
alter table public.appointments enable row level security;
alter table public.reminders enable row level security;

-- Professionals policies
create policy "professionals_select" on public.professionals for select using (auth.uid() = id);
create policy "professionals_insert" on public.professionals for insert with check (auth.uid() = id);
create policy "professionals_update" on public.professionals for update using (auth.uid() = id);

-- Services policies
create policy "services_select" on public.services for select using (auth.uid() = professional_id);
create policy "services_insert" on public.services for insert with check (auth.uid() = professional_id);
create policy "services_update" on public.services for update using (auth.uid() = professional_id);
create policy "services_delete" on public.services for delete using (auth.uid() = professional_id);

-- Clients policies
create policy "clients_select" on public.clients for select using (auth.uid() = professional_id);
create policy "clients_insert" on public.clients for insert with check (auth.uid() = professional_id);
create policy "clients_update" on public.clients for update using (auth.uid() = professional_id);
create policy "clients_delete" on public.clients for delete using (auth.uid() = professional_id);

-- Appointments policies
create policy "appointments_select" on public.appointments for select using (auth.uid() = professional_id);
create policy "appointments_insert" on public.appointments for insert with check (auth.uid() = professional_id);
create policy "appointments_update" on public.appointments for update using (auth.uid() = professional_id);
create policy "appointments_delete" on public.appointments for delete using (auth.uid() = professional_id);

-- Reminders policies
create policy "reminders_select" on public.reminders for select using (auth.uid() = professional_id);
create policy "reminders_insert" on public.reminders for insert with check (auth.uid() = professional_id);
create policy "reminders_update" on public.reminders for update using (auth.uid() = professional_id);

-- ============================================
-- INDEXES
-- ============================================

create index idx_services_professional on public.services(professional_id);
create index idx_clients_professional on public.clients(professional_id);
create index idx_appointments_professional on public.appointments(professional_id);
create index idx_appointments_client on public.appointments(client_id);
create index idx_appointments_return_date on public.appointments(return_date);
create index idx_reminders_professional on public.reminders(professional_id);
create index idx_reminders_appointment on public.reminders(appointment_id);

-- ============================================
-- FUNCTION: Auto-create professional profile on signup
-- ============================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.professionals (id, name, salon_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'Profissional'),
    coalesce(new.raw_user_meta_data->>'salon_name', 'Meu Salão'),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger on auth.users insert
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- SEED: Default services (inserted per professional via function)
-- ============================================

create or replace function public.seed_default_services(professional_id uuid)
returns void as $$
begin
  insert into public.services (professional_id, name, interval_days, is_custom) values
    (professional_id, 'Corte feminino', 30, false),
    (professional_id, 'Corte masculino', 21, false),
    (professional_id, 'Coloração', 45, false),
    (professional_id, 'Mechas', 60, false),
    (professional_id, 'Escova', 21, false),
    (professional_id, 'Hidratação', 30, false),
    (professional_id, 'Relaxamento', 90, false),
    (professional_id, 'Manicure', 15, false),
    (professional_id, 'Pedicure', 15, false);
end;
$$ language plpgsql security definer;

-- Updated trigger to also seed services
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.professionals (id, name, salon_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'Profissional'),
    coalesce(new.raw_user_meta_data->>'salon_name', 'Meu Salão'),
    new.email
  );
  perform public.seed_default_services(new.id);
  return new;
end;
$$ language plpgsql security definer;
