import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/auth/session";

export default async function EditorLayout({ children }: { children: React.ReactNode }) {
  if (!await getAdminUser()) redirect("/login");
  return children;
}
