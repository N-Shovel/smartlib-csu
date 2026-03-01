-- STAFF PROFILE (librarian staff)
create table if not exists public.staff_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  staff_id text unique,
  first_name text not null,
  last_name text not null,
  role text not null default 'staff' check (role in ('staff','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- LIBRARY ITEMS (books + theses)
create table if not exists public.library_items (
  id uuid primary key default gen_random_uuid(),
  item_type text not null check (item_type in ('book','thesis')),
  title text not null,
  description text,
  keywords text[], -- e.g. {"AI","ML"}
  item_number text, -- "book number (if naa)" or accession/call number
  is_available boolean not null default true,
  created_by_staff_id uuid references public.staff_profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_library_items_type on public.library_items(item_type);
create index if not exists idx_library_items_title on public.library_items(title);

-- ROOMS (discussion rooms)
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  room_number text not null unique,
  name text,
  capacity int,
  is_active boolean not null default true,
  created_by_staff_id uuid references public.staff_profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Link borrow requests to catalog items (optional but recommended)
alter table public.student_borrow_requests
  add column if not exists library_item_id uuid references public.library_items(id) on delete set null;

-- Staff decision fields for BORROW approvals
alter table public.student_borrow_requests
  add column if not exists approved_by_staff_id uuid references public.staff_profiles(user_id) on delete set null,
  add column if not exists decision_at timestamptz,
  add column if not exists decision_note text;

-- Room reservations should reference rooms (optional but recommended)
alter table public.student_room_reservations
  add column if not exists room_id uuid references public.rooms(id) on delete set null;

-- Staff decision fields for ROOM approvals
alter table public.student_room_reservations
  add column if not exists approved_by_staff_id uuid references public.staff_profiles(user_id) on delete set null,
  add column if not exists decision_at timestamptz,
  add column if not exists decision_note text;
