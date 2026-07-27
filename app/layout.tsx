import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/toast";
import "@uploadthing/react/styles.css";
import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SkillBuddy AI | Student Collaboration Network",
  description: "Connecting the Right Students at the Right Time for the Right Opportunity.",
  keywords: ["students", "collaboration", "hackathons", "ai matching", "study groups", "networking"],
  authors: [{ name: "SkillBuddy Team" }],
  openGraph: {
    title: "SkillBuddy AI | Student Collaboration Network",
    description: "Connecting the Right Students at the Right Time for the Right Opportunity.",
    url: "https://skillbuddy.ai",
    siteName: "SkillBuddy AI",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SkillBuddy AI | Student Collaboration Network",
    description: "Connecting the Right Students at the Right Time for the Right Opportunity.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        suppressHydrationWarning
      >
        <body className="min-h-full flex flex-col">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Toaster>{children}</Toaster>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
