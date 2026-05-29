import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const role = (session.user as any).role as string | undefined;
  if (role !== "admin") redirect("/dashboard");
  return session;
}

export function isAdminSession(session: any): boolean {
  return session?.user?.role === "admin";
}
