import { Sidebar, MobileNav } from './Sidebar'
import { UserButton } from '@clerk/nextjs'
import { Compass } from 'lucide-react'
import Link from 'next/link'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar (hidden on mobile) */}
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Top Nav (hidden on md and larger) */}
        <header className="flex h-14 items-center justify-between border-b bg-background px-4 md:hidden shrink-0">
          <div className="flex items-center gap-3">
            <MobileNav />
            <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-primary">
              <Compass className="h-5 w-5" />
              <span>SkillBuddy AI</span>
            </Link>
          </div>
          <UserButton />
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-muted/20">
          <div className="w-full p-4 md:p-6 lg:p-8 min-w-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
