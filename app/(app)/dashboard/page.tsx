import { Metadata } from "next";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard - SkillBuddy AI",
};

export default async function DashboardPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");

  const name = clerkUser.firstName || clerkUser.username || "User";

  return (
    <div className="w-full">
      <DashboardClient userName={name} />
    </div>
  );
}
