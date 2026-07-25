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

    const connection = await prisma.connection.update({
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

    return NextResponse.json(connection);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 422 });
    }
    console.error("[CONNECTION_RESPOND]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
