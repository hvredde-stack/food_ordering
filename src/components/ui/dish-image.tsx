// One component for every dish thumbnail across the app.
// Render order:
//   1. uploaded image_url, if any
//   2. emoji-on-cream square keyed by dish name (Pizza, Coffee, Tap Water…)
//   3. neutral utensils glyph as the last-resort placeholder

import { Utensils } from "lucide-react";
import { cn } from "@/lib/utils";
import { defaultEmojiFor } from "@/lib/dish-image";

interface Props {
  name: string;
  imageUrl?: string | null;
  /** Pixel size of the rendered square. Default 96. */
  size?: number;
  className?: string;
  /** Use rounded-md (default) or rounded-lg. */
  rounded?: "md" | "lg";
}

export function DishImage({
  name,
  imageUrl,
  size = 96,
  className,
  rounded = "md",
}: Props) {
  const radius = rounded === "lg" ? "rounded-lg" : "rounded-md";
  const wrapper = cn(
    "shrink-0 overflow-hidden",
    radius,
    className
  );
  const style = { width: size, height: size };

  if (imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={imageUrl}
        alt={name}
        className={cn(wrapper, "object-cover bg-bg-alt")}
        style={style}
      />
    );
  }

  const emoji = defaultEmojiFor(name);
  return (
    <div
      className={cn(
        wrapper,
        "bg-bg-alt border border-border flex items-center justify-center"
      )}
      style={style}
      aria-label={name}
    >
      {emoji ? (
        // Emoji scale tracks the square size — about 50% of width.
        <span style={{ fontSize: Math.round(size * 0.5), lineHeight: 1 }}>
          {emoji}
        </span>
      ) : (
        <Utensils
          className="text-muted opacity-60"
          style={{ width: Math.round(size * 0.32), height: Math.round(size * 0.32) }}
        />
      )}
    </div>
  );
}
