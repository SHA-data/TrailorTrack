"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
}

export function Reveal({
  children,
  className,
  delayMs = 0,
  direction = "up",
}: RevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    const currentElem = elementRef.current;
    if (currentElem) {
      observer.observe(currentElem);
    }

    return () => {
      if (currentElem) observer.unobserve(currentElem);
    };
  }, []);

  const getDirectionClasses = () => {
    switch (direction) {
      case "up":
        return isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6";
      case "down":
        return isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-6";
      case "left":
        return isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-6";
      case "right":
        return isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-6";
      case "none":
        return isVisible ? "opacity-100" : "opacity-0";
    }
  };

  return (
    <div
      ref={elementRef}
      style={{
        transitionDuration: "600ms",
        transitionDelay: `${delayMs}ms`,
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      className={cn(
        "transition-all ease-out motion-reduce:transition-none motion-reduce:transform-none motion-reduce:opacity-100",
        getDirectionClasses(),
        className
      )}
    >
      {children}
    </div>
  );
}
