import { supabaseForRequest } from "../lib/supabaseClient.js";

export const activityLogs = async (req, res) =>{
    try {

        const access_token = req.cookies?.access_token;

        if(!access_token) return res.status(401).json({message: "Unauthorized"});

        const supabase = supabaseForRequest(access_token);
        
        const {data, error} = await supabase
            .from("staff_activity_log")
            .select("")

        
    } catch (error) {
        console.log("Error in activityLogs controller", error);
        res.status(500).json({message: ""})
    }
}
