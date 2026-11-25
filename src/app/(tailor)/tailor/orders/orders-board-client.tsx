"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { OrderCard } from "@/components/orders/order-card";
import { StatusActionDialog } from "@/components/orders/status-action-dialog";
import { ORDER_STATUS_META, getNextMilestone } from "@/lib/orders/status";
import { getRelativeDaysMeta } from "@/lib/format";
import type { OrderStatus } from "@/types/database";
import { Plus, Search, ArrowRight, Archive } from "lucide-react";

interface OrderListItem {
  id: string;
  shop_id: string | null;
  customer_id: string;
  person_label: string;
  shop_name: string;
  order_seq: number;
  status: OrderStatus;
  total_pkr: number;
  paid_pkr: number;
  delivery_date: string;
  created_at: string;
  status_changed_at: string;
}

interface OrdersBoardClientProps {
  initialOrders: OrderListItem[];
}

export function TailorOrdersBoardClient({ initialOrders }: OrdersBoardClientProps) {
  const [orders, setOrders] = useState<OrderListItem[]>(initialOrders);
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "today" | "week" | "overdue">("all");
  const [activeTab, setActiveTab] = useState<"board" | "closed">("board");
  const [mobileStatus, setMobileStatus] = useState<OrderStatus>("received");
  const [closedPage, setClosedPage] = useState(1);

  // Status transition dialog state
  const [selectedOrder, setSelectedOrder] = useState<OrderListItem | null>(null);
  const [targetStatus, setTargetStatus] = useState<OrderStatus | null>(null);

  // Filter orders
  const filteredOrders = useMemo(() => {
    let result = orders;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (o) =>
          o.person_label.toLowerCase().includes(q) ||
          String(o.order_seq).includes(q) ||
          `#${String(o.order_seq).padStart(4, "0")}`.includes(q)
      );
    }

    if (filterMode !== "all") {
      result = result.filter((o) => {
        const rel = getRelativeDaysMeta(o.delivery_date);
        if (filterMode === "today") return rel.isDueToday;
        if (filterMode === "week") return rel.daysDiff >= 0 && rel.daysDiff <= 7;
        if (filterMode === "overdue") return rel.isOverdue;
        return true;
      });
    }

    return result;
  }, [orders, search, filterMode]);

  // Split into active and closed
  const activeOrders = useMemo(
    () => filteredOrders.filter((o) => o.status !== "delivered" && o.status !== "cancelled"),
    [filteredOrders]
  );

  const closedOrders = useMemo(
    () => filteredOrders.filter((o) => o.status === "delivered" || o.status === "cancelled"),
    [filteredOrders]
  );

  // Group active orders by column
  const receivedOrders = activeOrders.filter((o) => o.status === "received");
  const cuttingOrders = activeOrders.filter((o) => o.status === "cutting");
  const stitchingOrders = activeOrders.filter((o) => o.status === "stitching");
  const readyOrders = activeOrders.filter((o) => o.status === "ready");

  const columnMap: Record<OrderStatus, OrderListItem[]> = {
    received: receivedOrders,
    cutting: cuttingOrders,
    stitching: stitchingOrders,
    ready: readyOrders,
    delivered: [],
    cancelled: [],
  };

  // Pagination for closed orders
  const PAGE_SIZE = 20;
  const paginatedClosedOrders = useMemo(() => {
    const start = (closedPage - 1) * PAGE_SIZE;
    return closedOrders.slice(start, start + PAGE_SIZE);
  }, [closedOrders, closedPage]);
  const totalClosedPages = Math.ceil(closedOrders.length / PAGE_SIZE) || 1;

  const handleQuickAdvance = (order: OrderListItem, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const next = getNextMilestone(order.status);
    if (next) {
      setSelectedOrder(order);
      setTargetStatus(next);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header: Title, Actions */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-foreground font-serif text-2xl font-bold sm:text-3xl">
            Stitching Workflows
          </h1>
          <p className="text-muted-foreground text-xs">
            Manage karigar queues, milestone progressions, and delivery commitments.
          </p>
        </div>
        <Button
          asChild
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 self-start sm:self-auto"
        >
          <Link href="/tailor/orders/new">
            <Plus className="size-4" />
            <span>New Stitching Order</span>
          </Link>
        </Button>
      </div>

      {/* Control Strip: Search & Filters */}
      <div className="border-border bg-card/60 flex flex-col gap-3 rounded-xl border p-3 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative min-w-[220px] flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
          <Input
            placeholder="Search order #, client name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            variant={filterMode === "all" ? "default" : "outline"}
            size="sm"
            className="h-8 text-[11px]"
            onClick={() => setFilterMode("all")}
          >
            All Active ({activeOrders.length})
          </Button>
          <Button
            variant={filterMode === "today" ? "default" : "outline"}
            size="sm"
            className="h-8 text-[11px]"
            onClick={() => setFilterMode("today")}
          >
            Due Today
          </Button>
          <Button
            variant={filterMode === "week" ? "default" : "outline"}
            size="sm"
            className="h-8 text-[11px]"
            onClick={() => setFilterMode("week")}
          >
            Due This Week
          </Button>
          <Button
            variant={filterMode === "overdue" ? "destructive" : "outline"}
            size="sm"
            className="h-8 text-[11px]"
            onClick={() => setFilterMode("overdue")}
          >
            Overdue
          </Button>
        </div>
      </div>

      {/* View Mode Toggle: Active Board vs Closed Tab */}
      <div className="border-border flex items-center gap-2 border-b pb-2">
        <Button
          variant={activeTab === "board" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("board")}
          className="text-xs"
        >
          Active Production ({activeOrders.length})
        </Button>
        <Button
          variant={activeTab === "closed" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("closed")}
          className="text-xs"
        >
          <Archive className="mr-1.5 size-3.5" />
          Delivered & Closed ({closedOrders.length})
        </Button>
      </div>

      {/* 1. ACTIVE BOARD VIEW */}
      {activeTab === "board" && (
        <>
          {/* Mobile Status Selector (Screen < 1024px) */}
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-2 lg:hidden">
            {(["received", "cutting", "stitching", "ready"] as OrderStatus[]).map((status) => {
              const meta = ORDER_STATUS_META[status];
              const count = columnMap[status].length;
              const isSelected = mobileStatus === status;
              return (
                <button
                  key={status}
                  onClick={() => setMobileStatus(status)}
                  className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-border bg-card text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  <span>{meta.shortLabel}</span>
                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                    {count}
                  </Badge>
                </button>
              );
            })}
          </div>

          {/* Mobile Card List (< 1024px) */}
          <div className="space-y-3 lg:hidden">
            {columnMap[mobileStatus].length === 0 ? (
              <div className="border-border/60 rounded-xl border border-dashed p-8 text-center">
                <p className="text-muted-foreground text-xs">
                  No orders currently in {ORDER_STATUS_META[mobileStatus].label}.
                </p>
              </div>
            ) : (
              columnMap[mobileStatus].map((order) => (
                <div key={order.id} className="relative">
                  <OrderCard order={order} variant="tailor" />
                  {getNextMilestone(order.status) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleQuickAdvance(order, e)}
                      className="text-primary hover:text-primary mt-2 w-full gap-1 text-[11px]"
                    >
                      <span>
                        Move to {ORDER_STATUS_META[getNextMilestone(order.status)!].shortLabel}
                      </span>
                      <ArrowRight className="size-3" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Desktop 4-Column Board (>= 1024px) */}
          <div className="hidden grid-cols-4 gap-4 lg:grid">
            {(["received", "cutting", "stitching", "ready"] as OrderStatus[]).map((status) => {
              const meta = ORDER_STATUS_META[status];
              const columnOrders = columnMap[status];

              return (
                <div
                  key={status}
                  className="border-border/70 bg-card/40 flex flex-col rounded-xl border p-3"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-foreground font-serif text-sm font-semibold">
                        {meta.shortLabel}
                      </span>
                      <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                        {columnOrders.length}
                      </Badge>
                    </div>
                  </div>

                  {/* Orders Column Cards */}
                  <div className="max-h-[calc(100vh-280px)] space-y-2.5 overflow-y-auto pr-1">
                    {columnOrders.length === 0 ? (
                      <div className="border-border/60 rounded-lg border border-dashed p-6 text-center">
                        <p className="text-muted-foreground/60 text-[11px]">Empty queue</p>
                      </div>
                    ) : (
                      columnOrders.map((order) => (
                        <div key={order.id} className="space-y-1.5">
                          <OrderCard order={order} variant="tailor" />
                          {getNextMilestone(order.status) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleQuickAdvance(order, e)}
                              className="text-primary hover:bg-primary/10 h-7 w-full gap-1 text-[10px]"
                            >
                              <span>
                                Move to{" "}
                                {ORDER_STATUS_META[getNextMilestone(order.status)!].shortLabel}
                              </span>
                              <ArrowRight className="size-3" />
                            </Button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* 2. CLOSED TAB VIEW (Delivered & Cancelled) */}
      {activeTab === "closed" && (
        <div className="space-y-4">
          {closedOrders.length === 0 ? (
            <div className="border-border/60 rounded-xl border border-dashed p-12 text-center">
              <Archive className="text-muted-foreground/40 mx-auto mb-2 size-8" />
              <p className="text-muted-foreground text-xs">
                No delivered or cancelled orders found.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedClosedOrders.map((order) => (
                  <OrderCard key={order.id} order={order} variant="tailor" />
                ))}
              </div>

              {/* Pagination controls */}
              {totalClosedPages > 1 && (
                <div className="flex items-center justify-between border-t pt-4 text-xs">
                  <span className="text-muted-foreground">
                    Page {closedPage} of {totalClosedPages} ({closedOrders.length} total)
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={closedPage <= 1}
                      onClick={() => setClosedPage((p) => p - 1)}
                      className="text-xs"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={closedPage >= totalClosedPages}
                      onClick={() => setClosedPage((p) => p + 1)}
                      className="text-xs"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Status Action Dialog */}
      {selectedOrder && (
        <StatusActionDialog
          open={!!targetStatus}
          onOpenChange={(open) => {
            if (!open) {
              setTargetStatus(null);
              setSelectedOrder(null);
            }
          }}
          orderId={selectedOrder.id}
          currentStatus={selectedOrder.status}
          targetStatus={targetStatus}
          totalPkr={selectedOrder.total_pkr}
          paidPkr={selectedOrder.paid_pkr}
          onSuccess={() => {
            if (targetStatus && selectedOrder) {
              setOrders((prev) =>
                prev.map((o) => (o.id === selectedOrder.id ? { ...o, status: targetStatus } : o))
              );
            }
          }}
        />
      )}
    </div>
  );
}
