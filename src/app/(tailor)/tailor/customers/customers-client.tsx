"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Clock,
  ArrowRight,
  AlertTriangle,
  QrCode,
  Phone,
  MapPin,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import type { FitCategory, ConsentScope } from "@/types/database";

export interface ConsentedCustomerItem {
  customer_id: string;
  full_name: string;
  phone: string | null;
  city: string | null;
  fit_category: FitCategory | null;
  scopes: ConsentScope[];
  expires_at: string;
}

export interface PendingTailorRequestItem {
  consent_id: string;
  created_at: string;
  requested_scopes: ConsentScope[];
}

interface CustomersClientProps {
  activeCustomers: ConsentedCustomerItem[];
  pendingCount: number;
}

export function CustomersClient({ activeCustomers, pendingCount }: CustomersClientProps) {
  const [activeTab, setActiveTab] = useState<"active" | "pending">("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTimestamp] = useState(() => Date.now());

  const filtered = activeCustomers.filter((c) => {
    const q = searchQuery.toLowerCase();
    return c.full_name.toLowerCase().includes(q) || (c.city && c.city.toLowerCase().includes(q));
  });

  const getDaysRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - currentTimestamp;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="border-accent/40 bg-card text-accent mb-1 inline-flex items-center gap-2 rounded-full border px-3 py-1 font-sans text-xs font-semibold">
            <Sparkles className="size-3.5" />
            <span>Client Registry</span>
          </div>
          <h1 className="text-primary font-serif text-3xl font-bold tracking-tight">
            Customer Directory
          </h1>
          <p className="text-muted-foreground mt-0.5 font-sans text-xs sm:text-sm">
            Active bespoke client profiles authorized for measurements and order processing.
          </p>
        </div>

        <Button
          asChild
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/90 w-fit gap-1.5"
        >
          <Link href="/tailor/scan">
            <QrCode className="size-4" />
            <span>Scan New Customer</span>
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-border/80 flex gap-3 border-b">
        <button
          onClick={() => setActiveTab("active")}
          className={`flex items-center gap-1.5 border-b-2 px-3 pb-2.5 font-sans text-sm font-medium transition-colors ${
            activeTab === "active"
              ? "border-primary text-primary font-bold"
              : "text-muted-foreground hover:text-foreground border-transparent"
          }`}
        >
          <span>Active Clients</span>
          <Badge variant="outline" className="text-[10px]">
            {activeCustomers.length}
          </Badge>
        </button>

        <button
          onClick={() => setActiveTab("pending")}
          className={`flex items-center gap-1.5 border-b-2 px-3 pb-2.5 font-sans text-sm font-medium transition-colors ${
            activeTab === "pending"
              ? "border-primary text-primary font-bold"
              : "text-muted-foreground hover:text-foreground border-transparent"
          }`}
        >
          <span>Pending Approvals</span>
          {pendingCount > 0 && (
            <Badge className="bg-accent text-accent-foreground h-4 px-1.5 py-0 text-[10px] font-bold">
              {pendingCount}
            </Badge>
          )}
        </button>
      </div>

      {/* TAB 1: ACTIVE CUSTOMERS */}
      {activeTab === "active" && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative max-w-sm">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by client name or city..."
              className="bg-card pl-9 text-xs"
            />
          </div>

          {filtered.length === 0 ? (
            <Card className="bg-card/50 border-dashed p-8 text-center">
              <Users className="text-muted-foreground/60 mx-auto mb-3 size-10" />
              <p className="text-foreground font-serif text-lg font-semibold">
                {activeCustomers.length === 0 ? "No Consented Customers Yet" : "No Clients Found"}
              </p>
              <p className="text-muted-foreground mx-auto mt-1 mb-4 max-w-md font-sans text-xs">
                {activeCustomers.length === 0
                  ? "Scan a customer's TailorTrack QR code to request permission to view their measurements."
                  : "No client matches your search filter."}
              </p>
              {activeCustomers.length === 0 && (
                <Button asChild size="sm" className="bg-primary text-primary-foreground">
                  <Link href="/tailor/scan">Launch QR Scanner</Link>
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {filtered.map((client) => {
                const daysLeft = getDaysRemaining(client.expires_at);
                const isExpiringSoon = daysLeft <= 3;

                return (
                  <Card
                    key={client.customer_id}
                    className="border-border bg-card space-y-3 p-5 shadow-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-foreground font-serif text-lg font-bold">
                            {client.full_name}
                          </h3>
                          {client.fit_category && (
                            <Badge variant="outline" className="text-[10px] capitalize">
                              {client.fit_category}
                            </Badge>
                          )}
                        </div>
                        <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs">
                          {client.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="text-accent size-3" />
                              <span>{client.city}</span>
                            </span>
                          )}
                          {client.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="text-accent size-3" />
                              <span>{client.phone}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {isExpiringSoon ? (
                        <Badge className="flex items-center gap-1 border-amber-300 bg-amber-500/15 text-[10px] text-amber-700">
                          <AlertTriangle className="size-3" />
                          <span>{daysLeft === 0 ? "Expires today" : `${daysLeft}d left`}</span>
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground text-[10px]">
                          {daysLeft} days left
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {client.scopes.map((s) => (
                        <Badge key={s} variant="secondary" className="text-[10px] capitalize">
                          {s === "measurements" ? "Measurements & Family" : s}
                        </Badge>
                      ))}
                    </div>

                    <div className="border-border/60 flex justify-end border-t pt-3">
                      <Button
                        asChild
                        size="sm"
                        className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 text-xs"
                      >
                        <Link href={`/tailor/customers/${client.customer_id}`}>
                          <span>View Measurements</span>
                          <ArrowRight className="size-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PENDING APPROVALS */}
      {activeTab === "pending" && (
        <Card className="border-border bg-card p-6">
          <CardHeader className="p-0 pb-3">
            <CardTitle className="text-primary flex items-center gap-2 font-serif text-lg">
              <Clock className="text-accent size-4" />
              <span>Pending Permission Requests</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Requests you have dispatched that are currently awaiting customer approval on their
              device.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {pendingCount === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-xs">
                No requests currently pending approval.
              </p>
            ) : (
              <p className="text-muted-foreground py-2 text-xs">
                You have {pendingCount} access request{pendingCount === 1 ? "" : "s"} awaiting
                client authorization. As soon as the customer taps &quot;Approve&quot;, their
                profile will appear in your Active Clients tab.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
