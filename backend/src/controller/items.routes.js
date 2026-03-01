import { supabaseForRequest, supabase } from "../lib/supabaseClient.js";

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

export const getBooksController = async (req, res) => {
  try {
    const access_token = req.cookies?.access_token;
    if(!access_token) return res.status(401).json({message: "Unauthorized"});

    const supabaseUser = supabaseForRequest(access_token);

    const { data, error } = await supabaseUser
      .from("library_items")
      .select("id, item_type, title, description, item_number, author ,is_available, created_at")
      .eq("item_type", "book")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("getBooksController query error:", error);
      return res.status(400).json({ message: error.message });
    }

    console.log("getBooksController returned:", data?.length ?? 0, "books");
    return res.status(200).json({
      count: data?.length ?? 0,
      books: data ?? [],
    });
  } catch (e) {
    console.error("getBooksController error:", e);
    return res.status(500).json({ message: "Internal server error" });
  }
};
