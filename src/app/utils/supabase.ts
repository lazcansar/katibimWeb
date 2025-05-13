import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Ortam değişkenlerinin varlığını kontrol et
if (!supabaseUrl) {
    throw new Error("Supabase URL bulunamadı. Lütfen .env dosyasını veya ortam değişkenlerini kontrol edin.");
}
if (!supabaseKey) {
    throw new Error("Supabase Key bulunamadı. Lütfen .env dosyasını veya ortam değişkenlerini kontrol edin.");
}

// Bu noktadan sonra TypeScript, supabaseUrl ve supabaseKey'in kesinlikle string olduğunu bilir.
export const supabase = createClient(supabaseUrl, supabaseKey);