-- Check and fix catalog visibility in Supabase.
-- Run this in the Supabase SQL Editor if the seeded books do not show in the UI.

-- 1) See whether RLS is enabled on the catalog table.
select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as force_rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'library_items';

-- 2) Allow authenticated users to read the catalog.
-- If this policy already exists, Supabase will keep it as-is.
alter table public.library_items enable row level security;

drop policy if exists "authenticated can view library items" on public.library_items;
create policy "authenticated can view library items"
on public.library_items
for select
to authenticated
using (deleted_at is null);

-- 3) Optional: allow authenticated users to read borrow requests for their own account flow.
-- Keep this only if the history / borrower pages need it.
drop policy if exists "users can view own borrow requests" on public.student_borrow_requests;
create policy "users can view own borrow requests"
on public.student_borrow_requests
for select
to authenticated
using (student_user_id = auth.uid());