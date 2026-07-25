import { ProfileClient } from "./ProfileClient";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    redirect("/sign-in");
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
    include: {
      profile: true
    }
  });

  if (!user) {
    // Edge case if user hasn't been synced yet
    return <div>Loading profile...</div>;
  }

  return <ProfileClient initialData={user} />;
}
