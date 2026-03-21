"use client";

/**
 * Maintenance banner - shows when NEXT_PUBLIC_MAINTENANCE_MODE is set.
 * Set NEXT_PUBLIC_MAINTENANCE_MODE=true in Vercel env to enable.
 * Set NEXT_PUBLIC_MAINTENANCE_MESSAGE for a custom message.
 */

const MAINTENANCE = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";
const MESSAGE =
  process.env.NEXT_PUBLIC_MAINTENANCE_MESSAGE ||
  "We're updating EGAKU AI with new features. Service will be back shortly. Thank you for your patience!";

export function MaintenanceBanner() {
  if (!MAINTENANCE) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="max-w-md text-center space-y-4 p-8">
        <div className="text-6xl">🎨</div>
        <h1 className="text-2xl font-bold">
          EGAKU AI is updating
        </h1>
        <p className="text-muted-foreground">
          {MESSAGE}
        </p>
        <p className="text-sm text-muted-foreground">
          新機能を追加中です。しばらくお待ちください。
        </p>
      </div>
    </div>
  );
}
