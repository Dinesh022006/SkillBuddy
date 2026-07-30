"use client";

import { useEffect, useRef } from "react";
import { X, MapPin, Briefcase, Code, Users, BellOff, Ban, AlertTriangle, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { useChatStore } from "./store/useChatStore";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileDrawer() {
  const { 
    isProfileDrawerOpen, 
    selectedProfileUserId, 
    profileCache, 
    closeProfileDrawer,
    activeChat,
    typingUsers,
    onlineUsers
  } = useChatStore();

  const drawerRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeProfileDrawer();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [closeProfileDrawer]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        closeProfileDrawer();
      }
    };
    if (isProfileDrawerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileDrawerOpen, closeProfileDrawer]);

  if (!isProfileDrawerOpen || !selectedProfileUserId) return null;

  const profileData = profileCache[selectedProfileUserId];
  const isLoading = !profileData;

  // Resolve status text
  const isOnline = onlineUsers.includes(selectedProfileUserId);
  const isTyping = activeChat?.id ? typingUsers[activeChat.id] : false;

  let statusText = "Last seen recently";
  if (isTyping) {
    statusText = "Typing...";
  } else if (isOnline) {
    statusText = "Online";
  }

  return (
    <div 
      ref={drawerRef}
      className={cn(
        "absolute top-0 right-0 h-full w-full sm:w-[400px] bg-background border-l shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out",
        isProfileDrawerOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b shrink-0 h-[72px]">
        <Button variant="ghost" size="icon" onClick={closeProfileDrawer} className="rounded-full shrink-0">
          <X className="h-5 w-5" />
        </Button>
        <h2 className="font-semibold text-lg">Contact Info</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-0">
        {isLoading ? (
          <div className="p-6 flex flex-col items-center gap-4">
            <Skeleton className="h-32 w-32 rounded-full" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <div className="w-full space-y-3 mt-6">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            {/* Main Info */}
            <div className="flex flex-col items-center p-6 border-b">
              <div className="mb-4">
                <UserAvatar 
                  userId={selectedProfileUserId} 
                  name={profileData?.name} 
                  imageUrl={profileData?.avatarUrl} 
                  size="4xl" 
                  className="border-4 border-background"
                />
              </div>
              <h1 className="text-2xl font-bold text-center">{profileData?.name}</h1>
              {profileData?.username && (
                <p className="text-muted-foreground">@{profileData.username}</p>
              )}
              <p className={cn("text-sm font-medium mt-1", isTyping ? "text-primary" : isOnline ? "text-green-600" : "text-muted-foreground")}>
                {statusText}
              </p>
            </div>

            {/* Academic Info */}
            {(profileData?.profile?.college || profileData?.profile?.branch) && (
              <div className="p-6 border-b space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-2">Education</h3>
                {profileData.profile.college && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground shrink-0" />
                    <span>{profileData.profile.college}</span>
                  </div>
                )}
                {profileData.profile.branch && (
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-5 w-5 text-muted-foreground shrink-0" />
                    <span>{profileData.profile.branch} {profileData.profile.year && `• Year ${profileData.profile.year}`}</span>
                  </div>
                )}
              </div>
            )}

            {/* Bio */}
            {profileData?.profile?.bio && (
              <div className="p-6 border-b space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-2">About</h3>
                <p className="text-sm whitespace-pre-wrap">{profileData.profile.bio}</p>
              </div>
            )}

            {/* Skills */}
            {profileData?.profile?.skills && profileData.profile.skills.length > 0 && (
              <div className="p-6 border-b space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-2">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {profileData.profile.skills.map((s: any) => (
                    <Badge key={s.skill.id} variant="secondary" className="px-3 py-1 bg-secondary/50">
                      {s.skill.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Interests & Goals */}
            {(profileData?.profile?.interests?.length > 0 || profileData?.profile?.learningGoals?.length > 0) && (
              <div className="p-6 border-b space-y-4">
                {profileData?.profile?.learningGoals?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-2">Learning Goals</h3>
                    <div className="flex flex-wrap gap-2">
                      {profileData.profile.learningGoals.map((g: any) => (
                        <Badge key={g.skill.id} variant="outline" className="px-3 py-1 border-primary/30 text-primary">
                          <BookOpen className="h-3 w-3 mr-1.5" />
                          {g.skill.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {profileData?.profile?.interests?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-2 mt-4">Interests</h3>
                    <div className="flex flex-wrap gap-2">
                      {profileData.profile.interests.map((interest: string, i: number) => (
                        <Badge key={i} variant="outline" className="px-3 py-1">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Connection Insights */}
            {(profileData?.sharedCommunities?.length > 0 || profileData?.mutualConnectionsCount > 0) && (
              <div className="p-6 border-b space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-2">Insights</h3>
                {profileData.sharedCommunities?.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-sm text-muted-foreground">Shared Communities</span>
                    {profileData.sharedCommunities.map((name: string, i: number) => (
                      <div key={i} className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{name}</span>
                      </div>
                    ))}
                  </div>
                )}
                {profileData.mutualConnectionsCount > 0 && (
                  <div className="flex items-center gap-2 mt-3 text-sm">
                    <Users className="h-4 w-4 text-primary" />
                    <span>{profileData.mutualConnectionsCount} mutual connection(s)</span>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="p-6 flex flex-col gap-3">
              <Link href={`/profile/${selectedProfileUserId}`} passHref className="w-full">
                <Button variant="default" className="w-full justify-center">View Full Profile</Button>
              </Link>
              <Button variant="outline" className="w-full justify-start text-muted-foreground">
                <BellOff className="h-4 w-4 mr-2" /> Mute Notifications
              </Button>
              <Button variant="ghost" className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive">
                <Ban className="h-4 w-4 mr-2" /> Block User
              </Button>
              <Button variant="ghost" className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive">
                <AlertTriangle className="h-4 w-4 mr-2" /> Report User
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
