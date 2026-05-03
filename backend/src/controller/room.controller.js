import { supabaseForRequest } from "../lib/supabaseClient.js";

// Helper to check if user has staff access for approval operations
const isStaffLikeRole = (role) => ["staff", "admin"].includes(String(role || "").toLowerCase());

const hasStaffAccess = async (supabase, userId, authUser = null) => {
    const metadataRole =
        authUser?.app_metadata?.role ||
        authUser?.user_metadata?.role ||
        null;

    if (isStaffLikeRole(metadataRole)) {
        return { ok: true };
    }

    const { data: staffProfile, error: staffErr } = await supabase
        .from("staff_profiles")
        .select("user_id, role")
        .eq("user_id", userId)
        .maybeSingle();

    if (staffErr) {
        return { ok: false, error: staffErr.message };
    }

    if (staffProfile) {
        return { ok: true };
    }

    return { ok: false, error: "Staff access required", code: 403 };
};

// Helper to convert hour number to date-based timestamps
const getReservationTimestamps = (hour) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const time_start = new Date(today.getTime());
    time_start.setHours(hour, 0, 0, 0);
    
    const time_end = new Date(today.getTime());
    time_end.setHours(hour + 1, 0, 0, 0);
    
    return { time_start, time_end };
};

// Helper to extract hour from timestamp
const getHourFromTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.getHours();
};

const autoCloseExpiredPendingReservations = async (supabase) => {
    const nowIso = new Date().toISOString();

    const { error } = await supabase
        .from("student_room_reservations")
        .update({
            status: "rejected",
            decision_at: nowIso,
            decision_note: "AUTO_EXPIRED",
        })
        .eq("status", "pending")
        .lt("time_end", nowIso);

    if (error) {
        throw new Error(error.message);
    }
};

/**
 * Create a new room reservation
 * POST /api/room/reservations
 * Body: { room_number, reservation_hour, purpose }
 */
export const createReservationController = async (req, res) => {
    try {
        const access_token = req.cookies?.access_token;
        if (!access_token) return res.status(401).json({ message: "Unauthorized" });

        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const { room_number, reservation_hour, purpose } = req.body;

        // Validate inputs
        if (!room_number || typeof room_number !== "string") {
            return res.status(400).json({ message: "room_number is required" });
        }
        if (typeof reservation_hour !== "number" || reservation_hour < 8 || reservation_hour >= 18) {
            return res.status(400).json({ message: "reservation_hour must be between 8 and 17" });
        }

        const supabase = supabaseForRequest(access_token);

        // Expired pending requests should no longer block a new reservation.
        await autoCloseExpiredPendingReservations(supabase);

        // Check if student profile exists
        const { data: studentProfile, error: studentErr } = await supabase
            .from("student_profiles")
            .select("user_id")
            .eq("user_id", userId)
            .maybeSingle();

        if (studentErr) {
            return res.status(400).json({ message: studentErr.message });
        }

        if (!studentProfile) {
            return res.status(403).json({ message: "Student profile not found" });
        }

        // Check if student already has an active reservation
        const { data: existingReservation, error: existingErr } = await supabase
            .from("student_room_reservations")
            .select("id")
            .eq("student_user_id", userId)
            .in("status", ["pending", "approved"])
            .maybeSingle();

        if (existingErr && existingErr.code !== "PGRST116") {
            return res.status(400).json({ message: existingErr.message });
        }

        if (existingReservation) {
            return res.status(400).json({ message: "You already have an active reservation" });
        }

        // Check if requested time slot is available
        const { time_start, time_end } = getReservationTimestamps(reservation_hour);

        const { data: conflictingReservations, error: conflictErr } = await supabase
            .from("student_room_reservations")
            .select("id")
            .eq("room_number", room_number)
            .eq("status", "approved")
            .gte("time_start", time_start.toISOString())
            .lt("time_end", time_end.toISOString());

        if (conflictErr) {
            return res.status(400).json({ message: conflictErr.message });
        }

        if (conflictingReservations && conflictingReservations.length > 0) {
            return res.status(400).json({ message: "Selected time slot is unavailable" });
        }

        // Reject if time slot is in the past
        if (time_start < new Date()) {
            return res.status(400).json({ message: "Cannot reserve for a past time slot" });
        }

        // Create reservation
        const { data: newReservation, error: createErr } = await supabase
            .from("student_room_reservations")
            .insert({
                student_user_id: userId,
                room_number: room_number.trim(),
                time_start: time_start.toISOString(),
                time_end: time_end.toISOString(),
                purpose: purpose?.trim() || null,
                status: "pending",
            })
            .select("*")
            .single();

        if (createErr) {
            return res.status(400).json({ message: createErr.message });
        }

        return res.status(201).json({
            message: "Reservation created successfully",
            reservation: newReservation,
        });
    } catch (error) {
        console.error("Error creating reservation:", error.message);
        return res.status(500).json({ message: error.message });
    }
};

