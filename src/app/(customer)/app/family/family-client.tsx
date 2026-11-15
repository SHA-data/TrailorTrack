"use client";

import React, { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, AlertTriangle, Users, Ruler, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  addFamilyMemberAction,
  updateFamilyMemberAction,
  deleteFamilyMemberAction,
} from "@/lib/measurements/actions";
import type { FitCategory, FamilyRelation } from "@/types/database";

export interface FamilyMemberItem {
  id: string;
  full_name: string;
  relation: FamilyRelation;
  fit_category: FitCategory;
  created_at: string;
}

interface FamilyClientProps {
  initialMembers: FamilyMemberItem[];
}

const AVATAR_COLORS = [
  "bg-emerald-700 text-cream-50",
  "bg-amber-700 text-cream-50",
  "bg-indigo-700 text-cream-50",
  "bg-rose-700 text-cream-50",
  "bg-teal-700 text-cream-50",
  "bg-cyan-700 text-cream-50",
];

export function FamilyClient({ initialMembers }: FamilyClientProps) {
  const [members] = useState<FamilyMemberItem[]>(initialMembers);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMemberItem | null>(null);
  const [deletingMember, setDeletingMember] = useState<FamilyMemberItem | null>(null);
  const [isPending, startTransition] = useTransition();

  const isAtLimit = members.length >= 10;

  const handleAddSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await addFamilyMemberAction(formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(result.message || "Family member added!");
        setIsAddOpen(false);
      }
    });
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingMember) return;
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateFamilyMemberAction(editingMember.id, formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(result.message || "Family member updated!");
        setEditingMember(null);
      }
    });
  };

  const handleDeleteConfirm = () => {
    if (!deletingMember) return;

    startTransition(async () => {
      const result = await deleteFamilyMemberAction(deletingMember.id);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(result.message || "Family member removed.");
        setDeletingMember(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-primary font-serif text-3xl font-bold tracking-tight">
            Family Tailoring Passport
          </h1>
          <p className="text-muted-foreground mt-0.5 font-sans text-xs sm:text-sm">
            Manage custom fitting profiles for spouse, children, parents, and siblings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-muted-foreground text-xs font-semibold">
            {members.length} / 10 Members
          </span>
          <Button
            onClick={() => setIsAddOpen(true)}
            disabled={isAtLimit}
            size="sm"
            className="gap-1.5 shadow-sm"
          >
            <Plus className="size-4" />
            <span>Add Family Member</span>
          </Button>
        </div>
      </div>

      {isAtLimit && (
        <div className="border-accent/40 bg-accent/10 text-accent-800 dark:text-accent-300 flex items-center gap-2 rounded-xl border p-3 text-xs font-medium">
          <AlertCircle className="size-4 shrink-0" />
          <span>You have reached the limit of 10 family members on your digital passport.</span>
        </div>
      )}

      {/* Family Members Grid */}
      {members.length === 0 ? (
        <Card className="border-border/80 bg-card/40 border-dashed p-12 text-center">
          <div className="bg-primary/10 text-primary mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
            <Users className="text-accent h-7 w-7" />
          </div>
          <h2 className="text-foreground font-serif text-xl font-bold">No Family Members Added</h2>
          <p className="text-muted-foreground mx-auto mt-1.5 max-w-sm text-xs leading-relaxed">
            Centralize your entire household&apos;s Shalwar Kameez and Kurta profiles so anyone can
            have their tailoring handled without re-measuring.
          </p>
          <div className="mt-6">
            <Button onClick={() => setIsAddOpen(true)} size="sm" className="gap-1.5">
              <Plus className="size-4" />
              <span>Add Your First Family Member</span>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member, idx) => {
            const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
            const initials = member.full_name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <Card
                key={member.id}
                className="border-border bg-card hover:border-primary/40 flex flex-col justify-between overflow-hidden shadow-xs transition-colors"
              >
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex size-11 items-center justify-center rounded-2xl font-serif text-sm font-bold shadow-xs ${avatarColor}`}
                    >
                      {initials}
                    </div>
                    <div>
                      <CardTitle className="text-foreground max-w-[160px] truncate font-serif text-lg font-bold">
                        {member.full_name}
                      </CardTitle>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <Badge variant="outline" className="px-1.5 py-0 text-[10px] capitalize">
                          {member.relation}
                        </Badge>
                        <span className="text-muted-foreground text-[10px] capitalize">
                          • {member.fit_category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-foreground size-7"
                      onClick={() => setEditingMember(member)}
                      aria-label={`Edit ${member.full_name}`}
                    >
                      <Edit2 className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive size-7"
                      onClick={() => setDeletingMember(member)}
                      aria-label={`Delete ${member.full_name}`}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="border-border/60 flex items-center justify-between border-t pt-3">
                  <span className="text-muted-foreground font-sans text-[11px]">
                    Passport Linked
                  </span>
                  <Button asChild variant="outline" size="sm" className="h-7 gap-1 text-xs">
                    <Link href={`/app/measurements?person=${member.id}`}>
                      <Ruler className="text-accent size-3" />
                      <span>View Fit</span>
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ADD MEMBER DIALOG */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="border-border bg-card max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-primary font-serif text-xl font-bold">
              Add Family Member
            </DialogTitle>
            <DialogDescription className="font-sans text-xs">
              Create a personalized tailoring passport under your household account.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="add_fullName" className="text-foreground text-xs font-semibold">
                Full Name
              </Label>
              <Input
                id="add_fullName"
                name="fullName"
                required
                maxLength={80}
                placeholder="e.g. Tariq Mahmood"
                className="bg-background"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="add_relation" className="text-foreground text-xs font-semibold">
                  Relationship
                </Label>
                <select
                  id="add_relation"
                  name="relation"
                  defaultValue="son"
                  className="border-input bg-background text-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-xs focus-visible:ring-1 focus-visible:outline-none"
                >
                  <option value="spouse">Spouse</option>
                  <option value="son">Son</option>
                  <option value="daughter">Daughter</option>
                  <option value="father">Father</option>
                  <option value="mother">Mother</option>
                  <option value="brother">Brother</option>
                  <option value="sister">Sister</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add_fitCategory" className="text-foreground text-xs font-semibold">
                  Fit Category
                </Label>
                <select
                  id="add_fitCategory"
                  name="fitCategory"
                  defaultValue="men"
                  className="border-input bg-background text-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-xs focus-visible:ring-1 focus-visible:outline-none"
                >
                  <option value="men">Men</option>
                  <option value="women">Women</option>
                  <option value="boys">Boys</option>
                  <option value="girls">Girls</option>
                </select>
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending ? "Adding..." : "Add to Passport"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT MEMBER DIALOG */}
      <Dialog
        open={Boolean(editingMember)}
        onOpenChange={(open) => !open && setEditingMember(null)}
      >
        <DialogContent className="border-border bg-card max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-primary font-serif text-xl font-bold">
              Edit Family Profile
            </DialogTitle>
            <DialogDescription className="font-sans text-xs">
              Update relationship and fit specifications.
            </DialogDescription>
          </DialogHeader>

          {editingMember && (
            <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit_fullName" className="text-foreground text-xs font-semibold">
                  Full Name
                </Label>
                <Input
                  id="edit_fullName"
                  name="fullName"
                  defaultValue={editingMember.full_name}
                  required
                  maxLength={80}
                  className="bg-background"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit_relation" className="text-foreground text-xs font-semibold">
                    Relationship
                  </Label>
                  <select
                    id="edit_relation"
                    name="relation"
                    defaultValue={editingMember.relation}
                    className="border-input bg-background text-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-xs focus-visible:ring-1 focus-visible:outline-none"
                  >
                    <option value="spouse">Spouse</option>
                    <option value="son">Son</option>
                    <option value="daughter">Daughter</option>
                    <option value="father">Father</option>
                    <option value="mother">Mother</option>
                    <option value="brother">Brother</option>
                    <option value="sister">Sister</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="edit_fitCategory"
                    className="text-foreground text-xs font-semibold"
                  >
                    Fit Category
                  </Label>
                  <select
                    id="edit_fitCategory"
                    name="fitCategory"
                    defaultValue={editingMember.fit_category}
                    className="border-input bg-background text-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-xs focus-visible:ring-1 focus-visible:outline-none"
                  >
                    <option value="men">Men</option>
                    <option value="women">Women</option>
                    <option value="boys">Boys</option>
                    <option value="girls">Girls</option>
                  </select>
                </div>
              </div>

              <DialogFooter className="pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingMember(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isPending}>
                  {isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog
        open={Boolean(deletingMember)}
        onOpenChange={(open) => !open && setDeletingMember(null)}
      >
        <DialogContent className="border-destructive/20 bg-card max-w-md p-6">
          <DialogHeader className="space-y-2">
            <div className="bg-destructive/10 text-destructive mx-auto flex size-11 items-center justify-center rounded-2xl">
              <AlertTriangle className="size-6" />
            </div>
            <DialogTitle className="text-foreground text-center font-serif text-xl font-bold">
              Remove Family Member?
            </DialogTitle>
            <DialogDescription className="text-center font-sans text-xs">
              Are you sure you want to remove{" "}
              <strong className="text-foreground">{deletingMember?.full_name}</strong>? All
              associated historical measurement sets for this member will also be deleted.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-2 pt-3 sm:justify-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeletingMember(null)}
            >
              Keep Member
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isPending}
              onClick={handleDeleteConfirm}
            >
              {isPending ? "Removing..." : "Yes, Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
