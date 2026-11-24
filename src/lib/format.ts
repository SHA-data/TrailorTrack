/**
 * Currency and date formatting utilities for TailorTrack.
 * All calendar and milestone logic adheres to Asia/Karachi timezone.
 */

/**
 * Formats whole Pakistani Rupee integer into display format.
 * Example: 4500 -> "PKR 4,500"
 */
export function formatPKR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "PKR 0";
  }
  return `PKR ${Math.round(amount).toLocaleString("en-PK")}`;
}

/**
 * Returns today's date in Asia/Karachi formatted as YYYY-MM-DD.
 */
export function getKarachiTodayDate(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(now);
}

/**
 * Formats a date string into human-readable format in Asia/Karachi timezone.
 * Example: "2026-11-25" -> "25 Nov 2026"
 */
export function formatKarachiDate(
  dateInput: string | Date | null | undefined,
  includeTime: boolean = false
): string {
  if (!dateInput) return "—";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "—";

  const options: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Karachi",
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(includeTime
      ? {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }
      : {}),
  };

  return new Intl.DateTimeFormat("en-PK", options).format(date);
}

/**
 * Returns metadata and human-friendly relative delivery countdown based on Asia/Karachi calendar.
 */
export function getRelativeDaysMeta(deliveryDateStr: string): {
  text: string;
  isOverdue: boolean;
  isDueToday: boolean;
  daysDiff: number;
} {
  const todayStr = getKarachiTodayDate();
  const today = new Date(todayStr + "T00:00:00Z");
  const delivery = new Date(deliveryDateStr.slice(0, 10) + "T00:00:00Z");

  const diffMs = delivery.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { text: "Due today", isOverdue: false, isDueToday: true, daysDiff: 0 };
  } else if (diffDays === 1) {
    return { text: "Due tomorrow", isOverdue: false, isDueToday: false, daysDiff: 1 };
  } else if (diffDays > 1) {
    return {
      text: `Due in ${diffDays} days`,
      isOverdue: false,
      isDueToday: false,
      daysDiff: diffDays,
    };
  } else if (diffDays === -1) {
    return { text: "1 day overdue", isOverdue: true, isDueToday: false, daysDiff: -1 };
  } else {
    return {
      text: `${Math.abs(diffDays)} days overdue`,
      isOverdue: true,
      isDueToday: false,
      daysDiff: diffDays,
    };
  }
}

/**
 * Returns a human-friendly relative delivery countdown string based on Asia/Karachi calendar.
 * Examples: "Due today", "Due in 3 days", "Due tomorrow", "1 day overdue", "2 days overdue"
 */
export function formatRelativeDays(deliveryDateStr: string): string {
  return getRelativeDaysMeta(deliveryDateStr).text;
}
