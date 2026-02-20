import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = session.user.role;
  if (role === "REGX") redirect("/regx");
  if (role === "ADMIN") redirect("/admin");
  if (role === "MSDS_FOCAL") redirect("/focal");
  redirect("/login");
}
