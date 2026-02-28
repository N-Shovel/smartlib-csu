import { createClient } from "@supabase/supabase-js";
import { ENV } from "./ENV.ts";


if(!ENV.SUPABASE_URL || !ENV.SUPABASE_PUB_KEY){
    throw Error("SUPABASE environment variables is not defined");
}

export const supabase = createClient(ENV.SUPABASE_URL || "undefined", ENV.SUPABASE_PUB_KEY || "undefined");

export function supabaseForRequest(accessToken: string) {
    if(!ENV.SUPABASE_URL || !ENV.SUPABASE_PUB_KEY){
        throw Error("SUPABASE environment variables is not defined");
    }
    return createClient(ENV.SUPABASE_URL, ENV.SUPABASE_PUB_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: { persistSession: false },
  });
}

