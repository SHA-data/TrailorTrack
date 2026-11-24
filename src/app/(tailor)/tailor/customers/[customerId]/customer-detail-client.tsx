"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  User,
  Users,
  Phone,
  MapPin,
  Plus,
  ShoppingBag,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ALL_GARMENTS, GARMENTS_BY_CATEGORY } from "@/lib/measurements/templates";
import { formatMeasurement } from "@/lib/measurements/units";
import { logMeasurementViewAction } from "@/lib/access/actions";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { formatPKR, formatKarachiDate } from "@/lib/format";
import type {
  FitCategory,
  GarmentType,
  ConsentScope,
  PreferredUnit,
  OrderStatus,
} from "@/types/database";

interface ConsentedCustomerData {
  customer_id: string;
  full_name: string;
  phone: string | null;
  city: string | null;
  fit_category: FitCategory | null;
  scopes: ConsentScope[];
  expires_at: string;
}

interface FamilyMemberItem {
  id: string;
  full_name: string;
  relation: string;
  fit_category: FitCategory;
}

interface MeasurementSetSummary {
  id: string;
  family_member_id: string | null;
  garment_type: GarmentType;
  fit_preference: string | null;
  values: Record<string, number>;
  notes: string | null;
  taken_on: string;
}

interface CustomerOrderSummary {
  id: string;
  order_seq: number;
  status: OrderStatus;
  total_pkr: number;
  paid_pkr: number;
  delivery_date: string;
  created_at: string;
}

interface CustomerDetailClientProps {
  customer: ConsentedCustomerData;
  familyMembers: FamilyMemberItem[];
  measurementSets: MeasurementSetSummary[];
  preferredUnit: PreferredUnit;
  orders?: CustomerOrderSummary[];
}

