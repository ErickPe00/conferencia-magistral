
const SUPABASE_URL = "https://ebtdtbkycnekhqdcwbqs.supabase.co";

const SUPABASE_KEY = "sb_publishable_wEJw-NNHE93owOPw1R8IiA_dtfrhss8";

const db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

console.log("Cliente de Supabase configurado.");
