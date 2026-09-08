import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/auth/session";
import { ContentFields } from "@/components/ContentFields";
export default async function ContentPage() {
  if (!await getAdminUser()) redirect("/login");
  return <ContentFields publicOrigin={process.env.PUBLIC_SITE_ORIGIN || "http://localhost:3000"} />;
}
