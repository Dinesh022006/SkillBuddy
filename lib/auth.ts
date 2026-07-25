import { currentUser } from '@clerk/nextjs/server';
import { prisma } from './prisma';

export async function syncUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) return null;

  const firstName = clerkUser.firstName || '';
  const lastName = clerkUser.lastName || '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ');

  const userData = {
    clerkId: clerkUser.id,
    email,
    firstName,
    lastName,
    fullName,
    name: fullName,
    avatarUrl: clerkUser.imageUrl,
    imageUrl: clerkUser.imageUrl,
    lastSignInAt: clerkUser.lastSignInAt ? new Date(clerkUser.lastSignInAt) : new Date(),
  };

  const user = await prisma.user.upsert({
    where: { clerkId: clerkUser.id },
    update: userData,
    create: {
      ...userData,
      profile: {
        create: {} // Create an empty profile by default
      }
    },
    include: {
      profile: true
    }
  });

  return user;
}
