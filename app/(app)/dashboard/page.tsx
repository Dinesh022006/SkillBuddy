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

// Force Tailwind to generate these classes (workaround for @source caching)
// hidden md:flex h-full w-64 border-r md:hidden flex-1 flex-col overflow-y-auto scrollbar-thin
