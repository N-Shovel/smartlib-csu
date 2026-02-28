import { createClient } from "@supabase/supabase-js";
import { ENV } from "./ENV.js";


if(!ENV.SUPABASE_URL || !ENV.SUPABASE_PUB_KEY){
    console.log("SUPABASE environment variables is not defined");
}

export const supabase = createClient(ENV.SUPABASE_URL || "undefined", ENV.SUPABASE_PUB_KEY || "undefined");


