import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage() {
  const session = await getSession();
  if (session?.user?.email) {
    redirect("/inbox");
  }

  return (
    <main className="min-h-screen grid place-items-center bg-slate-100 px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Sign in</h1>
        <p className="mt-1 text-sm text-slate-500">Use your team credentials to access the inbox.</p>
        <LoginForm />
      </div>
    </main>
  );
}
