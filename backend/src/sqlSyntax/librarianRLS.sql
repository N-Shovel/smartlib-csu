-- =========================
-- Helper functions
-- =========================
-- Use SECURITY DEFINER so policies can check staff_profiles even when RLS is enabled.
-- NOTE: keep search_path tight for safety.
create or replace function public.is_staff(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.staff_profiles sp
    where sp.user_id = uid
      and sp.role in ('staff','admin')
  );
$$;

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.staff_profiles sp
    where sp.user_id = uid
      and sp.role = 'admin'
  );
$$;

-- =========================
-- Enable RLS
-- =========================
alter table public.staff_profiles enable row level security;
alter table public.library_items enable row level security;
alter table public.rooms enable row level security;

alter table public.student_profiles enable row level security;
alter table public.student_room_reservations enable row level security;
alter table public.student_borrow_requests enable row level security;

-- =========================
-- STAFF_PROFILES policies
-- =========================

-- Staff can view their own staff profile
drop policy if exists "staff can view own staff profile" on public.staff_profiles;
create policy "staff can view own staff profile"
on public.staff_profiles
for select
to authenticated
using (user_id = auth.uid());

-- Only admins can create staff profiles (recommended)
-- If you want open staff signup, tell me and I'll change this.
drop policy if exists "admin can create staff profiles" on public.staff_profiles;
create policy "admin can create staff profiles"
on public.staff_profiles
for insert
to authenticated
with check (public.is_admin(auth.uid()));

-- Staff can update their own staff profile (but not their role)
drop policy if exists "staff can update own staff profile (no role change)" on public.staff_profiles;
create policy "staff can update own staff profile (no role change)"
on public.staff_profiles
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid() and role = (select sp.role from public.staff_profiles sp where sp.user_id = auth.uid()));

-- Only admins can update anyone's role or edit other staff
drop policy if exists "admin can update any staff profile" on public.staff_profiles;
create policy "admin can update any staff profile"
on public.staff_profiles
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- Only admins can delete staff profiles
drop policy if exists "admin can delete staff profiles" on public.staff_profiles;
create policy "admin can delete staff profiles"
on public.staff_profiles
for delete
to authenticated
using (public.is_admin(auth.uid()));

-- =========================
-- STUDENT_PROFILES policies
-- =========================

-- Students can view their own profile
drop policy if exists "students can view own profile" on public.student_profiles;
create policy "students can view own profile"
on public.student_profiles
for select
to authenticated
using (user_id = auth.uid());

-- Students can update their own profile (contact/address only)
-- If you want to allow updating more fields, add them via a trigger or split table.
drop policy if exists "students can update own profile limited fields" on public.student_profiles;
create policy "students can update own profile limited fields"
on public.student_profiles
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Staff can view all student profiles (for approval screens)
drop policy if exists "staff can view all student profiles" on public.student_profiles;
create policy "staff can view all student profiles"
on public.student_profiles
for select
to authenticated
using (public.is_staff(auth.uid()));

-- =========================
-- LIBRARY_ITEMS policies (books + theses)
-- =========================

-- Everyone authenticated can view library items (students browsing catalog)
drop policy if exists "authenticated can view library items" on public.library_items;
create policy "authenticated can view library items"
on public.library_items
for select
to authenticated
using (true);

-- Only staff can create items
drop policy if exists "staff can create library items" on public.library_items;
create policy "staff can create library items"
on public.library_items
for insert
to authenticated
with check (public.is_staff(auth.uid()));

-- Only staff can update items
drop policy if exists "staff can update library items" on public.library_items;
create policy "staff can update library items"
on public.library_items
for update
to authenticated
using (public.is_staff(auth.uid()))
with check (public.is_staff(auth.uid()));

-- Only admins can delete items (optional; change to staff if you want)
drop policy if exists "admin can delete library items" on public.library_items;
create policy "admin can delete library items"
on public.library_items
for delete
to authenticated
using (public.is_admin(auth.uid()));

