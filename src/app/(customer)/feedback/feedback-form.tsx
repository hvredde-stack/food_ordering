"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Card, CardBody, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function FeedbackForm() {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rating, comment: comment || undefined }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr(j.error ?? "Could not submit feedback");
        return;
      }
      setDone(true);
    } catch {
      setErr("Network error");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center">
        <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted">Submitted</div>
        <h1 className="mt-6 font-display text-5xl tracking-tight">
          Thank you<span className="italic font-light">.</span>
        </h1>
        <p className="text-muted mt-4 leading-relaxed">Have a great day.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-6 py-12">
      <div className="text-center">
        <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted">Feedback</div>
        <h1 className="font-display text-4xl md:text-5xl tracking-tight mt-4">How was your visit?</h1>
        <p className="text-muted mt-3 leading-relaxed">Tell us how we did.</p>
      </div>

      <Card className="mt-6">
        <CardBody className="space-y-4">
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => {
              const filled = (hover ?? rating) >= n;
              return (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(null)}
                  aria-label={`${n} star${n === 1 ? "" : "s"}`}
                >
                  <Star
                    className={cn(
                      "w-9 h-9 transition",
                      filled ? "fill-amber-400 text-amber-400" : "text-zinc-300"
                    )}
                  />
                </button>
              );
            })}
          </div>
          <Textarea
            placeholder="Tell us more (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={5}
          />
          {err && <div className="text-sm text-red-600">{err}</div>}
        </CardBody>
        <CardFooter>
          <Button size="lg" className="w-full" onClick={submit} disabled={busy}>
            {busy ? "Sending…" : "Submit feedback"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