/**
 * Get all reservations (for staff/borrower tracking)
 * GET /api/room/reservations?status=pending
 */
export const getReservationsController = async (req, res) => {
    try {
        const access_token = req.cookies?.access_token;
        if (!access_token) return res.status(401).json({ message: "Unauthorized" });

        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const { status, room_number } = req.query;

        const supabase = supabaseForRequest(access_token);

        // Ensure pending reservations that already passed are auto-closed before listing.
        await autoCloseExpiredPendingReservations(supabase);

        // Check staff access for filtering
        const staffAccess = await hasStaffAccess(supabase, userId, req.user);
        const isStaff = staffAccess.ok;

        let query = supabase
            .from("student_room_reservations")
            .select(
                `
                id, 
                student_user_id, 
                room_number, 
                time_start, 
                time_end, 
                purpose, 
                status, 
                created_at,
                student_profiles(id_number, first_name, last_name, email, users_public:users_public(email))
                `
            );

        // Non-staff can only see their own reservations
        if (!isStaff) {
            query = query.eq("student_user_id", userId);
        }

        // Apply optional filters
        if (status) {
            query = query.eq("status", status);
        }

        if (room_number) {
            query = query.eq("room_number", room_number);
        }

        const { data: reservations, error } = await query.order("created_at", { ascending: false });

        if (error) {
            return res.status(400).json({ message: error.message });
        }

        // Flatten response for easier frontend consumption
        const normalized = reservations.map((res) => ({
            id: res.id,
            student_user_id: res.student_user_id,
            room: res.room_number,
            reservationHour: getHourFromTimestamp(res.time_start),
            requestedBy: res.student_profiles?.users_public?.email || res.student_profiles?.email || "unknown",
            notes: res.purpose,
            status: res.status,
            createdAt: res.created_at,
            // DB uses `decision_at` for approval/decision timestamps for room reservations.
            approvedAt: res.decision_at,
            decisionAt: res.decision_at,
            decisionNote: res.decision_note,
            timeEnd: res.time_end,
            studentId: res.student_profiles?.id_number || "-",
            studentName: `${res.student_profiles?.first_name || ""} ${res.student_profiles?.last_name || ""}`.trim(),
        }));

        return res.status(200).json({
            message: "Reservations retrieved successfully",
            reservations: normalized,
        });
    } catch (error) {
        console.error("Error fetching reservations:", error.message);
        return res.status(500).json({ message: error.message });
    }
};

/**
 * Approve a reservation (staff only)
 * PATCH /api/room/reservations/:id/approve
 */
export const approveReservationController = async (req, res) => {
    try {
        const access_token = req.cookies?.access_token;
        if (!access_token) return res.status(401).json({ message: "Unauthorized" });

        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const { id } = req.params;

        const supabase = supabaseForRequest(access_token);

        // Keep history/status accurate by auto-closing expired pending reservations first.
        await autoCloseExpiredPendingReservations(supabase);

        // Check staff access
        const staffAccess = await hasStaffAccess(supabase, userId, req.user);
        if (!staffAccess.ok) {
            return res.status(staffAccess.code || 403).json({ message: staffAccess.error });
        }

        const nowIso = new Date().toISOString();

        // Update reservation: mark approved, record approver id and decision timestamp/note.
        const { data: updated, error } = await supabase
            .from("student_room_reservations")
            .update({
                status: "approved",
                approved_by_staff_id: userId,
                decision_at: nowIso,
                decision_note: null,
            })
            .eq("id", id)
            .select("*")
            .single();

        if (error) {
            return res.status(400).json({ message: error.message });
        }

        if (!updated) {
            return res.status(404).json({ message: "Reservation not found" });
        }

        return res.status(200).json({
            message: "Reservation approved successfully",
            reservation: updated,
        });
    } catch (error) {
        console.error("Error approving reservation:", error.message);
        return res.status(500).json({ message: error.message });
    }
};

/**
 * Close/mark as completed a reservation (staff only)
 * PATCH /api/room/reservations/:id/close
 */
