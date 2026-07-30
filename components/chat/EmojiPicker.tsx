"use client";

import { useState } from "react";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
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

  const handleEmojiSelect = (emoji: any) => {
    onEmojiSelect(emoji.native);
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
        <Picker 
          data={(data as any).default || data} 
          onEmojiSelect={handleEmojiSelect}
          theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
          set="native"
          autoFocus={true}
          navPosition="bottom"
          previewPosition="none"
          skinTonePosition="none"
        />
      </PopoverContent>
    </Popover>
  );
}
