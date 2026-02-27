import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireUser() {
  const session = await getSession();
  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }
  return session.user as { id?: string; email: string; name?: string | null; image?: string | null };
}

export async function getAuthenticatedDbUser(): Promise<
  { id: string; email: string; name: string | null } | null
> {
  const session = await getSession();
  const email = session?.user?.email?.trim();
  if (!email) return null;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, email, name")
    .eq("email", email)
    .maybeSingle();

  if (error || !data) return null;
  return { id: data.id, email: data.email, name: data.name };
}
