/**
 * TailorTrack Unit & Fraction Engine
 * Canonical measurement values are always stored as numbers in INCHES.
 * This module handles fraction parsing ("15 1/2", "15½"), decimal conversion,
 * inch-to-centimeter translations, and formatting.
 */

import type { PreferredUnit } from "@/types/database";

const VULGAR_FRACTIONS: Record<string, number> = {
  "½": 0.5,
  "¼": 0.25,
  "¾": 0.75,
  "⅛": 0.125,
  "⅜": 0.375,
  "⅝": 0.625,
  "⅞": 0.875,
  "⅓": 0.333,
  "⅔": 0.667,
};

/**
 * Parses user measurement input into canonical inches.
 * Handles inputs like: "40", "40.5", "40 1/2", "40-1/2", "40½", "40 1/4"
 */
export function parseMeasurementToInches(
  rawInput: string | number,
  inputUnit: PreferredUnit = "in"
): { success: true; inches: number } | { success: false; error: string } {
  if (typeof rawInput === "number") {
    if (isNaN(rawInput) || rawInput <= 0) {
      return { success: false, error: "Please enter a valid positive number" };
    }
    const inches = inputUnit === "cm" ? cmToInches(rawInput) : roundToQuarter(rawInput);
    return { success: true, inches };
  }

  const str = String(rawInput).trim();
  if (!str) {
    return { success: false, error: "Value cannot be empty" };
  }

  // Check if string contains unit indicators
  const cleanStr = str.replace(/["'”]|(in|inches|inch|cm|cms|centimeters)/gi, "").trim();

  // 1. Check for unicode vulgar fractions (e.g., "40½", "15¼")
  for (const [char, fractionVal] of Object.entries(VULGAR_FRACTIONS)) {
    if (cleanStr.includes(char)) {
      const parts = cleanStr.split(char);
      const wholePart = parts[0].trim();
      const whole = wholePart === "" ? 0 : parseFloat(wholePart);
      if (isNaN(whole) || whole < 0) {
        return { success: false, error: "Invalid fractional format" };
      }
      const total = whole + fractionVal;
      const inches = inputUnit === "cm" ? cmToInches(total) : roundToQuarter(total);
      return { success: true, inches };
    }
  }

  // 2. Check for slash fractions (e.g., "40 1/2", "40-1/2", "1/2")
  if (cleanStr.includes("/")) {
    // Matches "40 1/2" or "40-1/2" or just "1/2"
    const slashRegex = /^(?:(\d+(?:\.\d+)?)(?:\s+|-))?(\d+)\/(\d+)$/;
    const match = cleanStr.match(slashRegex);
    if (!match) {
      return { success: false, error: "Invalid fraction. Format like 15 1/2 or 15.5" };
    }

    const whole = match[1] ? parseFloat(match[1]) : 0;
    const numerator = parseFloat(match[2]);
    const denominator = parseFloat(match[3]);

    if (denominator === 0) {
      return { success: false, error: "Fraction denominator cannot be zero" };
    }

    const fractionVal = numerator / denominator;
    const total = whole + fractionVal;
    if (total <= 0 || isNaN(total)) {
      return { success: false, error: "Please enter a valid measurement" };
    }

    const inches = inputUnit === "cm" ? cmToInches(total) : roundToQuarter(total);
    return { success: true, inches };
  }

  // 3. Plain decimal or integer
  const num = parseFloat(cleanStr);
  if (isNaN(num) || num <= 0) {
    return { success: false, error: "Please enter a valid number (e.g. 38.5 or 38 1/2)" };
  }

  const inches = inputUnit === "cm" ? cmToInches(num) : roundToQuarter(num);
  return { success: true, inches };
}

/**
 * Rounds value to nearest 0.25 inch step.
 */
export function roundToQuarter(val: number): number {
  return Math.round(val * 4) / 4;
}

/**
 * Converts inches to centimeters (rounded to nearest 0.5 cm).
 */
export function inchesToCm(inches: number): number {
  return Math.round(inches * 2.54 * 2) / 2;
}

/**
 * Converts centimeters to inches (rounded to nearest 0.25 in).
 */
export function cmToInches(cm: number): number {
  return Math.round((cm / 2.54) * 4) / 4;
}

/**
 * Formats canonical inches into human-friendly fractional string (e.g. `40 1/2"` or `38"`).
 */
export function formatInches(inches: number): string {
  const rounded = roundToQuarter(inches);
  const whole = Math.floor(rounded);
  const remainder = rounded - whole;

  let fraction = "";
  if (Math.abs(remainder - 0.25) < 0.001) fraction = "1/4";
  else if (Math.abs(remainder - 0.5) < 0.001) fraction = "1/2";
  else if (Math.abs(remainder - 0.75) < 0.001) fraction = "3/4";

  if (!fraction) {
    return `${whole}"`;
  }

  return whole === 0 ? `${fraction}"` : `${whole} ${fraction}"`;
}

/**
 * Formats canonical inches into the user's preferred unit (`in` or `cm`).
 */
export function formatMeasurement(inches: number, unit: PreferredUnit = "in"): string {
  if (unit === "cm") {
    const cm = inchesToCm(inches);
    return `${cm} cm`;
  }
  return formatInches(inches);
}

/**
 * Formats a measurement delta between two sets (+0.5", -1", 0").
 */
export function formatDelta(deltaInches: number, unit: PreferredUnit = "in"): string {
  if (Math.abs(deltaInches) < 0.05) {
    return "No change";
  }

  const sign = deltaInches > 0 ? "+" : "-";
  const absDelta = Math.abs(deltaInches);

  if (unit === "cm") {
    const cm = inchesToCm(absDelta);
    return `${sign}${cm} cm`;
  }

  const rounded = roundToQuarter(absDelta);
  const whole = Math.floor(rounded);
  const remainder = rounded - whole;

  let fraction = "";
  if (Math.abs(remainder - 0.25) < 0.001) fraction = "1/4";
  else if (Math.abs(remainder - 0.5) < 0.001) fraction = "1/2";
  else if (Math.abs(remainder - 0.75) < 0.001) fraction = "3/4";

  const formatted = fraction ? (whole === 0 ? fraction : `${whole} ${fraction}`) : `${whole}`;

  return `${sign}${formatted}"`;
}
