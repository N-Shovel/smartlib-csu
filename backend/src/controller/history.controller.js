import { supabaseForRequest } from "../lib/supabaseClient.js";

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

const normalizeBorrowEvents = (events = []) => {
    const grouped = new Map();

    for (const event of events) {
        const key = event.borrow_request_id;
        if (!grouped.has(key)) {
            grouped.set(key, []);
        }
        grouped.get(key).push(event);
    }

    return Array.from(grouped.entries()).map(([borrowRequestId, borrowEvents]) => {
        const sortedEvents = [...borrowEvents].sort(
            (left, right) => new Date(left.occurred_at || 0).getTime() - new Date(right.occurred_at || 0).getTime()
        );

        const requestedEvent = sortedEvents.find((entry) => entry.event_type === "requested") || sortedEvents[0] || {};
        const requestedMeta = requestedEvent.metadata || {};
        const studentProfile = requestedEvent.student_profiles || null;

        let status = "pending";
        let requestedAt = requestedEvent.occurred_at || null;
        let approvedAt = null;
        let returnedAt = null;
        let decisionAt = null;
        let decisionNote = null;
        let approvedByStaffId = null;

        for (const event of sortedEvents) {
            const occurredAt = event.occurred_at;

            if (event.event_type === "approved") {
                status = "approved";
                approvedAt = occurredAt;
                decisionAt = occurredAt;
                decisionNote = null;
                approvedByStaffId = event.staff_user_id || approvedByStaffId;
                continue;
            }

            if (event.event_type === "rejected") {
                status = "rejected";
                decisionAt = occurredAt;
                decisionNote = event.event_note || "REJECTED";
                approvedByStaffId = event.staff_user_id || approvedByStaffId;
                continue;
            }

            if (event.event_type === "returned") {
                status = "returned";
                returnedAt = occurredAt;
                decisionAt = occurredAt;
                decisionNote = event.event_note || "RETURNED";
                approvedByStaffId = event.staff_user_id || approvedByStaffId;
                continue;
            }

            if (event.event_type === "cancelled") {
                status = "cancelled";
                decisionAt = occurredAt;
                decisionNote = event.event_note || "CANCELLED";
            }
        }

        return {
            id: borrowRequestId,
            student_user_id: requestedEvent.student_user_id,
            item_title: requestedMeta.item_title || requestedEvent.item_title || "-",
            item_type: requestedMeta.item_type || requestedEvent.item_type || null,
            requested_at: requestedAt,
            status,
            approved_at: approvedAt,
            returned_at: returnedAt,
            due_at: null,
            library_item_id: requestedMeta.library_item_id || null,
            approved_by_staff_id: approvedByStaffId,
            decision_at: decisionAt,
            decision_note: decisionNote,
            student_profiles: studentProfile
                ? {
                    ...studentProfile,
                    email: studentProfile?.users_public?.email ?? studentProfile?.email ?? null,
                  }
                : null,
        };
    });
};

const normalizeRawBorrowEvents = (events = []) => {
    return events.map((event) => {
        const metadata = event.metadata || {};
        const studentProfile = event.student_profiles || null;
        const parentRequest = event.student_borrow_requests || null;

        return {
            id: event.id,
            borrowRequestId: event.borrow_request_id,
            student_user_id: event.student_user_id,
            staff_user_id: event.staff_user_id,
            eventType: event.event_type,
            eventNote: event.event_note,
            occurredAt: event.occurred_at,
            timestamp: event.occurred_at,
            item_title: metadata.item_title || event.item_title || parentRequest?.item_title || "-",
            item_type: metadata.item_type || event.item_type || parentRequest?.item_type || null,
            library_item_id: metadata.library_item_id || parentRequest?.library_item_id || null,
            requestedAt: event.event_type === "requested" ? event.occurred_at : metadata.requested_at || null,
            status: event.event_type,
            action:
                event.event_type === "requested"
                    ? "BORROW_REQUESTED"
                    : event.event_type === "approved"
                        ? "BORROW_APPROVED"
                        : event.event_type === "returned"
                            ? "BORROW_RETURNED"
                            : event.event_type === "cancelled"
                                ? "BORROW_CANCELLED"
                                    : event.event_type === "rejected"
                                        ? "BORROW_REJECTED"
                                        : "BORROW_REJECTED",
            studentId: studentProfile?.id_number || "-",
            student_profiles: studentProfile
                ? {
                    ...studentProfile,
                    email: studentProfile?.users_public?.email ?? studentProfile?.email ?? null,
                  }
                : null,
            metadata: {
                ...metadata,
                status: event.event_type,
            },
            legacyMetadataStatus: metadata.status || null,
        };
    });
};

export const getRequestHistoryController = async (req, res) =>{
    try{
        const access_token = req.cookies?.access_token;
        if(!access_token) return res.status(401).json({message: "Unauthorized"});
        
        const supabase = supabaseForRequest(access_token);

        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const staffAccess = await hasStaffAccess(supabase, userId, req.user);
        const isStaff = staffAccess.ok;

        let query = supabase
            .from("borrow_request_events")
            .select(
                `
                id,
                borrow_request_id,
                student_user_id,
                staff_user_id,
                event_type,
                event_note,
                metadata,
                occurred_at,
                student_profiles(id_number, first_name, last_name, email, contact_number, program, users_public:users_public(email))
                ,student_borrow_requests(item_title, item_type, library_item_id)
                `
            )
            .order("occurred_at", { ascending: false });

        if (!isStaff) {
            query = query.eq("student_user_id", userId);
        }

        const { data, error } = await query;

        if (error) return res.status(400).json({message: error.message});
        if (!Array.isArray(data) || data.length === 0) {
            return res.status(200).json({ requests: [] });
        }

        const normalizedRequests = normalizeBorrowEvents(data)
            .sort((left, right) => new Date(right.requested_at || right.decision_at || 0).getTime() - new Date(left.requested_at || left.decision_at || 0).getTime());
        const rawEvents = normalizeRawBorrowEvents(data)
            .sort((left, right) => new Date(right.timestamp || 0).getTime() - new Date(left.timestamp || 0).getTime());

       res.status(200).json({
            requests: normalizedRequests,
            events: rawEvents,
        }) 
        
    }
    catch(error){
        console.log("Error in getRequestHistoryController");
        res.status(500).json({message: "Internal server error"});
    }
}
