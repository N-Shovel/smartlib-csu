-- Student profile table (extends auth.users)
create table if not exists public.student_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  id_number text not null unique,
  first_name text not null,
  last_name text not null,
  suffix text,
  program text not null,
  year_level smallint not null,
  contact_number text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Reservation requests/history (student-side)
create table if not exists public.student_room_reservations (
  id uuid primary key default gen_random_uuid(),
  student_user_id uuid not null references public.student_profiles(user_id) on delete cascade,
  room_number text not null,
  time_start timestamptz not null,
  time_end timestamptz not null,
  purpose text,
  status text not null default 'pending'
    check (status in ('pending','approved','rejected','cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists idx_room_res_student on public.student_room_reservations(student_user_id);
create index if not exists idx_room_res_status on public.student_room_reservations(status);

-- Borrow requests/history (student-side)
create table if not exists public.student_borrow_requests (
  id uuid primary key default gen_random_uuid(),
  student_user_id uuid not null references public.student_profiles(user_id) on delete cascade,
  item_title text not null,
  item_number text,
  requested_at timestamptz not null default now(),
  status text not null default 'pending'
    check (status in ('pending','approved','rejected','returned','cancelled')),
  approved_at timestamptz,
  due_at timestamptz,
  returned_at timestamptz
);

create index if not exists idx_borrow_student on public.student_borrow_requests(student_user_id);
create index if not exists idx_borrow_status on public.student_borrow_requests(status);
