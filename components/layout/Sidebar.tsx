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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/ThemeToggle'

import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { useState } from "react"

const sidebarLinks = [
  { name: 'Dashboard',    href: '/dashboard',     icon: LayoutDashboard },
  { name: 'Discover',     href: '/discover',      icon: Compass },
  { name: 'Connections',  href: '/connections',   icon: UserCheck },
  { name: 'Teams',        href: '/teams',         icon: Briefcase },
  { name: 'Communities',  href: '/communities',   icon: Users },
  { name: 'Chat',         href: '/chat',          icon: MessageSquare },
  { name: 'Leaderboard',  href: '/leaderboard',   icon: Trophy },
  { name: 'Notifications',href: '/notifications', icon: Bell },
  { name: 'Profile',      href: '/profile',       icon: User },
  { name: 'Settings',     href: '/settings',      icon: Settings },
]

function SidebarContent({ onClick, className }: { onClick?: () => void, className?: string }) {
  const pathname = usePathname()

  return (
    <div className={cn("flex flex-col bg-sidebar text-sidebar-foreground overflow-hidden", className)}>
      {/* Logo */}
      <div className="flex h-14 items-center border-b px-4 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl text-primary" onClick={onClick}>
          <Compass className="h-6 w-6" />
          <span>SkillBuddy AI</span>
        </Link>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-4 scrollbar-thin min-h-0">
        <nav className="grid gap-1 px-2">
          {sidebarLinks.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href))

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClick}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 min-h-[44px] text-sm font-medium transition-all duration-200 group',
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold shadow-sm'
                    : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                )}
              >
                <Icon className={cn(
                  "h-5 w-5 shrink-0 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )} />
                {link.name}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="border-t p-4 flex items-center justify-between shrink-0">
        <p className="text-xs text-muted-foreground">
          SkillBuddy AI &copy; {new Date().getFullYear()}
        </p>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserButton />
        </div>
      </div>
    </div>
  )
}

export function Sidebar() {
  return (
    <SidebarContent className="desktop-sidebar h-full w-64 border-r" />
  )
}

export function MobileNav() {
  const [open, setOpen] = useState(false)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" className="md:hidden" />
        }
      >
        <Menu className="h-6 w-6" />
        <span className="sr-only">Toggle Menu</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 border-r-0 flex flex-col">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <SheetDescription className="sr-only">Navigate through the app</SheetDescription>
        <SidebarContent onClick={() => setOpen(false)} className="h-full flex-1" />
      </SheetContent>
    </Sheet>
  )
}