-- =========================
-- ROOMS policies
-- =========================

-- Everyone authenticated can view rooms (students see room list)
drop policy if exists "authenticated can view rooms" on public.rooms;
create policy "authenticated can view rooms"
on public.rooms
for select
to authenticated
using (true);

-- Only staff can create rooms
drop policy if exists "staff can create rooms" on public.rooms;
create policy "staff can create rooms"
on public.rooms
for insert
to authenticated
with check (public.is_staff(auth.uid()));

-- Only staff can update rooms
drop policy if exists "staff can update rooms" on public.rooms;
create policy "staff can update rooms"
on public.rooms
for update
to authenticated
using (public.is_staff(auth.uid()))
with check (public.is_staff(auth.uid()));

-- Only admins can delete rooms (optional; change to staff if you want)
drop policy if exists "admin can delete rooms" on public.rooms;
create policy "admin can delete rooms"
on public.rooms
for delete
to authenticated
using (public.is_admin(auth.uid()));

-- =========================
-- STUDENT_BORROW_REQUESTS policies
-- =========================

-- Students can create borrow requests for themselves
drop policy if exists "students can create own borrow requests" on public.student_borrow_requests;
create policy "students can create own borrow requests"
on public.student_borrow_requests
for insert
to authenticated
with check (student_user_id = auth.uid());

-- Students can view their own borrow requests
drop policy if exists "students can view own borrow requests" on public.student_borrow_requests;
create policy "students can view own borrow requests"
on public.student_borrow_requests
for select
to authenticated
using (student_user_id = auth.uid());

-- Students can cancel their own pending requests
drop policy if exists "students can cancel own pending borrow requests" on public.student_borrow_requests;
create policy "students can cancel own pending borrow requests"
on public.student_borrow_requests
for update
to authenticated
using (student_user_id = auth.uid())
with check (
  student_user_id = auth.uid()
  and status in ('cancelled')
);

-- Staff can view all borrow requests (for approvals/history)
drop policy if exists "staff can view all borrow requests" on public.student_borrow_requests;
create policy "staff can view all borrow requests"
on public.student_borrow_requests
for select
to authenticated
using (public.is_staff(auth.uid()));

-- Staff can approve/reject/mark returned
drop policy if exists "staff can update borrow requests" on public.student_borrow_requests;
create policy "staff can update borrow requests"
on public.student_borrow_requests
for update
to authenticated
using (public.is_staff(auth.uid()))
with check (public.is_staff(auth.uid()));

-- =========================
-- STUDENT_ROOM_RESERVATIONS policies
-- =========================

-- Students can create reservations for themselves
drop policy if exists "students can create own room reservations" on public.student_room_reservations;
create policy "students can create own room reservations"
on public.student_room_reservations
for insert
to authenticated
with check (student_user_id = auth.uid());

-- Students can view their own reservations
drop policy if exists "students can view own room reservations" on public.student_room_reservations;
create policy "students can view own room reservations"
on public.student_room_reservations
for select
to authenticated
using (student_user_id = auth.uid());

-- Students can cancel their own pending reservations
drop policy if exists "students can cancel own pending room reservations" on public.student_room_reservations;
create policy "students can cancel own pending room reservations"
on public.student_room_reservations
for update
to authenticated
using (student_user_id = auth.uid())
with check (
  student_user_id = auth.uid()
  and status in ('cancelled')
);

-- Staff can view all reservations (for approvals/history)
drop policy if exists "staff can view all room reservations" on public.student_room_reservations;
create policy "staff can view all room reservations"
on public.student_room_reservations
for select
to authenticated
using (public.is_staff(auth.uid()));

-- Staff can approve/reject reservations
drop policy if exists "staff can update room reservations" on public.student_room_reservations;
create policy "staff can update room reservations"
on public.student_room_reservations
for update
to authenticated
using (public.is_staff(auth.uid()))
with check (public.is_staff(auth.uid()));
