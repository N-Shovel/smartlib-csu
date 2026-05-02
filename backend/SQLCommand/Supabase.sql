-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.library_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  item_type text NOT NULL CHECK (item_type = ANY (ARRAY['book'::text, 'thesis'::text])),
  title text NOT NULL,
  description text,
  keywords ARRAY,
  item_number text,
  is_available boolean NOT NULL DEFAULT true,
  created_by_staff_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  author text,
  deleted_at timestamp with time zone,
  CONSTRAINT library_items_pkey PRIMARY KEY (id),
  CONSTRAINT library_items_created_by_staff_id_fkey FOREIGN KEY (created_by_staff_id) REFERENCES public.staff_profiles(user_id)
);
CREATE TABLE public.rooms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  room_number text NOT NULL UNIQUE,
  name text,
  capacity integer,
  is_active boolean NOT NULL DEFAULT true,
  created_by_staff_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT rooms_pkey PRIMARY KEY (id),
  CONSTRAINT rooms_created_by_staff_id_fkey FOREIGN KEY (created_by_staff_id) REFERENCES public.staff_profiles(user_id)
);
CREATE TABLE public.staff_activity_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  staff_user_id uuid,
  entity_type text NOT NULL CHECK (entity_type = ANY (ARRAY['library_item'::text, 'room'::text])),
  entity_id uuid NOT NULL,
  action text NOT NULL CHECK (action = ANY (ARRAY['create'::text, 'update'::text, 'soft_delete'::text, 'restore'::text, 'hard_delete'::text])),
  summary text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT staff_activity_log_pkey PRIMARY KEY (id),
  CONSTRAINT staff_activity_log_staff_user_id_fkey FOREIGN KEY (staff_user_id) REFERENCES public.staff_profiles(user_id)
);
CREATE TABLE public.staff_profiles (
  user_id uuid NOT NULL,
  staff_id text UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  role text NOT NULL DEFAULT 'staff'::text CHECK (role = ANY (ARRAY['staff'::text, 'admin'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT staff_profiles_pkey PRIMARY KEY (user_id),
  CONSTRAINT staff_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.student_borrow_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_user_id uuid NOT NULL,
  item_title text NOT NULL,
  item_type text,
  requested_at timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'returned'::text, 'cancelled'::text])),
  approved_at timestamp with time zone,
  due_at timestamp with time zone,
  returned_at timestamp with time zone,
  library_item_id uuid,
  approved_by_staff_id uuid,
  decision_at timestamp with time zone,
  decision_note text,
  CONSTRAINT student_borrow_requests_pkey PRIMARY KEY (id),
  CONSTRAINT student_borrow_requests_student_user_id_fkey FOREIGN KEY (student_user_id) REFERENCES public.student_profiles(user_id),
  CONSTRAINT student_borrow_requests_library_item_id_fkey FOREIGN KEY (library_item_id) REFERENCES public.library_items(id),
  CONSTRAINT student_borrow_requests_approved_by_staff_id_fkey FOREIGN KEY (approved_by_staff_id) REFERENCES public.staff_profiles(user_id)
);
CREATE TABLE public.student_profiles (
  user_id uuid NOT NULL,
  id_number text NOT NULL UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  suffix text,
  contact_number text,
  address text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  role text NOT NULL DEFAULT 'borrower'::text,
  program text NOT NULL,
  email text,
  CONSTRAINT student_profiles_pkey PRIMARY KEY (user_id),
  CONSTRAINT student_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT student_profiles_user_id_users_public_fkey FOREIGN KEY (user_id) REFERENCES public.users_public(user_id)
);
CREATE TABLE public.student_room_reservations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_user_id uuid NOT NULL,
  room_number text NOT NULL,
  time_start timestamp with time zone NOT NULL,
  time_end timestamp with time zone NOT NULL,
  purpose text,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'cancelled'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  room_id uuid,
  approved_by_staff_id uuid,
  decision_at timestamp with time zone,
  decision_note text,
  CONSTRAINT student_room_reservations_pkey PRIMARY KEY (id),
  CONSTRAINT student_room_reservations_student_user_id_fkey FOREIGN KEY (student_user_id) REFERENCES public.student_profiles(user_id),
  CONSTRAINT student_room_reservations_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id),
  CONSTRAINT student_room_reservations_approved_by_staff_id_fkey FOREIGN KEY (approved_by_staff_id) REFERENCES public.staff_profiles(user_id)
);
CREATE TABLE public.users_public (
  user_id uuid NOT NULL,
  email text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT users_public_pkey PRIMARY KEY (user_id),
  CONSTRAINT users_public_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);