import { ENV } from "./ENV.js"

export const setCookies = (res, access_token, refresh_token, expires_in) =>{
   
    if(!expires_in){
        console.log('expires_in is undefined');
        return;
    }

    res.cookie("access_token", access_token, {
        httpOnly: true,
        secure: ENV.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: expires_in * 1000
    })

    res.cookie("refresh_token", refresh_token, {
        httpOnly: true,
        secure: ENV.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    })

}
