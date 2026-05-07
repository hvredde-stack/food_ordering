"use client";

import { useState } from "react";
import { Smile, Frown } from "lucide-react";
import { cn } from "@/lib/utils";

export function SentimentButtons() {
  const [pending, setPending] = useState<"happy" | "sad" | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  async function send(kind: "happy" | "sad") {
    setPending(kind);
    try {
      const res = await fetch("/api/sentiment", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind }),
      });
      if (!res.ok) {
        setFlash("Couldn't send — please try again.");
      } else {
        setFlash(kind === "happy" ? "Thanks! Glad you're enjoying it." : "Sorry — we'll let staff know.");
      }
    } catch {
      setFlash("Network error.");
    } finally {
      setPending(null);
      setTimeout(() => setFlash(null), 2400);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {flash && (
        <div className="rounded-lg bg-fg text-bg px-3 py-1.5 text-xs shadow-md">{flash}</div>
      )}
      <div className="flex gap-2 bg-card border border-border rounded-full shadow-md p-1.5">
        <button
          onClick={() => send("happy")}
          disabled={pending !== null}
          aria-label="Happy"
          className={cn(
            "h-11 w-11 rounded-full flex items-center justify-center transition",
            "hover:bg-green-100 active:scale-95",
            pending === "happy" && "bg-green-200"
          )}
        >
          <Smile className="text-green-600" />
        </button>
        <button
          onClick={() => send("sad")}
          disabled={pending !== null}
          aria-label="Not happy"
          className={cn(
            "h-11 w-11 rounded-full flex items-center justify-center transition",
            "hover:bg-red-100 active:scale-95",
            pending === "sad" && "bg-red-200"
          )}
        >
          <Frown className="text-red-600" />
        </button>
      </div>
    </div>
  );
}
