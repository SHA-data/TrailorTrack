import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock, ShieldCheck } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { content } from "@/lib/content";

export const metadata: Metadata = {
  title: "Log In — TailorTrack",
  description: "Log in to your TailorTrack digital passport.",
};

export default function LoginPage() {
  const { login } = content.authPlaceholders;

  return (
    <Card className="border-border bg-card shadow-lg">
      <CardHeader className="space-y-2 pb-4 text-center">
        <div className="flex justify-center">
          <Badge variant="outline" className="border-accent text-accent">
            {login.badge}
          </Badge>
        </div>
        <CardTitle className="text-primary font-serif text-2xl font-bold sm:text-3xl">
          {login.title}
        </CardTitle>
        <CardDescription className="text-muted-foreground font-sans text-sm">
          {login.subtitle}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="bg-background border-border/80 space-y-2.5 rounded-2xl border p-4 text-center">
          <Clock className="text-accent mx-auto size-8" />
          <h3 className="text-foreground font-serif text-lg font-bold">Launching in Phase 2</h3>
          <p className="text-muted-foreground font-sans text-xs leading-relaxed sm:text-sm">
            {login.notice}
          </p>
        </div>

        <div className="bg-primary/5 border-primary/20 text-primary flex items-center gap-2 rounded-xl border p-3 font-sans text-xs">
          <ShieldCheck className="text-accent size-4 shrink-0" />
          <span>Full passwordless security & instant customer data ownership</span>
        </div>
      </CardContent>

      <CardFooter className="border-border/40 flex flex-col gap-3 border-t pt-2">
        <Link href="/" className="w-full">
          <Button
            variant="outline"
            className="border-border text-foreground hover:bg-muted w-full gap-2"
          >
            <ArrowLeft className="size-4" />
            <span>{login.backHome}</span>
          </Button>
        </Link>
        <div className="text-muted-foreground text-center font-sans text-xs">
          <span>{login.signupPrompt} </span>
          <Link href="/signup" className="text-primary font-semibold hover:underline">
            {login.signupLink}
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
