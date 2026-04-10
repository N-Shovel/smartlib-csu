import { error } from "node:console";
import { supabaseForRequest  } from "../lib/supabaseClient.js";

// Treat admin/staff roles as privileged for item management endpoints.
const isStaffLikeRole = (role) => ["staff", "admin"].includes(String(role || "").toLowerCase());

// Resolve staff access from auth metadata first, then DB profiles as fallback.
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

    // Fallback: some setups store role on student_profiles.
    const { data: fallbackProfile, error: fallbackErr } = await supabase
        .from("student_profiles")
        .select("user_id, role")
        .eq("user_id", userId)
        .maybeSingle();

    if (fallbackErr) {
        return { ok: false, error: fallbackErr.message };
    }

    if (fallbackProfile && isStaffLikeRole(fallbackProfile.role)) {
        return { ok: true };
    }

    return { ok: false, error: "Staff access required", code: 403 };
};

export const createLibraryItemController = async (req, res) =>{
    try {
        
        const access_token = req.cookies?.access_token;
        if(!access_token) return res.status(401).json({message: "Unauthorized"});

        const userId = req.user?.id;
        if(!userId) return res.status(401).json({message: "Unauthorized"});
        
        const { itemType,
                title,
                description,
                author,
                keywords,
                itemNumber,
              } = req.body;

        if(!itemType || !["book", "thesis"].includes(itemType)) return res.status(400).json({message: "Item must be book or thesis"});

        if(!title || typeof title !== "string") return res.status(400).json({message: "title is required"});
        if(!author || typeof author !== "string") return res.status(400).json({message: "author is required"});

        const supabaseUser = supabaseForRequest(access_token);

        // Centralized role gate keeps staff-only create behavior consistent.
        const staffAccess = await hasStaffAccess(supabaseUser, userId, req.user);
        if (!staffAccess.ok) {
            return res.status(staffAccess.code || 400).json({ message: staffAccess.error || "Staff access required" });
        }

        const { data: newItem, error } = await supabaseUser
            .from("library_items")
            .insert({
                item_type: itemType,
                title: title.trim(),
                author,
                description: description ?? null,
                keywords: Array.isArray(keywords) ? keywords : null,
                item_number: itemNumber ?? null,
                is_available: true,
                created_by_staff_id: userId,
            })
            .select("*")
            .single();

        if (error) return res.status(400).json({ message: error.message });

        return res.status(201).json({
            message: "Library item created",
            item: newItem,
        });

    } catch (error) {
        console.log("Error in createLibraryController: ", error);
        res.status(500).json({message: "Internal server error"});
    }
}

export const softDeleteItemController = async (req, res) => {
  try {
    const access_token = req.cookies?.access_token;
    if (!access_token) return res.status(401).json({ message: "Unauthorized" });

        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { itemId } = req.body;
    if (!itemId) return res.status(400).json({ message: "itemId is required" });

    const supabase = supabaseForRequest(access_token);

        // Soft delete is restricted to staff/admin.
        const staffAccess = await hasStaffAccess(supabase, userId, req.user);
        if (!staffAccess.ok) {
            return res.status(staffAccess.code || 400).json({ message: staffAccess.error || "Staff access required" });
        }

    const { error } = await supabase.rpc("soft_delete_library_item", {
      p_item_id: itemId,
    });

    if (error) return res.status(403).json({ message: error.message });

    return res.status(200).json({ message: "Item deleted" });
  } catch (error) {
    return res.status(500).json({ message: error?.message || "Server error" });
  }
};

export const deleteItemController = async (req, res) =>{
    try {
        
        const access_token = req.cookies?.access_token;

        if(!access_token) return res.status(401).json({message: "Unauthorized"});

        const userId = req.user?.id;
        if(!userId) return res.status(401).json({message: "Unauthorized"});

        const {itemId} = req.body;
        if(!itemId) return res.status(400).json({message: "ItemId is required"});

        const supabase = supabaseForRequest(access_token);

        // Hard delete is restricted to staff/admin.
        const staffAccess = await hasStaffAccess(supabase, userId, req.user);
        if (!staffAccess.ok) {
            return res.status(staffAccess.code || 400).json({ message: staffAccess.error || "Staff access required" });
        }

        const {data, error} = await supabase
            .from("library_items")
            .delete()
            .eq("id", itemId)
            .select();

        if(error){
            console.log("Supabase delete error: ", error);
            return res.status(500).json({message: error.message});
        }

        if(!data || data.length === 0) return res.status(400).json({message: "Item not found"});

        return res.status(200).json({message: "Item deleted from database", deleted: data});


    } catch (error) {
        console.log("Error in deleteItemController: ", error);
        return res.status(500).json({message: "Internal Server error"});
    }
}

