import { ENV } from "./ENV.js"

export const setCookies = (res, access_token, refresh_token, expires_in) =>{
   
    if(!expires_in){
        console.log('expires_in is undefined');
        return;
    }

    const isProd = ENV.NODE_ENV === "production";
    
    res.cookie("access_token", access_token, {
        httpOnly: true,
        secure: isProd,
        sameSite: (isProd ? "none" : "lax"),
        maxAge: expires_in * 1000
    })

    res.cookie("refresh_token", refresh_token, {
        httpOnly: true,
        secure: isProd,
        sameSite: (isProd ? "none" : "lax"),
        maxAge: 7 * 24 * 60 * 60 * 1000,
    })

}
