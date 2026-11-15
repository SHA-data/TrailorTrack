import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  linkToHome?: boolean;
}

export function LogoMark({ className = "size-8" }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-primary text-accent border-accent/30 relative flex items-center justify-center overflow-hidden rounded-xl border shadow-xs",
        className
      )}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full p-1.5"
      >
        {/* Subtle measuring tape circular tick border */}
        <circle
          cx="20"
          cy="20"
          r="16.5"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeDasharray="2.5 2.5"
          opacity="0.45"
        />
        {/* Golden Tailoring Needle */}
        <path
          d="M28.5 11.5L16.2 23.8C15.8 24.2 15.2 24.2 14.8 23.8L13.2 22.2C12.8 21.8 12.8 21.2 13.2 20.8L25.5 8.5C26.1 7.9 27.1 7.9 27.7 8.5L28.5 9.3C29.1 9.9 29.1 10.9 28.5 11.5Z"
          fill="currentColor"
        />
        {/* Needle Eye */}
        <ellipse
          cx="26.8"
          cy="10.2"
          rx="0.8"
          ry="1.6"
          transform="rotate(-45 26.8 10.2)"
          fill="#1F4D3A"
        />
        {/* Flowing Golden Thread Loop */}
        <path
          d="M26.8 10.2C29.5 14 31 18 29.5 22.5C27.5 28 20 29 16 26.5C12 24 10.5 19 13.5 15C16.5 11 22 13 22 17C22 21 17 23 15 26"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.9"
        />
        {/* Center Golden Pin/Pivot */}
        <circle cx="20" cy="20" r="1.5" fill="#f7f1e3" />
      </svg>
    </div>
  );
}

export function Logo({ className, iconOnly = false, linkToHome = true }: LogoProps) {
  const content = (
    <div className={cn("group inline-flex items-center gap-2.5 select-none", className)}>
      <LogoMark className="size-8 sm:size-9" />
      {!iconOnly && (
        <div className="flex flex-col leading-none">
          <span className="text-primary group-hover:text-primary/90 font-serif text-xl font-bold tracking-tight transition-colors sm:text-2xl">
            TailorTrack
          </span>
          <span className="text-muted-foreground font-sans text-[10px] font-medium tracking-widest uppercase">
            Passport • Pakistan
          </span>
        </div>
      )}
    </div>
  );

  if (linkToHome) {
    return (
      <Link
        href="/"
        className="focus-visible:ring-ring rounded-lg p-0.5 outline-none focus-visible:ring-2"
      >
        {content}
      </Link>
    );
  }

  return content;
}
