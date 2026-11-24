"use client";

import React, { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createOrderAction } from "@/lib/orders/actions";
import { ALL_GARMENTS } from "@/lib/measurements/templates";
import { formatPKR, formatKarachiDate, getKarachiTodayDate } from "@/lib/format";
import type { GarmentType, FabricSource, ConsentScope } from "@/types/database";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Plus, Trash2, User, Users, AlertCircle } from "lucide-react";

interface ConsentedCustomerOption {
  customer_id: string;
  full_name: string;
  phone: string | null;
  city: string | null;
  scopes: ConsentScope[];
  expires_at: string;
}

interface FamilyMemberOption {
  id: string;
  customer_id: string;
  full_name: string;
  relation: string;
}

interface MeasurementSetOption {
  id: string;
  customer_id: string;
  family_member_id: string | null;
  garment_type: GarmentType;
  fit_preference: string | null;
  taken_on: string;
}

interface OrderCreatorClientProps {
  customers: ConsentedCustomerOption[];
  familyMembers: FamilyMemberOption[];
  measurementSets: MeasurementSetOption[];
}

interface ItemDraft {
  id: string;
  garment_type: GarmentType;
  quantity: number;
  fabric_source: FabricSource;
  fabric_details: string;
  fabric_metres: string;
  design_notes: string;
  measurement_set_id: string;
}

