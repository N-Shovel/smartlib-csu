import { supabase, supabaseForRequest } from "../lib/supabaseClient.js"
import { setCookies } from "../lib/utils.js";

const NAME_PATTERN = /^[A-Za-z\s.'-]+$/;
const DIGITS_ONLY_PATTERN = /^\d+$/;
const CONTACT_PATTERN = /^\d{11}$/;

export const signupController = async (req, res) => {
    const {
        email,
        password,

        // student fields
        idNumber,
        firstName,
        lastName,
        suffix,
        program,
        contactNumber,
        address,
    } = req.body;

    if (!firstName || !lastName) {
        return res.status(400).json({ message: "First name and last name are required" });
    }

    if (!idNumber) return res.status(400).json({ message: "ID Number is required" });
    if (!program) return res.status(400).json({ message: "Program is required" });

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    if (!NAME_PATTERN.test(String(firstName || "").trim()) || !NAME_PATTERN.test(String(lastName || "").trim())) {
        return res.status(400).json({ message: "First name and last name must contain letters only." });
    }

    if (!DIGITS_ONLY_PATTERN.test(String(idNumber || "").trim())) {
        return res.status(400).json({ message: "ID number must contain numbers only." });
    }

    if (contactNumber && (!DIGITS_ONLY_PATTERN.test(String(contactNumber).trim()) || !CONTACT_PATTERN.test(String(contactNumber).trim()))) {
        return res.status(400).json({ message: "Contact number must contain numbers only and be 11 digits." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
    }

    if (typeof password !== "string" || password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
    }


    try {
        // Check if user already exists in student_profiles
        const { data: existingProfile } = await supabase
            .from("student_profiles")
            .select("user_id")
            .eq("id_number", String(idNumber).trim())
            .single();
        
        if (existingProfile) {
            return res.status(400).json({ message: "Student ID already registered" });
        }

        // 1) Create auth user (Supabase Auth)
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            // Check if user already exists in auth
            if (error.message.includes("already registered") || error.message.includes("already exists")) {
                return res.status(400).json({ 
                    message: "Email already registered. If you're having trouble logging in, please contact support." 
                });
            }
            return res.status(400).json({ message: error.message });
        }

        const userId = data.user?.id;
        if (!userId) return res.status(400).json({ message: "User not returned!" });

        // 2) Insert student profile into student_profiles (NOT "users")
        //    user_id must match auth.users.id
        const { data: studentProfile, error: profileError } = await supabase
            .from("student_profiles")
            .insert([
                {
                    user_id: userId,
                    id_number: String(idNumber).trim(),
                    first_name: String(firstName).trim(),
                    last_name: String(lastName).trim(),
                    suffix: suffix ? String(suffix).trim() : null,
                    program: String(program).trim(),
                    contact_number: contactNumber ? String(contactNumber).trim() : null,
                    address: address ? String(address).trim() : null,
                    email: String(email).trim().toLowerCase(),
                },
            ])
            .select(
                "user_id, id_number, first_name, last_name, suffix, role ,program, contact_number, address, created_at"
            )
            .single();

        if (profileError) {
            console.error("Profile creation error:", profileError);
            // Return a helpful message for the user
            return res.status(400).json({ 
                message: profileError.message 
            });
        }

        // 3) Set cookies if session exists (depends on your Supabase email confirmation settings)
        const { refresh_token, access_token, expires_in } = data.session || {};

        if (access_token && refresh_token && expires_in) {
            setCookies(res, access_token, refresh_token, expires_in);
        }

        return res.status(201).json({
            message: "Student account created successfully",
            profile: studentProfile,
            user: data.user,
        });
    } catch (error) {
        console.log("Error in signup controller: ", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const loginController = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return res.status(401).json({ message: error.message });
        }

        const userId = data.user?.id;
        if (!userId) return res.status(404).json({ message: "User id not found" });

        const { refresh_token, access_token, expires_in } = data.session || {};
        if (!refresh_token || !access_token || !expires_in) {
            return res.status(401).json({ message: "Session missing" });
        }

        setCookies(res, access_token, refresh_token, expires_in);

        const supabaseUser = supabaseForRequest(access_token);

        // 1) Try staff profile first
        const { data: staffProfile, error: staffErr } = await supabaseUser
            .from("staff_profiles")
            .select("user_id, staff_id, first_name, last_name, role, created_at")
            .eq("user_id", userId)
            .maybeSingle();

        if (staffErr) {
            console.error("Staff profile lookup error:", staffErr);
            return res.status(500).json({ message: "Failed to lookup staff profile" });
        }

        if (staffProfile) {
            return res.status(200).json({
                message: "Login successful",
                profile: staffProfile,
                user: data.user,
            });
        }

        // 2) Otherwise, try student profile
        const { data: studentProfile, error: studentErr } = await supabaseUser
            .from("student_profiles")
            .select(
                "user_id, id_number, first_name, last_name, suffix, program, role ,contact_number, address, created_at"
            )
            .eq("user_id", userId)
            .maybeSingle();

        if (studentErr) {
            console.error("Student profile lookup error:", studentErr);
            return res.status(500).json({ message: "Failed to lookup student profile" });
        }

        if (!studentProfile) {
            // Auth user exists, but no profile in either table
            return res.status(403).json({
                message: "Account has no profile (staff or student). Contact admin.",
            });
        }

        return res.status(200).json({
            message: "Login successful",
            profile: studentProfile,
            user: data.user,
        });
    } catch (err) {
        console.error("Error in login controller: ", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const logoutController = async (_, res) => {
    try {

        try {
            await supabase.auth.signOut();
        } catch (e) {
            console.error("Supabase signOut error:", e);
            // continue to clear cookies even if supabase call fails
        }

        // Ensure cookies are cleared with proper options
        try {
            const { clearAuthCookies } = await import("../lib/utils.js");
            clearAuthCookies(res);
        } catch (e) {
            // Fallback to generic clear
            res.clearCookie("access_token");
            res.clearCookie("refresh_token");
        }

        return res.status(200).json({ message: "Logout successfully" });
    } catch (error) {
        console.log("Error in logout Controller: ", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const refreshController = async (req, res) => {
    try {
        const refresh_token = req.cookies?.refresh_token;
        if (!refresh_token) {
            res.clearCookie("access_token");
            res.clearCookie("refresh_token");
            return res.status(401).json({ message: "Missing refresh token" });
        }

        const { data, error } = await supabase.auth.refreshSession({ refresh_token });

        if (error || !data.session) {
            res.clearCookie("access_token");
            res.clearCookie("refresh_token");
            return res.status(401).json({ message: error?.message ?? "Could not refresh session" });
        }

        const { access_token, refresh_token: new_refresh_token, expires_in } = data.session;

        // overwrite cookies with the new tokens
        setCookies(res, access_token, new_refresh_token, expires_in);

        return res.status(200).json({
            message: "Session refreshed",
            user: data.user,
        });
    } catch (e) {
        console.error("refreshController error:", e);
        return res.status(500).json({ message: "Internal server error" });
    }
};
