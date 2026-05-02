-- Add copy tracking for library items and keep inventory synced with borrow approvals/returns.

ALTER TABLE public.library_items
  ADD COLUMN IF NOT EXISTS total_copies integer,
  ADD COLUMN IF NOT EXISTS available_copies integer;

UPDATE public.library_items
SET
  total_copies = CASE
    WHEN lower(coalesce(item_type, '')) = 'thesis' THEN 1
    ELSE COALESCE(total_copies, 3)
  END,
  available_copies = CASE
    WHEN lower(coalesce(item_type, '')) = 'thesis' THEN CASE WHEN is_available THEN 1 ELSE 0 END
    WHEN available_copies IS NULL THEN CASE WHEN is_available THEN COALESCE(total_copies, 3) ELSE 0 END
    ELSE LEAST(GREATEST(available_copies, 0), COALESCE(total_copies, 3))
  END;

UPDATE public.library_items
SET
  total_copies = CASE
    WHEN lower(coalesce(item_type, '')) = 'thesis' THEN 1
    ELSE GREATEST(COALESCE(total_copies, 3), 1)
  END,
  available_copies = LEAST(GREATEST(COALESCE(available_copies, total_copies), 0), total_copies),
  is_available = COALESCE(available_copies, 0) > 0;

ALTER TABLE public.library_items
  ALTER COLUMN total_copies SET NOT NULL,
  ALTER COLUMN available_copies SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'library_items_total_copies_check'
  ) THEN
    ALTER TABLE public.library_items
      ADD CONSTRAINT library_items_total_copies_check CHECK (total_copies > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'library_items_available_copies_check'
  ) THEN
    ALTER TABLE public.library_items
      ADD CONSTRAINT library_items_available_copies_check CHECK (available_copies >= 0 AND available_copies <= total_copies);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.sync_library_item_inventory_defaults()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF lower(coalesce(NEW.item_type, '')) = 'thesis' THEN
      NEW.total_copies := 1;
      NEW.available_copies := 1;
    ELSE
      IF NEW.total_copies IS NULL OR NEW.total_copies < 1 THEN
        NEW.total_copies := 1;
      END IF;

      IF NEW.available_copies IS NULL THEN
        NEW.available_copies := NEW.total_copies;
      END IF;

      NEW.available_copies := LEAST(GREATEST(NEW.available_copies, 0), NEW.total_copies);
    END IF;
  ELSE
    IF NEW.total_copies IS NULL OR NEW.total_copies < 1 THEN
      NEW.total_copies := COALESCE(OLD.total_copies, 1);
    END IF;

    IF NEW.available_copies IS NULL THEN
      NEW.available_copies := COALESCE(OLD.available_copies, NEW.total_copies);
    END IF;

    NEW.available_copies := LEAST(GREATEST(NEW.available_copies, 0), NEW.total_copies);
  END IF;

  NEW.is_available := NEW.available_copies > 0;
  NEW.updated_at := COALESCE(NEW.updated_at, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_library_item_inventory_defaults ON public.library_items;
CREATE TRIGGER trg_sync_library_item_inventory_defaults
BEFORE INSERT OR UPDATE ON public.library_items
FOR EACH ROW
EXECUTE FUNCTION public.sync_library_item_inventory_defaults();

CREATE OR REPLACE FUNCTION public.apply_borrow_inventory_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  current_item record;
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;

  IF OLD.status = 'pending' AND NEW.status = 'approved' THEN
    IF NEW.library_item_id IS NOT NULL THEN
      SELECT id, available_copies, total_copies
      INTO current_item
      FROM public.library_items
      WHERE id = NEW.library_item_id
      FOR UPDATE;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Library item not found';
      END IF;

      IF current_item.available_copies <= 0 THEN
        RAISE EXCEPTION 'No available copies left for this book';
      END IF;

      UPDATE public.library_items
      SET
        available_copies = available_copies - 1,
        is_available = (available_copies - 1) > 0,
        updated_at = now()
      WHERE id = NEW.library_item_id;
    END IF;
  ELSIF OLD.status = 'approved' AND NEW.status = 'returned' THEN
    IF NEW.library_item_id IS NOT NULL THEN
      UPDATE public.library_items
      SET
        available_copies = LEAST(available_copies + 1, total_copies),
        is_available = true,
        updated_at = now()
      WHERE id = NEW.library_item_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apply_borrow_inventory_change ON public.student_borrow_requests;
CREATE TRIGGER trg_apply_borrow_inventory_change
AFTER UPDATE OF status ON public.student_borrow_requests
FOR EACH ROW
EXECUTE FUNCTION public.apply_borrow_inventory_change();

-- Optional safety net if your live database is missing the room reservation table.
CREATE TABLE IF NOT EXISTS public.student_room_reservations (
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