export const restoreItemController = async (req, res) => {
  try {
    const access_token = req.cookies?.access_token;
    if (!access_token) return res.status(401).json({ message: "Unauthorized" });

        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { itemId } = req.body;
    if (!itemId) return res.status(400).json({ message: "itemId is required" });

    const supabase = supabaseForRequest(access_token);

        // Restore is restricted to staff/admin.
        const staffAccess = await hasStaffAccess(supabase, userId, req.user);
        if (!staffAccess.ok) {
            return res.status(staffAccess.code || 400).json({ message: staffAccess.error || "Staff access required" });
        }

    const { error } = await supabase.rpc("restore_library_item", {
      p_item_id: itemId,
    });

    if (error) return res.status(403).json({ message: error.message });

    return res.status(200).json({ message: "Item restored" });
  } catch (error) {
    return res.status(500).json({ message: error?.message || "Server error" });
  }
};

export const getBooksController = async (req, res) => {
    try {
        const access_token = req.cookies?.access_token;
        if(!access_token) return res.status(401).json({message: "Unauthorized"});

        const supabaseUser = supabaseForRequest(access_token);

        const { data, error } = await supabaseUser
            .from("library_items")
            .select("id, item_type, title, description, keywords, item_number, author, is_available, created_at")
            .is("deleted_at", null)
            .order("created_at", { ascending: false })
            .limit(10);

        if (error) {
            console.error("getBooksController query error:", error);
            return res.status(400).json({ message: error.message });
        }

        return res.status(200).json({
            count: data?.length ?? 0,
            books: data ?? [],
        });
    } catch (e) {
        console.error("getBooksController error:", e);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const requestItemController = async (req, res) =>{
    try {
        
        const access_token = req?.cookies?.access_token;
        if(!access_token) return res.status(401).json({message: "Unauthorized"});

        const userId = req.user?.id;
        if(!userId) return res.status(401).json({message: "Unauthorized"});

        const { 
                item_title,
                item_type,
                item_id,
                } = req.body;
        
        if(!item_type || !["book", "thesis"].includes(item_type)) return res.status(400).json({message: "Item must be book or thesis"});
        if(!item_title || typeof item_title !== "string") return res.status(400).json({message: "title is required"});
    
        const supabase = supabaseForRequest(access_token);

        // Enforce one active borrow/request per user for the same item.
        // A user can request again only after a terminal status (returned/rejected/cancelled).
        const { data: existingRequests, error: existingErr } = await supabase
            .from("student_borrow_requests")
            .select("id, status")
            .eq("student_user_id", userId)
            .eq("library_item_id", item_id)
            .in("status", ["pending", "approved", "pending_return"])
            .limit(1);

        if (existingErr) return res.status(400).json({ message: existingErr.message });
        if (Array.isArray(existingRequests) && existingRequests.length > 0) {
            return res.status(409).json({
                message: "You already have an active request/borrow for this book.",
            });
        }

        const { data: studentProfile, error: studentErr } = await supabase
            .from("student_profiles")
            .select("user_id, role")
            .eq("user_id", userId)
            .maybeSingle();

        if (studentErr) return res.status(400).json({ message: studentErr.message });
        if (!studentProfile) return res.status(403).json({ message: "Student access required" });
        
        const {data: newReq, error: reqErr} = await supabase
            .from("student_borrow_requests")
            .insert({
                student_user_id: userId,
                item_title: item_title.trim(),
                item_type: item_type.trim(),
                library_item_id: item_id
            })
            .select("*")
            .single();

        if(!newReq || reqErr) return res.status(400).json({message: reqErr.message || "Failed to create send request"});

        
        res.status(201).json({message: "Request was sent, please wait for the confirmation"});

    } catch (error) {
        console.log("Error in requestItemController: ", error);
        res.status(500).json({message: "Internal server error"});
    }     
}

export const approveBorrowRequestController = async (req, res) => {
    try {
        const access_token = req?.cookies?.access_token;
        if (!access_token) return res.status(401).json({ message: "Unauthorized" });

        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const { requestId } = req.body;
        if (!requestId) return res.status(400).json({ message: "requestId is required" });

        const supabase = supabaseForRequest(access_token);

        // Only staff/admin can approve borrower pickup requests.
        const staffAccess = await hasStaffAccess(supabase, userId, req.user);
        if (!staffAccess.ok) {
            return res.status(staffAccess.code || 400).json({ message: staffAccess.error || "Staff access required" });
        }

        const { data: borrowRequest, error: requestErr } = await supabase
            .from("student_borrow_requests")
            .select("id, status, library_item_id")
            .eq("id", requestId)
            .maybeSingle();

        if (requestErr) return res.status(400).json({ message: requestErr.message });
        if (!borrowRequest) return res.status(404).json({ message: "Borrow request not found" });
        if (borrowRequest.status !== "pending") {
            return res.status(400).json({ message: "Only pending requests can be approved" });
        }

        // Keep request status and item availability synchronized.
        if (borrowRequest.library_item_id) {
            const { data: item, error: itemErr } = await supabase
                .from("library_items")
                .select("id, is_available")
                .eq("id", borrowRequest.library_item_id)
                .maybeSingle();

            if (itemErr) return res.status(400).json({ message: itemErr.message });
            if (!item) return res.status(404).json({ message: "Library item not found" });

            const { error: itemUpdateErr } = await supabase
                .from("library_items")
                .update({ is_available: false })
                .eq("id", item.id);

            if (itemUpdateErr) return res.status(400).json({ message: itemUpdateErr.message });
        }

        const nowIso = new Date().toISOString();
        const { error: updateReqErr } = await supabase
            .from("student_borrow_requests")
            .update({
                status: "approved",
                approved_at: nowIso,
            })
            .eq("id", requestId);

        if (updateReqErr) return res.status(400).json({ message: updateReqErr.message });

        return res.status(200).json({ message: "Borrow request approved" });
    } catch (error) {
        console.log("Error in approveBorrowRequestController: ", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const requestReturnController = async (req, res) => {
    try {
        const access_token = req?.cookies?.access_token;
        if (!access_token) return res.status(401).json({ message: "Unauthorized" });

        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const { itemId } = req.body;
        if (!itemId) return res.status(400).json({ message: "itemId is required" });

        const supabase = supabaseForRequest(access_token);

        // Borrower can request return only for an active approved borrow.
        const { data: activeBorrow, error: borrowErr } = await supabase
            .from("student_borrow_requests")
            .select("id, status")
            .eq("student_user_id", userId)
            .eq("library_item_id", itemId)
            .eq("status", "approved")
            .order("approved_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (borrowErr) return res.status(400).json({ message: borrowErr.message });
        if (!activeBorrow) {
            return res.status(404).json({ message: "No approved borrow record found for this item" });
        }

        const { error: updateErr } = await supabase
            .from("student_borrow_requests")
            .update({ status: "pending_return" })
            .eq("id", activeBorrow.id);

        if (updateErr) return res.status(400).json({ message: updateErr.message });

        return res.status(200).json({ message: "Return request submitted" });
    } catch (error) {
        console.log("Error in requestReturnController: ", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const confirmReturnController = async (req, res) => {
    try {
        const access_token = req?.cookies?.access_token;
        if (!access_token) return res.status(401).json({ message: "Unauthorized" });

        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const { requestId } = req.body;
        if (!requestId) return res.status(400).json({ message: "requestId is required" });

        const supabase = supabaseForRequest(access_token);

        // Only staff/admin can finalize returns and free the item.
        const staffAccess = await hasStaffAccess(supabase, userId, req.user);
        if (!staffAccess.ok) {
            return res.status(staffAccess.code || 400).json({ message: staffAccess.error || "Staff access required" });
        }

        const { data: pendingReturn, error: returnErr } = await supabase
            .from("student_borrow_requests")
            .select("id, status, library_item_id")
            .eq("id", requestId)
            .maybeSingle();

        if (returnErr) return res.status(400).json({ message: returnErr.message });
        if (!pendingReturn) return res.status(404).json({ message: "Borrow request not found" });
        if (!["pending_return", "approved"].includes(String(pendingReturn.status || "").toLowerCase())) {
            return res.status(400).json({ message: "Only approved or pending return requests can be confirmed" });
        }

        // Mark request as returned and persist return timestamp.
        const nowIso = new Date().toISOString();
        const { error: updateReturnErr } = await supabase
            .from("student_borrow_requests")
            .update({
                status: "returned",
                returned_at: nowIso,
            })
            .eq("id", pendingReturn.id);

        if (updateReturnErr) return res.status(400).json({ message: updateReturnErr.message });

        // Re-open item availability after return confirmation.
        if (pendingReturn.library_item_id) {
            const { data: item, error: itemErr } = await supabase
                .from("library_items")
                .select("id, is_available")
                .eq("id", pendingReturn.library_item_id)
                .maybeSingle();

            if (itemErr) return res.status(400).json({ message: itemErr.message });
            if (!item) return res.status(404).json({ message: "Library item not found" });

            const { error: itemUpdateErr } = await supabase
                .from("library_items")
                .update({ is_available: true })
                .eq("id", pendingReturn.library_item_id);

            if (itemUpdateErr) return res.status(400).json({ message: itemUpdateErr.message });
        }

        return res.status(200).json({ message: "Book marked as returned" });
    } catch (error) {
        console.log("Error in confirmReturnController: ", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const updateItemStatusController = async (req, res) =>{

}
