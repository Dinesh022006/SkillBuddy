import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const requestSchema = z.object({
  receiverId: z.string().uuid()
});

export async function POST(req: Request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) return new NextResponse("Unauthorized", { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { clerkId: clerkUser.id } });
    if (!dbUser) return new NextResponse("User not found", { status: 404 });

    const body = await req.json();
    const { receiverId } = requestSchema.parse(body);

    if (dbUser.id === receiverId) {
      return new NextResponse("Cannot connect with yourself", { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const connection = await tx.connection.upsert({
        where: {
          requesterId_receiverId: {
            requesterId: dbUser.id,
            receiverId
          }
        },
        update: {
          status: "PENDING"
        },
        create: {
          requesterId: dbUser.id,
          receiverId,
          status: "PENDING"
        }
      });

      let notification = await tx.notification.findFirst({
        where: {
          userId: receiverId,
          senderId: dbUser.id,
          type: "CONNECTION_REQUEST"
        }
      });

      if (!notification) {
        notification = await tx.notification.create({
          data: {
            userId: receiverId,
            senderId: dbUser.id,
            type: "CONNECTION_REQUEST",
            title: "New Connection Request",
            message: `${dbUser.name || "A user"} sent you a connection request.`,
            link: "/connections"
          }
        });
      } else {
        // If it exists but was marked read or similar, we might want to update it, 
        // but for duplicate protection we just reuse it.
        // We can update the 'createdAt' to bubble it up, or just leave it.
        // For now, reuse it as requested.
      }

      return { connection, notification };
    });

    return NextResponse.json(result.connection);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 422 });
    }
    console.error("[CONNECTION_REQUEST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
