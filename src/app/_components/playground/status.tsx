"use client";

import { cn } from "@/lib/utils";
import { useEffect, useMemo, useRef } from "react";

export type Props = {
  status: string;
};

export default function Status({ status }: Props) {
  const words = useMemo(
    () => ["pending...", "processing...", "completed!"],
    []
  );

  const tallestRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  if (status === "COMPLETED") {
    setTimeout(() => {
      statusRef.current?.classList.add("animate-hide-flip");
    }, 2000);
  }

  useEffect(() => {
    if (tallestRef.current) {
      let maxHeight = 0;

      words.forEach((word) => {
        const span = document.createElement("span");
        span.className = "absolute opacity-0";
        span.textContent = word;
        tallestRef.current?.appendChild(span);
        const height = span.offsetHeight;
        tallestRef.current?.removeChild(span);

        if (height > maxHeight) {
          maxHeight = height;
        }
      });

      tallestRef.current.style.height = `${maxHeight}px`;
    }
  }, [words]);

  return (
    <div className="box-content flex gap-2 font-semibold mx-auto overflow-hidden" ref={statusRef}>
      <p className="text-foreground">Status: </p>
      <div
        ref={tallestRef}
        className="flex flex-col overflow-hidden text-blue-400"
      >
        {words.map((word, index) => (
          <span key={index} className={cn(
            status === "PENDING" && "animate-flip-words-0",
            status === "PROCESSING" && "animate-flip-words-1",
            status === "COMPLETED" && "animate-flip-words-2"
          )}>
            {word}
          </span>
        ))}
      </div>
    </div>
  );
}
