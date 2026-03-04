import { error } from "node:console";
import { supabaseForRequest  } from "../lib/supabaseClient.js";

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

        const { data: staffProfile, error: staffErr } = await supabaseUser
            .from("staff_profiles")
            .select("user_id, role")
            .eq("user_id", userId)
            .maybeSingle();

        if (staffErr) return res.status(400).json({ message: staffErr.message });
        if (!staffProfile) return res.status(403).json({ message: "Staff access required" });

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

    const { itemId } = req.body;
    if (!itemId) return res.status(400).json({ message: "itemId is required" });

    const supabase = supabaseForRequest(access_token);

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

        const {itemId} = req.body;
        if(!itemId) return res.status(400).json({message: "ItemId is required"});

        const supabase = supabaseForRequest(access_token);

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

    const { itemId } = req.body;
    if (!itemId) return res.status(400).json({ message: "itemId is required" });

    const supabase = supabaseForRequest(access_token);

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
            .select("id, item_type, title, description, item_number, author ,is_available, created_at")
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

export const updateItemStatusController = async (req, res) =>{

}
