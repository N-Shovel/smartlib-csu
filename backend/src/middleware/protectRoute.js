import { supabase } from "../lib/supabaseClient.js";

const protectRoute = async (req, res, next) =>{
    try {

        const token = req.cookies.access_token;

        if(!token) return res.status(401).json({message: "Unauthorized"});

        const {data, error} = await supabase.auth.getUser(token);
        
        if(error || !data) return res.status(401).json({message: "Invalid token"});

        req.user = data.user;

        next();

    } catch (error) {

    }
}

export default protectRoute;
