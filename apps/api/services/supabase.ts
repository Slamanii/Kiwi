import { createClient } from "@supabase/supabase-js"
import ws from 'ws'

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(
    supabaseUrl,
    supabaseKey,
    {
        realtime: {
            transport: ws as unknown as import("@supabase/supabase-js").WebSocketLikeConstructor
        }
    }
);