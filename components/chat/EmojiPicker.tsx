"use client";

import { useState } from "react";
import EmojiPickerLib, { Theme } from "emoji-picker-react";
import { Smile } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { buttonVariants } from "@/components/ui/button";
import { useTheme } from "next-themes";

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  disabled?: boolean;
}

export function EmojiPicker({ onEmojiSelect, disabled }: EmojiPickerProps) {
  const { resolvedTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const handleEmojiSelect = (emojiData: any) => {
    onEmojiSelect(emojiData.emoji);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger 
        type="button"
        className={buttonVariants({ variant: "ghost", size: "icon", className: "text-muted-foreground hover:text-foreground shrink-0 rounded-full" })} 
        disabled={disabled}
      >
        <Smile className="h-5 w-5" />
      </PopoverTrigger>
      <PopoverContent 
        side="top" 
        align="start" 
        className="w-auto p-0 border-none shadow-2xl z-[100]"
      >
        <EmojiPickerLib 
          onEmojiClick={handleEmojiSelect}
          theme={resolvedTheme === 'dark' ? Theme.DARK : Theme.LIGHT}
          autoFocusSearch={true}
          lazyLoadEmojis={true}
        />
      </PopoverContent>
    </Popover>
  );
}