export function CustomerDetailClient({
  customer,
  familyMembers,
  measurementSets,
  preferredUnit,
  orders = [],
}: CustomerDetailClientProps) {
  const [selectedPersonId, setSelectedPersonId] = useState<string>("me");
  const [currentTimestamp] = useState(() => Date.now());

  // Log measurement view on mount
  useEffect(() => {
    logMeasurementViewAction(customer.customer_id, "viewed_measurements");
  }, [customer.customer_id]);

  const handleSelectPerson = (personId: string) => {
    setSelectedPersonId(personId);
    if (personId !== "me") {
      logMeasurementViewAction(customer.customer_id, "viewed_family");
    }
  };

  const currentPerson =
    selectedPersonId === "me"
      ? {
          name: `${customer.full_name} (Client)`,
          fitCategory: customer.fit_category || "men",
        }
      : {
          name: familyMembers.find((f) => f.id === selectedPersonId)?.full_name || "Family Member",
          fitCategory: familyMembers.find((f) => f.id === selectedPersonId)?.fit_category || "men",
        };

  const personGarments = GARMENTS_BY_CATEGORY[currentPerson.fitCategory] || [];

  // Filter latest set per garment for selected person
  const personSets = measurementSets.filter((s) =>
    selectedPersonId === "me"
      ? s.family_member_id === null
      : s.family_member_id === selectedPersonId
  );

  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(customer.expires_at).getTime() - currentTimestamp) / (1000 * 60 * 60 * 24))
  );

  const hasOrdersScope = customer.scopes.includes("orders");

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5 text-xs">
          <Link href="/tailor/customers">
            <ArrowLeft className="size-3.5" />
            <span>Back to Client Directory</span>
          </Link>
        </Button>
      </div>

      {/* Customer Header Banner */}
      <Card className="border-border bg-card p-6 shadow-xs">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <h1 className="text-foreground font-serif text-2xl font-bold sm:text-3xl">
                {customer.full_name}
              </h1>
              <Badge variant="outline" className="text-xs uppercase">
                {customer.fit_category || "men"}
              </Badge>
            </div>

            <div className="text-muted-foreground flex flex-wrap items-center gap-4 pt-1 text-xs">
              {customer.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="text-accent size-3.5" />
                  <a href={`tel:${customer.phone}`} className="hover:underline">
                    {customer.phone}
                  </a>
                </span>
              )}
              {customer.city && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="text-accent size-3.5" />
                  <span>{customer.city}, Pakistan</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:items-end">
            <div className="text-muted-foreground border-border/80 bg-muted/40 flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium">
              <Clock className="text-accent size-3.5" />
              <span>
                Access active, expires in {daysLeft} {daysLeft === 1 ? "day" : "days"}
              </span>
            </div>

            {hasOrdersScope ? (
              <Button
                asChild
                size="sm"
                className="bg-primary text-primary-foreground text-xs shadow-xs"
              >
                <Link href={`/tailor/orders/new?customerId=${customer.customer_id}`}>
                  <Plus className="mr-1.5 size-3.5" />
                  Create New Order
                </Link>
              </Button>
            ) : (
              <p className="text-muted-foreground text-[11px] italic">
                Orders scope required to book new orders
              </p>
            )}
          </div>
        </div>

        {/* Granted scopes indicator */}
        <div className="border-border/60 text-muted-foreground mt-4 flex flex-wrap items-center gap-2 border-t pt-3 text-xs">
          <span>Granted Permissions:</span>
          {customer.scopes.map((s) => (
            <Badge key={s} variant="secondary" className="text-[10px] capitalize">
              {s === "measurements" ? "Measurements & Family" : s}
            </Badge>
          ))}
        </div>
      </Card>

      {/* Orders for this Client Section */}
      <Card className="border-border bg-card space-y-4 p-6 shadow-xs">
        <div className="flex items-center justify-between">
          <h2 className="text-foreground flex items-center gap-2 font-serif text-lg font-bold">
            <ShoppingBag className="text-primary size-4" />
            Orders for this Client ({orders.length})
          </h2>
          {hasOrdersScope && (
            <Button asChild variant="outline" size="sm" className="text-xs">
              <Link href={`/tailor/orders/new?customerId=${customer.customer_id}`}>
                <Plus className="mr-1 size-3" />
                New Order
              </Link>
            </Button>
          )}
        </div>

        {orders.length === 0 ? (
          <p className="text-muted-foreground py-2 text-xs italic">
            No orders created for this client yet.
          </p>
        ) : (
          <div className="divide-border/60 divide-y">
            {orders.map((ord) => (
              <div
                key={ord.id}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/tailor/orders/${ord.id}`}
                      className="text-primary flex items-center gap-1 font-mono text-xs font-semibold hover:underline"
                    >
                      <span>Order #{String(ord.order_seq).padStart(4, "0")}</span>
                      <ExternalLink className="size-3" />
                    </Link>
                    <OrderStatusBadge status={ord.status} />
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-[11px]">
                    Due {formatKarachiDate(ord.delivery_date)} • Booked{" "}
                    {formatKarachiDate(ord.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="text-right">
                    <p className="text-foreground font-mono font-semibold">
                      {formatPKR(ord.total_pkr)}
                    </p>
                    <p className="text-muted-foreground text-[10px]">
                      Paid: {formatPKR(ord.paid_pkr)}
                    </p>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                    <Link href={`/tailor/orders/${ord.id}`}>View</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Person Switcher Chips */}
      <div className="space-y-2">
        <label className="text-foreground block text-xs font-semibold">Select Profile:</label>
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => handleSelectPerson("me")}
            className={`flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              selectedPersonId === "me"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:bg-muted"
            }`}
          >
            <User className="size-3.5" />
            <span>{customer.full_name} (Client)</span>
          </button>

          {familyMembers.map((member) => (
            <button
              key={member.id}
              onClick={() => handleSelectPerson(member.id)}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                selectedPersonId === member.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              <Users className="size-3.5" />
              <span>
                {member.full_name} ({member.relation})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Garment Measurements Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-foreground font-serif text-xl font-bold">{currentPerson.name}</h2>
          <Badge variant="outline" className="text-xs uppercase">
            Unit: {preferredUnit}
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {personGarments.map((garmentKey) => {
            const garmentMeta = ALL_GARMENTS[garmentKey];
            const latestSet = personSets.find((s) => s.garment_type === garmentKey);

            return (
              <Card key={garmentKey} className="border-border bg-card space-y-3 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-foreground font-serif text-lg font-bold">
                      {garmentMeta.label}
                    </h3>
                    <p className="text-muted-foreground text-xs">{garmentMeta.urduName}</p>
                  </div>
                  {latestSet && (
                    <Badge variant="outline" className="text-[10px]">
                      {latestSet.taken_on}
                    </Badge>
                  )}
                </div>

                {latestSet ? (
                  <div className="space-y-3 pt-1">
                    {/* Measurement Values Table */}
                    <div className="bg-muted/30 grid grid-cols-2 gap-2 rounded-lg border p-2.5 text-xs sm:grid-cols-3">
                      {Object.entries(latestSet.values).map(([k, val]) => (
                        <div key={k} className="p-1">
                          <span className="text-muted-foreground block text-[10px] capitalize">
                            {k.replace(/_/g, " ")}
                          </span>
                          <span className="text-foreground font-mono text-sm font-bold">
                            {formatMeasurement(val, preferredUnit)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {latestSet.fit_preference && (
                      <div className="text-muted-foreground text-xs">
                        Fit preference:{" "}
                        <strong className="text-foreground capitalize">
                          {latestSet.fit_preference}
                        </strong>
                      </div>
                    )}

                    {latestSet.notes && (
                      <div className="bg-card text-muted-foreground rounded border p-2 text-xs italic">
                        &quot;{latestSet.notes}&quot;
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground border-t border-dashed py-4 text-center text-xs">
                    No measurements recorded yet for {garmentMeta.label}.
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
