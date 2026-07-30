import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const respondSchema = z.object({
  requesterId: z.string().uuid(),
  status: z.enum(["ACCEPTED", "REJECTED", "BLOCKED"])
});

export async function PATCH(req: Request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) return new NextResponse("Unauthorized", { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { clerkId: clerkUser.id } });
    if (!dbUser) return new NextResponse("User not found", { status: 404 });

    const body = await req.json();
    const { requesterId, status } = respondSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      const connection = await tx.connection.update({
        where: {
          requesterId_receiverId: {
            requesterId,
            receiverId: dbUser.id
          }
        },
        data: {
          status
        }
      });

      // Remove the original pending connection request notification
      await tx.notification.deleteMany({
        where: {
          userId: dbUser.id,
          senderId: requesterId,
          type: "CONNECTION_REQUEST"
        }
      });

      if (status === "ACCEPTED") {
        await tx.notification.create({
          data: {
            userId: requesterId,
            senderId: dbUser.id,
            type: "CONNECTION_ACCEPTED",
            title: "Connection Request Accepted",
            message: `${dbUser.name || "A user"} accepted your connection request.`,
            link: "/connections"
          }
        });
      } else if (status === "REJECTED") {
        await tx.notification.create({
          data: {
            userId: requesterId,
            senderId: dbUser.id,
            type: "SYSTEM",
            title: "Connection Request Declined",
            message: `${dbUser.name || "A user"} declined your connection request.`,
          }
        });
      }

      return connection;
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 422 });
    }
    console.error("[CONNECTION_RESPOND]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
