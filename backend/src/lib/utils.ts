import { ENV } from "./ENV"
import type { Response } from "express";

export const setCookies = (res: Response, access_token: String | undefined, refresh_token: String | undefined, expires_in: number | undefined): void =>{
   
    if(!expires_in){
        console.log('expires_in is undefined');
        return;
    }

    const isProd = ENV.NODE_ENV === "production";
    
    res.cookie("access_token", access_token, {
        httpOnly: true,
        secure: isProd,
        sameSite: (isProd ? "none" : "lax") as "none" | "lax",
        maxAge: expires_in * 1000
    })

    res.cookie("refresh_token", refresh_token, {
        httpOnly: true,
        secure: isProd,
        sameSite: (isProd ? "none" : "lax") as "none" | "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    })

}