export const closeReservationController = async (req, res) => {
    try {
        const access_token = req.cookies?.access_token;
        if (!access_token) return res.status(401).json({ message: "Unauthorized" });

        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const { id } = req.params;

        const supabase = supabaseForRequest(access_token);

        // Check staff access
        const staffAccess = await hasStaffAccess(supabase, userId, req.user);
        if (!staffAccess.ok) {
            return res.status(staffAccess.code || 403).json({ message: staffAccess.error });
        }

        const nowIso = new Date().toISOString();

        // Update reservation to a terminal state while preserving the close event.
        const { data: updated, error } = await supabase
            .from("student_room_reservations")
            .update({
                status: "rejected",
                decision_at: nowIso,
                decision_note: "MANUAL_CLOSED",
            })
            .eq("id", id)
            .select("*")
            .single();

        if (error) {
            return res.status(400).json({ message: error.message });
        }

        if (!updated) {
            return res.status(404).json({ message: "Reservation not found" });
        }

        return res.status(200).json({
            message: "Reservation closed successfully",
            reservation: updated,
        });
    } catch (error) {
        console.error("Error closing reservation:", error.message);
        return res.status(500).json({ message: error.message });
    }
};

/**
 * Cancel a reservation (student can cancel their own, staff can cancel any)
 * PATCH /api/room/reservations/:id/cancel
 */
export const cancelReservationController = async (req, res) => {
    try {
        const access_token = req.cookies?.access_token;
        if (!access_token) return res.status(401).json({ message: "Unauthorized" });

        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const { id } = req.params;

        const supabase = supabaseForRequest(access_token);

        // Get the reservation
        const { data: reservation, error: getErr } = await supabase
            .from("student_room_reservations")
            .select("*")
            .eq("id", id)
            .single();

        if (getErr) {
            return res.status(404).json({ message: "Reservation not found" });
        }

        // Check authorization
        const isStaff = (await hasStaffAccess(supabase, userId, req.user)).ok;
        if (!isStaff && reservation.student_user_id !== userId) {
            return res.status(403).json({ message: "Unauthorized to cancel this reservation" });
        }

        // Update reservation
        const { data: updated, error } = await supabase
            .from("student_room_reservations")
            .update({ status: "cancelled" })
            .eq("id", id)
            .select("*")
            .single();

        if (error) {
            return res.status(400).json({ message: error.message });
        }

        return res.status(200).json({
            message: "Reservation cancelled successfully",
            reservation: updated,
        });
    } catch (error) {
        console.error("Error cancelling reservation:", error.message);
        return res.status(500).json({ message: error.message });
    }
};

/**
 * Get reservation history (staff only)
 * GET /api/room/reservations/history
 */
export const getReservationHistoryController = async (req, res) => {
    try {
        const access_token = req.cookies?.access_token;
        if (!access_token) return res.status(401).json({ message: "Unauthorized" });

        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const supabase = supabaseForRequest(access_token);

        // Check staff access
        const staffAccess = await hasStaffAccess(supabase, userId, req.user);
        if (!staffAccess.ok) {
            return res.status(staffAccess.code || 403).json({ message: staffAccess.error });
        }

        // Get all reservations with history across all statuses
        const { data: reservations, error } = await supabase
            .from("student_room_reservations")
            .select(
                `
                id, 
                student_user_id, 
                room_number, 
                time_start, 
                time_end, 
                purpose, 
                status, 
                created_at,
                decision_at,
                decision_note,
                student_profiles(id_number, first_name, last_name, email, users_public:users_public(email))
                `
            )
            .order("created_at", { ascending: false });

        if (error) {
            return res.status(400).json({ message: error.message });
        }

        // Flatten response
        const normalized = reservations.map((res) => ({
            id: res.id,
            room: res.room_number,
            reservationHour: getHourFromTimestamp(res.time_start),
            requestedBy: res.student_profiles?.users_public?.email || res.student_profiles?.email || "unknown",
            notes: res.purpose,
            status: res.status,
            createdAt: res.created_at,
            reservationDate: res.time_start,
            // Use `decision_at` as the canonical approval/decision timestamp in the schema.
            approvedAt: res.decision_at,
            decisionAt: res.decision_at,
            decisionNote: res.decision_note,
            timeEnd: res.time_end,
            studentId: res.student_profiles?.id_number || "-",
            studentName: `${res.student_profiles?.first_name || ""} ${res.student_profiles?.last_name || ""}`.trim(),
            action:
                res.status === "approved"
                    ? "RESERVATION_APPROVED"
                    : res.status === "rejected" && res.decision_note === "AUTO_EXPIRED"
                        ? "RESERVATION_AVAILABLE"
                        : res.status === "rejected"
                            ? "RESERVATION_ENDED"
                        : res.status === "cancelled"
                            ? "RESERVATION_CANCELLATION_REQUESTED"
                                : "RESERVATION_REQUESTED",
        }));

        return res.status(200).json({
            message: "Reservation history retrieved successfully",
            history: normalized,
        });
    } catch (error) {
        console.error("Error fetching reservation history:", error.message);
        return res.status(500).json({ message: error.message });
    }
};
