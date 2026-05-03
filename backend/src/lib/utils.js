import { ENV } from "./ENV.js"

const cookieBaseOptions = () => {
    const isProd = ENV.NODE_ENV === "production";
    return {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        path: "/",
    };
};

export const setCookies = (res, access_token, refresh_token, expires_in) =>{
   
    if(!expires_in){
        console.log('expires_in is undefined');
        return;
    }

    const baseOptions = cookieBaseOptions();

    res.cookie("access_token", access_token, {
        ...baseOptions,
        maxAge: expires_in * 1000
    })

    res.cookie("refresh_token", refresh_token, {
        ...baseOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    })

}

export const clearAuthCookies = (res) => {
    const baseOptions = cookieBaseOptions();
    // Prefer express' clearCookie which respects options (path, sameSite, secure)
    res.clearCookie("access_token", baseOptions);
    res.clearCookie("refresh_token", baseOptions);

    // Defensive fallback: explicitly overwrite cookies with empty values and immediate expiry
    try {
        res.cookie("access_token", "", {
            ...baseOptions,
            maxAge: 0,
            expires: new Date(0),
        });

        res.cookie("refresh_token", "", {
            ...baseOptions,
            maxAge: 0,
            expires: new Date(0),
        });
    } catch (e) {
        // non-fatal; best-effort cleanup
        // eslint-disable-next-line no-console
        console.error("Failed to set defensive expired cookies:", e);
    }
};
