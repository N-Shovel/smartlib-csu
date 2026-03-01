import { supabase } from "../lib/supabaseClient.js";


const protectRoute = async (req, res, next) =>{
    try {

        const token = req.cookies.access_token;

        if(!token) return res.status(401).json({message: "Unauthorized"});

        const {data, error} = await supabase.auth.getUser(token);

        if(error || !data?.user) return res.status(401).json({message: "Invalid token"});

        req.user = data.user;

        next();

    } catch (error) {
        console.log("protectRoute error: ", error);
        res.status(500).json({message: "Internal server error"});
    }
}

export default protectRoute;
