
"use client";

import { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const PALETTE = [
  "#EF4444", "#F97316", "#F59E0B", "#84CC16",
  "#22C55E", "#10B981", "#14B8A6", "#06B6D4",
  "#0EA5E9", "#3B82F6", "#6366F1", "#8B5CF6",
  "#A855F7", "#D946EF", "#EC4899", "#F43F5E"
];

function stringToHash(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-xl",
  "2xl": "h-24 w-24 text-3xl",
  "3xl": "h-32 w-32 text-4xl",
  "4xl": "h-40 w-40 text-5xl",
};

export type AvatarSize = keyof typeof sizeClasses;

export interface UserAvatarProps {
  userId?: string | null;
  name?: string | null;
  imageUrl?: string | null;
  size?: AvatarSize;
  className?: string;
}

export function UserAvatar({ userId, name, imageUrl, size = "md", className }: UserAvatarProps) {
  const backgroundColor = useMemo(() => {
    const key = userId || name || "default";
    const index = stringToHash(key) % PALETTE.length;
    return PALETTE[index];
  }, [userId, name]);

  const fallbackInitial = useMemo(() => {
    const cleanName = name?.trim() || "";
    return cleanName ? cleanName.charAt(0).toUpperCase() : "U";
  }, [name]);

  return (
    <Avatar className={cn("border border-background shadow-sm shrink-0", sizeClasses[size], className)}>
      <AvatarImage src={imageUrl || ""} alt={name || "User Avatar"} className="object-cover" />
      <AvatarFallback 
        className="font-bold text-white flex items-center justify-center w-full h-full"
        style={{ backgroundColor }}
        aria-label={name || "User Avatar"}
      >
        {fallbackInitial}
      </AvatarFallback>
    </Avatar>
  );
}

