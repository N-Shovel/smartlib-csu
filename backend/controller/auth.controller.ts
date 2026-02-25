import { supabase } from "../lib/supabaseClient.ts"
import type { Response, Request } from "express";
import { setCookies } from "../lib/utils.ts";

export const signupController = async (req: Request, res: Response) =>{
    const {email, password, fullName} = req.body;
    
    if(!fullName) return res.status(400).json({message: "Name is required"});
    if(!email || !password) return res.status(400).json({message: "Email and password are required"});

    
    //check if email is valid with regex;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
    }
    
    if(password.length < 8) return res.status(400).json({message: "Password must be atleast 8 characters"});

    try {
        const {data, error}  = await supabase.auth.signUp({
            email,
            password
        })
        
        if(error){
            return res.status(400).json({message: error.message});
        }
        
        //get user id
        const user_id = data.user?.id;
        
        if(!user_id) return res.status(400).json({message: "User not returned!"});

        
        //insert data into supabase db
        const {data: profileData, error: profileError} = await supabase.from("users")
            .insert([{id: user_id, fullname: fullName, email}])
            .select("fullname, role, email")
            .single();
        if (profileError) return res.status(400).json({ message: profileError.message });
    
        
        const { refresh_token, access_token, expires_in } = data.session || {};
        
        //authenticate user
        setCookies(res, access_token, refresh_token, expires_in)
        

        return res.status(201).json({
            message: "Account created successfully",
            profile: profileData,
            user: data.user,
        })

    } catch (error) {
        console.log("Error in signup controller: ", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export const loginController = async (req: Request, res: Response) =>{
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return res.status(401).json({ error: error.message });
        }
        
        const user_id = data.user?.id;

        if(!user_id) return res.status(404).json({message: "User id not found"});

        const {data: profileData, error: profileError} = await supabase.from("users")
                .select("fullname, role, email")
                .eq("id", user_id)
                .single();
        if(profileError || !profileData) return res.status(404).json({message: "User not found"}); 
    
        const { refresh_token, access_token, expires_in } = data.session || {};

        //authenticate user
        setCookies(res, access_token, refresh_token, expires_in)

        return res.status(200).json({
            message: "Login successful",
            profile: profileData,
            user: data.user,
        });
    } catch (err) {
        console.error("Error in login controller: ", err);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export const logoutController = (_: any, res: Response) =>{
    try {
        
        res.clearCookie("access_token");
        res.clearCookie("refresh_token");

        res.status(200).json({message: "Logout Successfully"});

    } catch (error) {
        console.log("Error in logout Controller: ",error);
        res.status(500).json({message: "Internal server error"});
    } 
}

export const getProfile = async (req: Request, res: Response) =>{
    try{

        const userId = req.user?.id;
        
        if(!userId) return res.status(404).json({message: "User id not found"});

        const {data, error} = await supabase.from("users")
        .select("fullname, role, email")
        .eq("id", userId)
        .single();
        
        if(error || !data) return res.status(404).json({message: "User not found"});

        res.status(200).json({db: data, user: req.user});
    }
    catch(error){
        console.log("Error in getProfile controller: ", error);
        return res.status(500).json({message: "Server error"});
    }
}
