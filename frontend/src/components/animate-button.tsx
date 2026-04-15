"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AnimateModal } from "@/components/animate-modal";
import { FilmIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnimateButtonProps {
  imageUrl: string;
  onSuccess?: (videoUrl: string, galleryId?: string) => void;
  /** Visual variant — default uses subtle ghost like the other gallery actions */
  variant?: "ghost" | "outline" | "default";
  size?: "xs" | "sm" | "default";
  className?: string;
  label?: string;
  showIcon?: boolean;
}

export function AnimateButton({
  imageUrl,
  onSuccess,
  variant = "ghost",
  size = "sm",
  className,
  label = "Animate",
  showIcon = true,
}: AnimateButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={cn("text-xs h-6 text-purple-500", className)}
        onClick={() => setOpen(true)}
      >
        {showIcon && <FilmIcon className="size-3" />}
        {label}
      </Button>
      <AnimateModal
        imageUrl={imageUrl}
        isOpen={open}
        onClose={() => setOpen(false)}
        onSuccess={onSuccess}
      />
    </>
  );
}
