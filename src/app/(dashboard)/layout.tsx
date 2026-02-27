import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session?.user?.email) {
    redirect("/login");
  }

  return <div className="flex h-screen bg-slate-100">{children}</div>;
}
