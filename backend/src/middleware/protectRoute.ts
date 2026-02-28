import { supabase } from "../lib/supabaseClient";
import type { Request, Response, NextFunction } from "express";


const protectRoute = async (req: Request, res: Response, next: NextFunction) =>{
    try {

        const token = req.cookies.access_token;

        if(!token) return res.status(401).json({message: "Unauthorized"});

        const {data, error} = await supabase.auth.getUser(token);

        if(error || !data?.user) return res.status(401).json({message: "Invalid token"});

        (req as any).user = data.user;

        next();

    } catch (error) {
        console.log("protectRoute error: ", error);
        res.status(500).json({message: "Internal server error"});
    }
}

export default protectRoute;
