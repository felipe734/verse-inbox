import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Solo para diagnóstico en desarrollo: comprueba conexión DB y si existe el usuario demo.
 */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }
  try {
    const supabase = createSupabaseAdminClient();
    const { data: user, error } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", "team@example.com")
      .maybeSingle();
    if (error) throw error;
    return NextResponse.json({
      dbOk: true,
      userExists: !!user,
      email: user?.email ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ dbOk: false, error: message }, { status: 500 });
  }
}
