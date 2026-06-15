-- ==========================================================================
-- SELECT · CONTROL DE SERVICIOS — Esquema de base de datos (v2)
-- --------------------------------------------------------------------------
-- Modelo basado en el sistema de gestion de la empresa:
--   CARGOS -> TRABAJADORES -> ASIGNACIONES <- SERVICIOS <- ESTABLECIMIENTOS
--
-- COMO USARLO:
--   1. Entra en supabase.com -> tu proyecto
--   2. Menu izquierdo -> "SQL Editor" -> "New query"
--   3. Pega TODO este archivo y pulsa "Run"
--   4. Despues ejecuta "seed-cadiz.sql" para cargar los datos de Cadiz.
--
-- AVISO: este script REHACE las tablas de datos (borra trabajadores,
-- establecimientos y turnos antiguos). Los usuarios de acceso NO se tocan.
-- ==========================================================================

-- Quitamos el modelo antiguo (turnos) para montar el nuevo (servicios + asignaciones).
drop table if exists public.asignaciones cascade;
drop table if exists public.servicios    cascade;
drop table if exists public.turnos        cascade;
drop table if exists public.trabajadores  cascade;
drop table if exists public.establecimientos cascade;
drop table if exists public.cargos        cascade;

-- --------------------------------------------------------------------------
-- TABLA: cargos  (el precio/hora del trabajador depende de su cargo)
-- --------------------------------------------------------------------------
create table public.cargos (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null unique,
  tarifa_hora numeric(10,2) not null default 0,
  orden       int not null default 0,
  created_at  timestamptz not null default now()
);

insert into public.cargos (nombre, tarifa_hora, orden) values
  ('Auxiliar',     8,  1),
  ('Controlador',  10, 2),
  ('Coordinador',  12, 3);

-- --------------------------------------------------------------------------
-- TABLA: establecimientos  (clientes a los que se factura)
-- --------------------------------------------------------------------------
create table public.establecimientos (
  id                  uuid primary key default gen_random_uuid(),
  nombre              text not null,
  razon_social        text,
  cif                 text,
  direccion           text,
  delegacion          text,
  tarifa_hora_cliente numeric(10,2) not null default 0,
  activo              boolean not null default true,
  created_at          timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- TABLA: trabajadores
-- --------------------------------------------------------------------------
create table public.trabajadores (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null,
  iban       text,
  telefono   text,
  cargo_id   uuid references public.cargos(id) on delete set null,
  activo     boolean not null default true,
  created_at timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- TABLA: servicios  (un trabajo en un establecimiento; puede necesitar
--                    varios puestos = varios trabajadores)
-- --------------------------------------------------------------------------
create table public.servicios (
  id                  uuid primary key default gen_random_uuid(),
  establecimiento_id  uuid not null references public.establecimientos(id) on delete restrict,
  fecha               date not null,
  hora_inicio         time not null,
  hora_fin            time not null,
  puestos_necesarios  int  not null default 1,
  precio_hora_cliente numeric(10,2) not null default 0,  -- copia del establecimiento (o precio especial)
  observaciones       text,
  estado              text not null default 'Pendiente'
                       check (estado in ('Pendiente','Realizado','Cancelado')),
  created_at          timestamptz not null default now()
);

create index idx_servicios_fecha on public.servicios(fecha);
create index idx_servicios_establecimiento on public.servicios(establecimiento_id);

-- --------------------------------------------------------------------------
-- TABLA: asignaciones  (un trabajador cubriendo un puesto de un servicio)
-- --------------------------------------------------------------------------
create table public.asignaciones (
  id            uuid primary key default gen_random_uuid(),
  servicio_id   uuid not null references public.servicios(id) on delete cascade,
  trabajador_id uuid references public.trabajadores(id) on delete set null,
  cargo_id      uuid references public.cargos(id) on delete set null,
  hora_inicio   time not null,
  hora_fin      time not null,
  horas         numeric(10,2) not null default 0,
  coste_hora    numeric(10,2) not null default 0,  -- copia de la tarifa del cargo en el momento
  extras        numeric(10,2) not null default 0,  -- dietas, kilometraje, plus...
  created_at    timestamptz not null default now()
);

create index idx_asignaciones_servicio on public.asignaciones(servicio_id);
create index idx_asignaciones_trabajador on public.asignaciones(trabajador_id);

-- --------------------------------------------------------------------------
-- TABLA: usuarios_app  (perfil + rol, ligado al login de Supabase Auth)
-- --------------------------------------------------------------------------
create table if not exists public.usuarios_app (
  id     uuid primary key references auth.users(id) on delete cascade,
  nombre text,
  rol    text not null default 'encargado' check (rol in ('admin','encargado'))
);

-- ==========================================================================
-- SEGURIDAD (Row Level Security): solo usuarios con sesion iniciada.
-- La diferencia admin/encargado (ocultar costes y margenes) se controla
-- dentro de la aplicacion.
-- ==========================================================================
alter table public.cargos            enable row level security;
alter table public.establecimientos  enable row level security;
alter table public.trabajadores      enable row level security;
alter table public.servicios         enable row level security;
alter table public.asignaciones      enable row level security;
alter table public.usuarios_app      enable row level security;

drop policy if exists "cargos_auth" on public.cargos;
create policy "cargos_auth" on public.cargos for all to authenticated using (true) with check (true);

drop policy if exists "establecimientos_auth" on public.establecimientos;
create policy "establecimientos_auth" on public.establecimientos for all to authenticated using (true) with check (true);

drop policy if exists "trabajadores_auth" on public.trabajadores;
create policy "trabajadores_auth" on public.trabajadores for all to authenticated using (true) with check (true);

drop policy if exists "servicios_auth" on public.servicios;
create policy "servicios_auth" on public.servicios for all to authenticated using (true) with check (true);

drop policy if exists "asignaciones_auth" on public.asignaciones;
create policy "asignaciones_auth" on public.asignaciones for all to authenticated using (true) with check (true);

drop policy if exists "usuarios_app_self" on public.usuarios_app;
create policy "usuarios_app_self" on public.usuarios_app
  for select to authenticated using (auth.uid() = id);

-- ==========================================================================
-- PRIMER ADMINISTRADOR
-- --------------------------------------------------------------------------
-- Tras crear tu usuario en Supabase (Authentication -> Users -> "Add user"),
-- copia su "User UID" y ejecuta esto cambiando el UID:
--
--   insert into public.usuarios_app (id, nombre, rol)
--   values ('PEGA-AQUI-EL-USER-UID', 'Tu Nombre', 'admin');
-- ==========================================================================
