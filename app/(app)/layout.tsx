import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { syncUser } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await syncUser();
  return <DashboardLayout>{children}</DashboardLayout>;
}