export function OrderCreatorClient({
  customers,
  familyMembers,
  measurementSets,
}: OrderCreatorClientProps) {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [isPending, startTransition] = useTransition();

  // Step 1: Customer
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    customers[0]?.customer_id || ""
  );

  // Step 2: Person (Self vs family member)
  const [selectedFamilyMemberId, setSelectedFamilyMemberId] = useState<string | null>(null);

  // Step 3: Items (1 to 6)
  const [items, setItems] = useState<ItemDraft[]>([
    {
      id: "item_1",
      garment_type: "kameez",
      quantity: 1,
      fabric_source: "customer",
      fabric_details: "",
      fabric_metres: "",
      design_notes: "",
      measurement_set_id: "",
    },
  ]);

  // Step 4: Pricing & Date
  const minDeliveryDate = getKarachiTodayDate();
  const defaultDelivery = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  }, []);

  const [deliveryDate, setDeliveryDate] = useState<string>(defaultDelivery);
  const [totalPkr, setTotalPkr] = useState<string>("3500");
  const [advancePkr, setAdvancePkr] = useState<string>("1000");

  // Selected customer details
  const currentCustomer = customers.find((c) => c.customer_id === selectedCustomerId);
  const hasMeasurementsScope = currentCustomer?.scopes?.includes("measurements") ?? false;

  // Available family members for selected customer
  const customerFamily = useMemo(
    () => familyMembers.filter((f) => f.customer_id === selectedCustomerId),
    [familyMembers, selectedCustomerId]
  );

  // Available measurement sets for selected customer and person
  const personMeasurementSets = useMemo(() => {
    return measurementSets.filter((m) => {
      if (m.customer_id !== selectedCustomerId) return false;
      if (selectedFamilyMemberId === null) return m.family_member_id === null;
      return m.family_member_id === selectedFamilyMemberId;
    });
  }, [measurementSets, selectedCustomerId, selectedFamilyMemberId]);

  // Person display label
  const personLabel = useMemo(() => {
    if (!currentCustomer) return "";
    if (!selectedFamilyMemberId) return `${currentCustomer.full_name} (Self)`;
    const fam = customerFamily.find((f) => f.id === selectedFamilyMemberId);
    return fam ? `${fam.full_name} (${fam.relation})` : currentCustomer.full_name;
  }, [currentCustomer, selectedFamilyMemberId, customerFamily]);

  // Item handlers
  const handleAddItem = () => {
    if (items.length >= 6) {
      toast.error("An order can have a maximum of 6 garments.");
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        id: `item_${Date.now()}`,
        garment_type: prev.length === 1 && prev[0].garment_type === "kameez" ? "shalwar" : "kameez",
        quantity: 1,
        fabric_source: "customer",
        fabric_details: "",
        fabric_metres: "",
        design_notes: "",
        measurement_set_id: "",
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      toast.error("An order must contain at least 1 garment.");
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateItem = (id: string, patch: Partial<ItemDraft>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  // Submit order
  const handleFinalSubmit = () => {
    const numTotal = parseInt(totalPkr, 10) || 0;
    const numAdvance = parseInt(advancePkr, 10) || 0;

    if (!selectedCustomerId) {
      toast.error("Please select a customer.");
      return;
    }
    if (numTotal < 1) {
      toast.error("Total price must be at least PKR 1.");
      return;
    }
    if (numAdvance > numTotal) {
      toast.error("Advance payment cannot exceed total price.");
      return;
    }

    startTransition(async () => {
      const payload = {
        customer_id: selectedCustomerId,
        family_member_id: selectedFamilyMemberId,
        delivery_date: deliveryDate,
        total_pkr: numTotal,
        advance_pkr: numAdvance,
        items: items.map((item) => ({
          garment_type: item.garment_type,
          quantity: item.quantity,
          fabric_source: item.fabric_source,
          fabric_details: item.fabric_details || null,
          fabric_metres: item.fabric_metres ? parseFloat(item.fabric_metres) : null,
          design_notes: item.design_notes || null,
          measurement_set_id:
            hasMeasurementsScope && item.measurement_set_id ? item.measurement_set_id : null,
        })),
      };

      const res = await createOrderAction(payload);
      if (res?.error) {
        toast.error(res.error);
      } else if (res?.orderId) {
        toast.success("Order booked successfully!");
        router.replace(`/tailor/orders/${res.orderId}`);
      }
    });
  };

  if (customers.length === 0) {
    return (
      <div className="space-y-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5 text-xs">
          <Link href="/tailor/orders">
            <ArrowLeft className="size-3.5" />
            <span>Back to Orders Board</span>
          </Link>
        </Button>
        <Card className="border-border bg-card mx-auto max-w-md p-8 text-center shadow-sm">
          <AlertCircle className="text-accent mx-auto mb-3 size-8" />
          <h2 className="text-foreground font-serif text-xl font-semibold">
            No Consented Clients Found
          </h2>
          <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
            To create an order, a customer must first grant your shop &quot;Orders&quot; permission
            by scanning their digital QR passport.
          </p>
          <Button
            asChild
            className="bg-primary text-primary-foreground hover:bg-primary/90 mt-5 text-xs"
          >
            <Link href="/tailor/scan">Open QR Scanner</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5 text-xs">
          <Link href="/tailor/orders">
            <ArrowLeft className="size-3.5" />
            <span>Back to Orders</span>
          </Link>
        </Button>
        <span className="text-muted-foreground font-mono text-xs">Step {step} of 5</span>
      </div>

      <div>
        <h1 className="text-foreground font-serif text-2xl font-bold sm:text-3xl">
          Book Stitching Order
        </h1>
        <p className="text-muted-foreground text-xs">
          Create a production order linked to client specifications and milestones.
        </p>
      </div>

      {/* Stepper Progress Bar */}
      <div className="border-border bg-card grid grid-cols-5 rounded-lg border p-1 text-center shadow-xs">
        {["Client", "Person", "Garments", "Schedule", "Review"].map((label, idx) => {
          const stepNum = idx + 1;
          const isActive = step === stepNum;
          const isDone = step > stepNum;
          return (
            <button
              key={label}
              onClick={() => stepNum < step && setStep(stepNum)}
              disabled={stepNum > step}
              className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground rounded-md font-semibold"
                  : isDone
                    ? "text-primary cursor-pointer hover:underline"
                    : "text-muted-foreground/50 cursor-not-allowed"
              }`}
            >
              {isDone && <Check className="size-3" />}
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* STEP 1: SELECT CUSTOMER */}
      {step === 1 && (
        <Card className="border-border bg-card space-y-4 p-6 shadow-xs">
          <div className="space-y-1">
            <h2 className="text-foreground font-serif text-lg font-semibold">
              1. Choose Consented Client
            </h2>
            <p className="text-muted-foreground text-xs">
              Select the client profile for this stitching order. Only clients with active
              permissions are listed.
            </p>
          </div>

          <div className="space-y-2">
            {customers.map((c) => {
              const isSelected = selectedCustomerId === c.customer_id;
              const hasMeasurements = c.scopes.includes("measurements");
              return (
                <div
                  key={c.customer_id}
                  onClick={() => setSelectedCustomerId(c.customer_id)}
                  className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 text-xs transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-primary/20 ring-2"
                      : "border-border hover:bg-muted/40"
                  }`}
                >
                  <div className="space-y-0.5">
                    <p className="text-foreground font-semibold">{c.full_name}</p>
                    <p className="text-muted-foreground text-[11px]">
                      {c.phone || "No phone"} • {c.city || "Pakistan"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasMeasurements ? (
                      <Badge
                        variant="secondary"
                        className="border-emerald-200 bg-emerald-500/10 text-[10px] text-emerald-700"
                      >
                        Measurements Access
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-amber-700">
                        Orders Only
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={() => setStep(2)}
              disabled={!selectedCustomerId}
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 text-xs"
            >
              <span>Continue to Person Selection</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 2: SELECT PERSON (Self vs Family Member) */}
      {step === 2 && (
        <Card className="border-border bg-card space-y-4 p-6 shadow-xs">
          <div className="space-y-1">
            <h2 className="text-foreground font-serif text-lg font-semibold">
              2. Who is this order for?
            </h2>
            <p className="text-muted-foreground text-xs">
              Choose whether these garments are for the client themselves or a family member.
            </p>
          </div>

          <div className="space-y-2">
            {/* Option: Client Self */}
            <div
              onClick={() => setSelectedFamilyMemberId(null)}
              className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 text-xs transition-all ${
                selectedFamilyMemberId === null
                  ? "border-primary bg-primary/5 ring-primary/20 ring-2"
                  : "border-border hover:bg-muted/40"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-full">
                  <User className="size-4" />
                </div>
                <div>
                  <p className="text-foreground font-semibold">{currentCustomer?.full_name}</p>
                  <p className="text-muted-foreground text-[11px]">Primary Client Account (Self)</p>
                </div>
              </div>
            </div>

            {/* Family Members */}
            {customerFamily.map((fam) => {
              const isSelected = selectedFamilyMemberId === fam.id;
              return (
                <div
                  key={fam.id}
                  onClick={() => setSelectedFamilyMemberId(fam.id)}
                  className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 text-xs transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-primary/20 ring-2"
                      : "border-border hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="bg-muted text-muted-foreground flex size-8 items-center justify-center rounded-full">
                      <Users className="size-4" />
                    </div>
                    <div>
                      <p className="text-foreground font-semibold">{fam.full_name}</p>
                      <p className="text-muted-foreground text-[11px] capitalize">{fam.relation}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="outline" size="sm" onClick={() => setStep(1)} className="text-xs">
              Back
            </Button>
            <Button
              onClick={() => setStep(3)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 text-xs"
            >
              <span>Continue to Garments</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 3: GARMENTS & FABRIC DETAILS */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-foreground font-serif text-lg font-semibold">
                3. Garments & Fabric
              </h2>
              <p className="text-muted-foreground text-xs">
                Add 1 to 6 garments (e.g. Kameez + Shalwar = 1 Suit).
              </p>
            </div>
            {items.length < 6 && (
              <Button onClick={handleAddItem} variant="outline" size="sm" className="gap-1 text-xs">
                <Plus className="size-3.5" />
                <span>Add Garment</span>
              </Button>
            )}
          </div>

          {items.map((item, index) => {
            const matchingSets = personMeasurementSets.filter(
              (m) => m.garment_type === item.garment_type
            );

            return (
              <Card key={item.id} className="border-border bg-card space-y-4 p-5 shadow-xs">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-primary font-serif text-sm font-bold">
                    Item #{index + 1}: {item.garment_type.toUpperCase()}
                  </span>
                  {items.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-destructive hover:bg-destructive/10 h-7 px-2 text-xs"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {/* Garment type select */}
                  <div className="space-y-1">
                    <Label className="text-xs">Garment Type:</Label>
                    <select
                      value={item.garment_type}
                      onChange={(e) =>
                        updateItem(item.id, {
                          garment_type: e.target.value as GarmentType,
                          measurement_set_id: "",
                        })
                      }
                      className="border-input bg-background flex h-8 w-full rounded-md border px-2 py-1 text-xs shadow-xs"
                    >
                      {Object.values(ALL_GARMENTS).map((g) => (
                        <option key={g.type} value={g.type}>
                          {g.label} ({g.urduName})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity */}
                  <div className="space-y-1">
                    <Label className="text-xs">Quantity:</Label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={10}
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(item.id, { quantity: parseInt(e.target.value, 10) || 1 })
                      }
                      className="h-8 text-xs"
                    />
                  </div>

                  {/* Fabric Source */}
                  <div className="space-y-1">
                    <Label className="text-xs">Fabric Provided By:</Label>
                    <select
                      value={item.fabric_source}
                      onChange={(e) =>
                        updateItem(item.id, { fabric_source: e.target.value as FabricSource })
                      }
                      className="border-input bg-background flex h-8 w-full rounded-md border px-2 py-1 text-xs shadow-xs"
                    >
                      <option value="customer">Customer Provided</option>
                      <option value="shop">Shop Provided Fabric</option>
                    </select>
                  </div>

                  {/* Fabric Metres */}
                  <div className="space-y-1">
                    <Label className="text-xs">Fabric Metres (Optional):</Label>
                    <Input
                      type="number"
                      step="0.25"
                      min={0}
                      placeholder="e.g. 4.5"
                      value={item.fabric_metres}
                      onChange={(e) => updateItem(item.id, { fabric_metres: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                {/* Fabric Details */}
                <div className="space-y-1">
                  <Label className="text-xs">Fabric Details / Color / Texture:</Label>
                  <Input
                    placeholder="e.g. White Wash n Wear, Royal Boski, Irish Cotton..."
                    value={item.fabric_details}
                    onChange={(e) => updateItem(item.id, { fabric_details: e.target.value })}
                    maxLength={200}
                    className="h-8 text-xs"
                  />
                </div>

                {/* Measurement Set Picker */}
                <div className="space-y-1.5 border-t pt-3">
                  <Label className="text-xs font-semibold">
                    Attach Measurement Passport Specification:
                  </Label>
                  {!hasMeasurementsScope ? (
                    <div className="bg-muted/40 text-muted-foreground rounded-md border p-2.5 text-[11px] leading-relaxed">
                      The customer did not grant measurements permission. Measurements will be taken
                      in person.
                    </div>
                  ) : matchingSets.length === 0 ? (
                    <div className="bg-muted/40 text-muted-foreground rounded-md border p-2.5 text-[11px] leading-relaxed">
                      No saved {item.garment_type} measurements found for {personLabel}.
                      Measurements will be taken in person.
                    </div>
                  ) : (
                    <select
                      value={item.measurement_set_id}
                      onChange={(e) => updateItem(item.id, { measurement_set_id: e.target.value })}
                      className="border-input bg-background flex h-8 w-full rounded-md border px-2 py-1 text-xs shadow-xs"
                    >
                      <option value="">Take in person (do not attach snapshot)</option>
                      {matchingSets.map((s) => (
                        <option key={s.id} value={s.id}>
                          Saved {s.garment_type} ({formatKarachiDate(s.taken_on)}) -{" "}
                          {s.fit_preference || "Regular"} Fit
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Design Notes */}
                <div className="space-y-1">
                  <Label className="text-xs">Design / Stitching Notes:</Label>
                  <Textarea
                    placeholder="e.g. 1.5 inch ban collar, round cuffs, single pocket on chest..."
                    value={item.design_notes}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      updateItem(item.id, { design_notes: e.target.value })
                    }
                    maxLength={1000}
                    rows={2}
                    className="resize-none text-xs"
                  />
                </div>
              </Card>
            );
          })}

          <div className="flex justify-between pt-2">
            <Button variant="outline" size="sm" onClick={() => setStep(2)} className="text-xs">
              Back
            </Button>
            <Button
              onClick={() => setStep(4)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 text-xs"
            >
              <span>Continue to Schedule & Price</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: SCHEDULE & PRICING */}
      {step === 4 && (
        <Card className="border-border bg-card space-y-4 p-6 shadow-xs">
          <div className="space-y-1">
            <h2 className="text-foreground font-serif text-lg font-semibold">
              4. Schedule & Pricing
            </h2>
            <p className="text-muted-foreground text-xs">
              Set the promised delivery date and payment terms.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            {/* Delivery Date */}
            <div className="space-y-1.5">
              <Label htmlFor="delivery-date" className="text-xs font-semibold">
                Promised Delivery Date:
              </Label>
              <Input
                id="delivery-date"
                type="date"
                min={minDeliveryDate}
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="text-xs"
                required
              />
            </div>

            {/* Total Price */}
            <div className="space-y-1.5">
              <Label htmlFor="total-price" className="text-xs font-semibold">
                Total Price (PKR):
              </Label>
              <div className="relative">
                <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 font-mono text-xs">
                  PKR
                </span>
                <Input
                  id="total-price"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={10000000}
                  value={totalPkr}
                  onChange={(e) => setTotalPkr(e.target.value)}
                  className="pl-12 text-sm"
                  required
                />
              </div>
            </div>

            {/* Advance Payment */}
            <div className="space-y-1.5">
              <Label htmlFor="advance-price" className="text-xs font-semibold">
                Advance Payment Received (PKR):
              </Label>
              <div className="relative">
                <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 font-mono text-xs">
                  PKR
                </span>
                <Input
                  id="advance-price"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={parseInt(totalPkr, 10) || 0}
                  value={advancePkr}
                  onChange={(e) => setAdvancePkr(e.target.value)}
                  className="pl-12 text-sm"
                  required
                />
              </div>
            </div>

            {/* Calculated Remaining Balance */}
            <div className="bg-muted/40 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Remaining Balance upon Delivery:</span>
                <span className="text-foreground font-bold">
                  {formatPKR(
                    Math.max(0, (parseInt(totalPkr, 10) || 0) - (parseInt(advancePkr, 10) || 0))
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="outline" size="sm" onClick={() => setStep(3)} className="text-xs">
              Back
            </Button>
            <Button
              onClick={() => setStep(5)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 text-xs"
            >
              <span>Review Order</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 5: REVIEW & CONFIRM */}
      {step === 5 && (
        <Card className="border-border bg-card space-y-5 p-6 shadow-xs">
          <div className="space-y-1">
            <h2 className="text-foreground font-serif text-lg font-semibold">
              5. Review & Confirm Order
            </h2>
            <p className="text-muted-foreground text-xs">
              Please verify all stitching specifications and payment details before creating this
              order.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            {/* Overview Box */}
            <div className="border-border/80 bg-muted/30 grid grid-cols-2 gap-3 rounded-lg border p-3.5 sm:grid-cols-4">
              <div>
                <span className="text-muted-foreground text-[10px] uppercase">Client</span>
                <p className="text-foreground font-semibold">{currentCustomer?.full_name}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-[10px] uppercase">Person</span>
                <p className="text-foreground font-semibold">{personLabel}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-[10px] uppercase">Delivery Date</span>
                <p className="text-foreground font-semibold">{formatKarachiDate(deliveryDate)}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-[10px] uppercase">Total / Advance</span>
                <p className="text-foreground font-semibold">
                  {formatPKR(parseInt(totalPkr, 10) || 0)} /{" "}
                  {formatPKR(parseInt(advancePkr, 10) || 0)}
                </p>
              </div>
            </div>

            {/* Items Summary */}
            <div className="space-y-2">
              <h3 className="text-foreground font-serif font-semibold">
                Garments Breakdown ({items.length})
              </h3>
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="border-border/60 bg-muted/10 space-y-1 rounded-lg border p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-primary font-bold uppercase">
                      #{idx + 1}: {item.garment_type} (Qty: {item.quantity})
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {item.fabric_source === "customer" ? "Customer Fabric" : "Shop Fabric"}
                    </Badge>
                  </div>
                  {item.fabric_details && (
                    <p className="text-muted-foreground text-[11px]">
                      Fabric: {item.fabric_details}{" "}
                      {item.fabric_metres ? `(${item.fabric_metres}m)` : ""}
                    </p>
                  )}
                  {item.measurement_set_id && (
                    <p className="text-[11px] font-medium text-emerald-700">
                      ✓ Attached measurement passport snapshot
                    </p>
                  )}
                  {item.design_notes && (
                    <p className="text-muted-foreground text-[11px] italic">
                      Notes: &quot;{item.design_notes}&quot;
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between border-t pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep(4)}
              disabled={isPending}
              className="text-xs"
            >
              Back
            </Button>
            <Button
              onClick={handleFinalSubmit}
              disabled={isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 text-xs font-semibold"
            >
              <Check className="size-4" />
              <span>{isPending ? "Booking Order..." : "Confirm & Book Order"}</span>
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
