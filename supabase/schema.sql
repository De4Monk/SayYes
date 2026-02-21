-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  external_id text NOT NULL UNIQUE,
  client_name text NOT NULL,
  service_name text NOT NULL,
  service_price numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'created'::text,
  start_time timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  master_id text,
  debug_date text,
  notification_sent boolean DEFAULT false,
  last_notification_error text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  client_telegram_id bigint,
  client_phone text,
  client_id uuid,
  tenant_id uuid,
  CONSTRAINT appointments_pkey PRIMARY KEY (id),
  CONSTRAINT appointments_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id),
  CONSTRAINT appointments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);
CREATE TABLE public.clients (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  dikidi_client_id text UNIQUE,
  name text NOT NULL,
  phone text,
  telegram_id bigint UNIQUE,
  is_subscribed_tg boolean DEFAULT true,
  is_subscribed_wa boolean DEFAULT true,
  last_visit_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  tenant_id uuid,
  CONSTRAINT clients_pkey PRIMARY KEY (id),
  CONSTRAINT clients_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);
CREATE TABLE public.inventory (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text CHECK (type = ANY (ARRAY['dye'::text, 'oxide'::text, 'consumable'::text, 'bar'::text])),
  total_grams numeric DEFAULT 0,
  unit_count integer DEFAULT 0,
  alert_threshold integer DEFAULT 2,
  updated_at timestamp with time zone DEFAULT now(),
  tenant_id uuid,
  CONSTRAINT inventory_pkey PRIMARY KEY (id),
  CONSTRAINT inventory_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);
CREATE TABLE public.inventory_catalog (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  brand text NOT NULL,
  color_code text NOT NULL,
  volume_grams numeric NOT NULL,
  alert_threshold integer NOT NULL DEFAULT 2,
  CONSTRAINT inventory_catalog_pkey PRIMARY KEY (id)
);
CREATE TABLE public.inventory_units (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  catalog_id uuid,
  status text NOT NULL DEFAULT 'new'::text CHECK (status = ANY (ARRAY['new'::text, 'opened'::text, 'empty'::text])),
  current_weight numeric NOT NULL,
  opened_at timestamp with time zone,
  CONSTRAINT inventory_units_pkey PRIMARY KEY (id),
  CONSTRAINT inventory_units_catalog_id_fkey FOREIGN KEY (catalog_id) REFERENCES public.inventory_catalog(id)
);
CREATE TABLE public.masters_settings (
  master_id uuid NOT NULL,
  trust_coefficient numeric NOT NULL DEFAULT 1.0,
  bar_commission_rate numeric NOT NULL DEFAULT 0.0,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT masters_settings_pkey PRIMARY KEY (master_id)
);
CREATE TABLE public.notification_queue (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  appointment_id uuid,
  client_id uuid NOT NULL,
  template_type text NOT NULL,
  channel text NOT NULL CHECK (channel = ANY (ARRAY['telegram'::text, 'whatsapp'::text])),
  payload jsonb,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'sent'::text, 'failed'::text, 'cancelled'::text])),
  scheduled_for timestamp with time zone NOT NULL,
  sent_at timestamp with time zone,
  error_log text,
  created_at timestamp with time zone DEFAULT now(),
  tenant_id uuid,
  CONSTRAINT notification_queue_pkey PRIMARY KEY (id),
  CONSTRAINT notification_queue_client_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id),
  CONSTRAINT notification_queue_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT notification_queue_appointment_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id)
);
CREATE TABLE public.notification_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  type text NOT NULL UNIQUE,
  is_active boolean DEFAULT true,
  channel text NOT NULL CHECK (channel = ANY (ARRAY['telegram'::text, 'whatsapp'::text, 'both'::text])),
  message_text text NOT NULL,
  delay_interval interval,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  config jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT notification_templates_pkey PRIMARY KEY (id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  telegram_id text NOT NULL UNIQUE,
  full_name text,
  role text CHECK (role = ANY (ARRAY['owner'::text, 'admin'::text, 'master'::text, 'barber'::text])),
  dikidi_master_id text UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  tenant_id uuid,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  appointment_id uuid NOT NULL,
  client_id uuid NOT NULL,
  score integer NOT NULL CHECK (score >= 1 AND score <= 5),
  comment text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT reviews_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id),
  CONSTRAINT reviews_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id)
);
CREATE TABLE public.salon_integrations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_profile_id uuid NOT NULL UNIQUE,
  green_api_id_instance text,
  green_api_token text,
  telegram_bot_token text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  tenant_id uuid,
  CONSTRAINT salon_integrations_pkey PRIMARY KEY (id),
  CONSTRAINT salon_integrations_owner_fkey FOREIGN KEY (owner_profile_id) REFERENCES public.profiles(id),
  CONSTRAINT salon_integrations_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);
CREATE TABLE public.salon_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_profile_id uuid NOT NULL,
  admins_can_edit_templates boolean DEFAULT false,
  admins_can_send_mass_promo boolean DEFAULT false,
  master_tips_enabled boolean DEFAULT false,
  review_links jsonb DEFAULT '{"dikidi": {"url": "", "label": "📅 Dikidi", "enabled": false}, "google": {"url": "", "label": "📍 Google Maps", "enabled": false}, "twogis": {"url": "", "label": "📍 2GIS", "enabled": false}, "yandex": {"url": "", "label": "📍 Яндекс Карты", "enabled": false}}'::jsonb,
  CONSTRAINT salon_settings_pkey PRIMARY KEY (id),
  CONSTRAINT salon_settings_owner_fkey FOREIGN KEY (owner_profile_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.tenants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tenants_pkey PRIMARY KEY (id)
);
CREATE TABLE public.usage_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  appointment_id uuid,
  master_id uuid,
  unit_id uuid,
  grams_used numeric NOT NULL,
  modifiers jsonb,
  is_deviation boolean NOT NULL DEFAULT false,
  logged_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  tenant_id uuid,
  CONSTRAINT usage_logs_pkey PRIMARY KEY (id),
  CONSTRAINT usage_logs_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id),
  CONSTRAINT usage_logs_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.inventory_units(id),
  CONSTRAINT usage_logs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);
