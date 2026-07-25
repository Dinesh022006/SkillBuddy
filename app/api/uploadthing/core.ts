import { createUploadthing, type FileRouter } from "uploadthing/next";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

const f = createUploadthing();

export const ourFileRouter = {
  avatarUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const user = await currentUser();
      if (!user) throw new Error("Unauthorized");
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {

      
      await prisma.user.update({
        where: { clerkId: metadata.userId },
        data: { avatarUrl: file.url, imageUrl: file.url },
      });

      return { uploadedBy: metadata.userId, fileUrl: file.url };
    }),

  resumeUploader: f({ pdf: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(async () => {
      const user = await currentUser();
      if (!user) throw new Error("Unauthorized");
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {


      const dbUser = await prisma.user.findUnique({
        where: { clerkId: metadata.userId }
      });
      
      if (dbUser) {
        await prisma.fileAsset.create({
          data: {
            userId: dbUser.id,
            fileKey: file.key,
            url: file.url,
            type: "RESUME"
          }
        });
        
        await prisma.profile.update({
          where: { userId: dbUser.id },
          data: { resumeUrl: file.url }
        });
      }

      return { uploadedBy: metadata.userId, fileUrl: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
