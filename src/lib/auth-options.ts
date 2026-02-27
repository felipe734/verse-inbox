import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim();
        if (!email) {
          console.log("[NextAuth authorize] no email");
          return null;
        }

        // Solo para desarrollo local: bypass de login.
        if (process.env.SKIP_LOGIN === "true" && process.env.NODE_ENV !== "production") {
          return {
            id: "temp-bypass",
            email: email || "guest@temp.local",
            name: email || "Guest",
          };
        }

        const password = credentials?.password?.trim();
        try {
          const supabase = createSupabaseAdminClient();
          const { data: user, error } = await supabase
            .from("users")
            .select("id, email, name")
            .eq("email", email)
            .maybeSingle();
          if (error) {
            console.log("[NextAuth authorize] Supabase error:", error.message);
            return null;
          }
          if (!user) {
            console.log("[NextAuth authorize] no user for email (check seed: team@example.com)");
            return null;
          }
          const demoPassword = (process.env.NEXTAUTH_DEMO_PASSWORD ?? "").trim();
          if (!demoPassword) {
            console.log("[NextAuth authorize] NEXTAUTH_DEMO_PASSWORD not set");
            return null;
          }
          if (password !== demoPassword) {
            console.log("[NextAuth authorize] password mismatch");
            return null;
          }
          return { id: user.id, email: user.email, name: user.name };
        } catch (err) {
          console.error("[NextAuth authorize] error:", err);
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        session.user.email = (token.email as string) ?? null;
        session.user.name = (token.name as string) ?? null;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
};
