"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import {
  LayoutDashboard,
  Compass,
  Users,
  Briefcase,
  User,
  Bell,
  Settings,
  MessageSquare,
  UserCheck,
  Trophy,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const sidebarLinks = [
  { name: 'Dashboard',    href: '/dashboard',     icon: LayoutDashboard },
  { name: 'Discover',     href: '/discover',      icon: Compass },
  { name: 'Connections',  href: '/connections',   icon: UserCheck },
  { name: 'Teams',        href: '/teams',         icon: Briefcase },
  { name: 'Communities',  href: '/communities',   icon: Users },
  { name: 'Chat',         href: '/chat',          icon: MessageSquare },
  { name: 'Leaderboard',  href: '/leaderboard',   icon: Trophy },
  { name: 'Search',       href: '/search',        icon: Search },
  { name: 'Notifications',href: '/notifications', icon: Bell },
  { name: 'Profile',      href: '/profile',       icon: User },
  { name: 'Settings',     href: '/settings',      icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl text-primary">
          <Compass className="h-6 w-6" />
          <span>SkillBuddy AI</span>
        </Link>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="grid gap-1 px-2">
          {sidebarLinks.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href))

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-muted-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {link.name}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="border-t p-4 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          SkillBuddy AI &copy; {new Date().getFullYear()}
        </p>
        <UserButton />
      </div>
    </div>
  )
}
