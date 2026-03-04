import { supabaseForRequest } from "../lib/supabaseClient.js";

export const getRequestHistoryController = async (req, res) =>{
    try{
        const access_token = req.cookies?.access_token;
        if(!access_token) return res.status(401).json({message: "Unauthorized"});
        
        const supabase = supabaseForRequest(access_token);

        const {data, error} = await supabase
            .from("student_borrow_requests")
            .select("*, student_profiles(id_number, first_name, last_name, contact_number, program)")
        
        if(!data) return res.status(404).json({message: "History does not exist"});
        if(error) return res.status(400).json({message: error.message});

       res.status(200).json({
            requests: data?? [] 
        }) 
        
    }
    catch(error){
        console.log("Error in getRequestHistoryController");
        res.status(500).json({message: "Internal server error"});
    }
}
