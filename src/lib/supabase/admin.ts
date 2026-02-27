import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import path from "path";

export function createSupabaseAdminClient() {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  let key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  // Si faltan vars (p. ej. cuando el proceso arranca con cwd = versehost), cargar .env.local con override para que no queden vacías
  if (!url || !key) {
    const cwd = process.cwd();
    const paths = [
      path.join(cwd, ".env.local"),
      path.join(cwd, "verse-inbox", ".env.local"),
      path.resolve(cwd, "..", "verse-inbox", ".env.local"),
    ];
    for (const envPath of paths) {
      config({ path: envPath, override: true });
      url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
      key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
      if (url && key) break;
    }
  }

  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Run the app from verse-inbox folder or set env.");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
