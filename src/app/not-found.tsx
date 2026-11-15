import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogoMark } from "@/components/marketing/logo";
import { content } from "@/lib/content";

export default function NotFound() {
  const { notFound } = content;

  return (
    <div className="from-background via-cream-50/60 to-background text-foreground flex min-h-screen flex-col items-center justify-center space-y-6 bg-gradient-to-b p-4 text-center sm:p-8">
      <LogoMark className="size-16" />

      <div className="mx-auto max-w-md space-y-3">
        <Badge variant="outline" className="border-accent text-accent">
          {notFound.badge}
        </Badge>
        <h1 className="text-primary font-serif text-4xl font-bold tracking-tight sm:text-5xl">
          {notFound.title}
        </h1>
        <p className="text-muted-foreground font-sans text-sm leading-relaxed sm:text-base">
          {notFound.description}
        </p>
      </div>

      <div className="pt-2">
        <Link href="/">
          <Button
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 shadow-md"
          >
            <ArrowLeft className="size-4" />
            <span>{notFound.button}</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
