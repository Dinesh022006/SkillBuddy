'use client';

import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  MessageSquare, UserPlus, Link as LinkIcon, 
  MapPin, GraduationCap, Briefcase, Code2, Users, FileText, Ban, Flag,
  Image as ImageIcon,
  FolderOpen,
  Globe,
  Video
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/app/(app)/chat/store/useChatStore';
import SharedMediaGallery from './SharedMediaGallery';

interface ProfileDrawerProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileDrawer({ userId, isOpen, onClose }: ProfileDrawerProps) {
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dialogContent, setDialogContent] = useState<{title: string, desc: string} | null>(null);
  const [isMediaGalleryOpen, setIsMediaGalleryOpen] = useState(false);

  const { onlineUsers, activeChat } = useChatStore();

  useEffect(() => {
    if (isOpen && userId) {
      setIsLoading(true);
      fetch(`/api/users/${userId}/profile`)
        .then(res => res.json())
        .then(data => {
          setProfileData(data);
          setIsLoading(false);
        })
        .catch(err => {
          console.error(err);
          setIsLoading(false);
        });
    } else {
      setProfileData(null);
    }
  }, [isOpen, userId]);

  const openComingSoon = (title: string, desc: string) => {
    setDialogContent({ title, desc });
  };

  const isOnline = profileData?.lastSeen 
    ? new Date().getTime() - new Date(profileData.lastSeen).getTime() < 5 * 60 * 1000 
    : false;

  const renderSkeleton = () => (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="w-24 h-24 rounded-full" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="flex gap-2 justify-center">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col h-full bg-card overflow-hidden">
          <SheetHeader className="px-6 py-4 border-b shrink-0">
            <SheetTitle>Student Profile</SheetTitle>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {isLoading || !profileData ? (
              renderSkeleton()
            ) : (
              <div className="space-y-8 animate-in fade-in duration-300 pb-20">
                
                {/* 1. Header */}
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="relative">
                    <Avatar className="w-28 h-28 border-4 border-background shadow-sm">
                      <AvatarImage src={profileData.avatarUrl || undefined} />
                      <AvatarFallback className="text-3xl">
                        {profileData.name?.substring(0, 2).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div 
                      className={cn(
                        "absolute bottom-2 right-2 w-5 h-5 rounded-full border-4 border-background",
                        isOnline ? "bg-green-500" : "bg-muted-foreground"
                      )}
                      title={isOnline ? "Online" : "Offline"}
                    />
                  </div>
                  
                  <div>
                    <h2 className="text-2xl font-bold">{profileData.name}</h2>
                    {profileData.username && (
                      <p className="text-muted-foreground font-medium">@{profileData.username}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {isOnline 
                        ? 'Online now' 
                        : profileData.lastSeen 
                          ? `Last seen ${formatDistanceToNow(new Date(profileData.lastSeen), { addSuffix: true })}`
                          : 'Offline'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-center gap-3">
                  <Button onClick={() => onClose()}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                  <Button variant="secondary" onClick={() => openComingSoon("Invite to Team", "Team invitations will be available soon.")}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite
                  </Button>
                </div>

                {/* 2. About */}
                <Card className="shadow-sm border-0 bg-muted/30">
                  <CardContent className="p-4 space-y-3">
                    <h3 className="font-semibold text-sm text-foreground/80 uppercase tracking-wider flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-primary" /> About
                    </h3>
                    {profileData.profile?.bio && (
                      <p className="text-sm leading-relaxed">{profileData.profile.bio}</p>
                    )}
                    
                    <div className="space-y-2 mt-4 text-sm">
                      {profileData.profile?.college && (
                        <div className="flex items-center gap-3 text-muted-foreground font-medium">
                          <GraduationCap className="w-4 h-4 shrink-0 text-primary" />
                          <span>{profileData.profile.college} {profileData.profile.year ? <span className="font-normal text-muted-foreground/80">({profileData.profile.year})</span> : ''}</span>
                        </div>
                      )}
                      {profileData.profile?.branch && (
                        <div className="flex items-center gap-3 text-muted-foreground font-medium">
                          <Briefcase className="w-4 h-4 shrink-0 text-primary" />
                          <span>{profileData.profile.branch}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* 3. Skills */}
                {profileData.profile?.skills && profileData.profile.skills.length > 0 && (
                  <Card className="shadow-sm border-0 bg-muted/30">
                    <CardContent className="p-4 space-y-3">
                      <h3 className="font-semibold text-sm text-foreground/80 uppercase tracking-wider flex items-center gap-2">
                        <Code2 className="w-4 h-4 text-primary" /> Skills & Expertise
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {profileData.profile.skills.map((us: any) => (
                          <Badge key={us.skill.id} variant="secondary" className="px-3 py-1 font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                            {us.skill.name}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 4. Coding Profiles */}
                <Card className="shadow-sm border-0 bg-muted/30">
                  <CardContent className="p-4 space-y-3">
                    <h3 className="font-semibold text-sm text-foreground/80 uppercase tracking-wider flex items-center gap-2">
                      <Globe className="w-4 h-4 text-primary" /> Profiles
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {profileData.profile?.githubUrl && (
                        <Button variant="outline" size="sm" className="rounded-full shadow-sm hover:border-primary/50" onClick={() => window.open(profileData.profile.githubUrl, "_blank")}>
                          <Globe className="w-4 h-4 mr-2 text-muted-foreground" /> GitHub
                        </Button>
                      )}
                    {profileData.profile?.linkedinUrl && (
                      <Button variant="outline" size="sm" className="rounded-full" onClick={() => window.open(profileData.profile.linkedinUrl, "_blank")}>
                        <Globe className="w-4 h-4 mr-2" /> LinkedIn
                      </Button>
                    )}
                    {profileData.profile?.portfolioUrl && (
                      <Button variant="outline" size="sm" className="rounded-full" onClick={() => window.open(profileData.profile.portfolioUrl, "_blank")}>
                        <LinkIcon className="w-4 h-4 mr-2" /> Portfolio
                      </Button>
                    )}
                    {profileData.profile?.leetcodeUrl && (
                      <Button variant="outline" size="sm" className="rounded-full" onClick={() => window.open(profileData.profile.leetcodeUrl, "_blank")}>
                        <Code2 className="w-4 h-4 mr-2" /> LeetCode
                      </Button>
                    )}
                    {profileData.profile?.codechefUrl && (
                      <Button variant="outline" size="sm" className="rounded-full" onClick={() => window.open(profileData.profile.codechefUrl, "_blank")}>
                        <Code2 className="w-4 h-4 mr-2" /> CodeChef
                      </Button>
                    )}
                    {!profileData.profile?.githubUrl && !profileData.profile?.linkedinUrl && !profileData.profile?.leetcodeUrl && !profileData.profile?.codechefUrl && !profileData.profile?.portfolioUrl && (
                      <span className="text-sm text-muted-foreground italic">No external profiles linked</span>
                    )}
                  </div>
                  </CardContent>
                </Card>

                {/* 5. Shared Media Preview */}
                <Card className="shadow-sm border-0 bg-muted/30">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm text-foreground/80 uppercase tracking-wider flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-primary" /> Shared Media
                      </h3>
                      {activeChat && (
                        <Button variant="link" size="sm" className="h-auto p-0 text-primary" onClick={() => setIsMediaGalleryOpen(true)}>
                          View All
                        </Button>
                      )}
                    </div>
                    {activeChat ? (
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        <div className="aspect-square bg-background rounded-md border flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors shadow-sm" onClick={() => setIsMediaGalleryOpen(true)}>
                          <ImageIcon className="w-5 h-5 text-muted-foreground/60" />
                        </div>
                        <div className="aspect-square bg-background rounded-md border flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors shadow-sm" onClick={() => setIsMediaGalleryOpen(true)}>
                          <Video className="w-5 h-5 text-muted-foreground/60" />
                        </div>
                        <div className="aspect-square bg-background rounded-md border flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors shadow-sm" onClick={() => setIsMediaGalleryOpen(true)}>
                          <FolderOpen className="w-5 h-5 text-muted-foreground/60" />
                        </div>
                        <div className="aspect-square bg-background rounded-md border flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors shadow-sm" onClick={() => setIsMediaGalleryOpen(true)}>
                          <FileText className="w-5 h-5 text-muted-foreground/60" />
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic mt-2">Media gallery requires an active chat.</p>
                    )}
                  </CardContent>
                </Card>

                {/* 6. Mutual Information */}
                {(profileData.mutualConnectionsCount > 0 || (profileData.sharedCommunities && profileData.sharedCommunities.length > 0)) && (
                  <Card className="shadow-sm border-0 bg-muted/30">
                    <CardContent className="p-4 space-y-3">
                      <h3 className="font-semibold text-sm text-foreground/80 uppercase tracking-wider flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" /> Mutual Connections
                      </h3>
                      <div className="flex flex-col gap-2 text-sm">
                        {profileData.mutualConnectionsCount > 0 && (
                          <div className="flex items-center gap-3 font-medium">
                            <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span>{profileData.mutualConnectionsCount} mutual connections</span>
                          </div>
                        )}
                        {profileData.sharedCommunities?.map((sc: string) => (
                          <div key={sc} className="flex items-center gap-3">
                            <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span>Shared community: <span className="font-medium">{sc}</span></span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 8. Danger Zone Actions */}
                <div className="pt-6 border-t space-y-2">
                  <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50" onClick={() => openComingSoon("Block User", "Blocking capabilities will be implemented soon.")}>
                    <Ban className="w-4 h-4 mr-3" />
                    Block User
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50" onClick={() => openComingSoon("Report User", "Reporting functionality will be available soon.")}>
                    <Flag className="w-4 h-4 mr-3" />
                    Report User
                  </Button>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={!!dialogContent} onOpenChange={(open) => !open && setDialogContent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogContent?.title}</DialogTitle>
            <DialogDescription>{dialogContent?.desc}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogContent(null)}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {activeChat && (
        <SharedMediaGallery 
          roomId={activeChat.id} 
          isOpen={isMediaGalleryOpen} 
          onClose={() => setIsMediaGalleryOpen(false)} 
        />
      )}
    </>
  );
}
