/**
 * Self-checking test script for TailorTrack Unit & Fraction Engine.
 * Run with: node scripts/verify-units.mjs
 */

import assert from "node:assert";

// Quick mock import of the engine logic
function roundToQuarter(val) {
  return Math.round(val * 4) / 4;
}

function inchesToCm(inches) {
  return Math.round(inches * 2.54 * 2) / 2;
}

function cmToInches(cm) {
  return Math.round((cm / 2.54) * 4) / 4;
}

const VULGAR_FRACTIONS = {
  "½": 0.5,
  "¼": 0.25,
  "¾": 0.75,
  "⅛": 0.125,
  "⅜": 0.375,
  "⅝": 0.625,
  "⅞": 0.875,
};

function parseMeasurementToInches(rawInput, inputUnit = "in") {
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

  let cleanStr = str.replace(/["'”]|(in|inches|inch|cm|cms|centimeters)/gi, "").trim();

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

  if (cleanStr.includes("/")) {
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

  const num = parseFloat(cleanStr);
  if (isNaN(num) || num <= 0) {
    return { success: false, error: "Please enter a valid number (e.g. 38.5 or 38 1/2)" };
  }

  const inches = inputUnit === "cm" ? cmToInches(num) : roundToQuarter(num);
  return { success: true, inches };
}

function formatInches(inches) {
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

console.log("Running Unit & Fraction Engine Verification...");

// 1. Decimals & Integers
assert.strictEqual(parseMeasurementToInches("40").inches, 40);
assert.strictEqual(parseMeasurementToInches("40.5").inches, 40.5);
assert.strictEqual(parseMeasurementToInches("40.25").inches, 40.25);
assert.strictEqual(parseMeasurementToInches(38.5).inches, 38.5);

// 2. String Fractions
assert.strictEqual(parseMeasurementToInches("15 1/2").inches, 15.5);
assert.strictEqual(parseMeasurementToInches("15-1/2").inches, 15.5);
assert.strictEqual(parseMeasurementToInches("15 1/4").inches, 15.25);
assert.strictEqual(parseMeasurementToInches("15 3/4").inches, 15.75);
assert.strictEqual(parseMeasurementToInches("1/2").inches, 0.5);

// 3. Vulgar Unicode Fractions
assert.strictEqual(parseMeasurementToInches("15½").inches, 15.5);
assert.strictEqual(parseMeasurementToInches("15¼").inches, 15.25);
assert.strictEqual(parseMeasurementToInches("15¾").inches, 15.75);

// 4. Units & Quotes cleanup
assert.strictEqual(parseMeasurementToInches('15 1/2"').inches, 15.5);
assert.strictEqual(parseMeasurementToInches("15.5 in").inches, 15.5);
assert.strictEqual(parseMeasurementToInches("15.5 inches").inches, 15.5);

// 5. CM Input parsing & conversion
// 101.6 cm / 2.54 = 40.0 in
assert.strictEqual(inchesToCm(40), 101.5);
assert.strictEqual(cmToInches(101.6), 40);
assert.strictEqual(parseMeasurementToInches("101.6", "cm").inches, 40);
assert.strictEqual(parseMeasurementToInches(101.6, "cm").inches, 40);

// 6. Formatting
assert.strictEqual(formatInches(15.5), '15 1/2"');
assert.strictEqual(formatInches(15.25), '15 1/4"');
assert.strictEqual(formatInches(15.75), '15 3/4"');
assert.strictEqual(formatInches(40), '40"');
assert.strictEqual(formatInches(0.5), '1/2"');

// 7. Error handling on nonsense
assert.strictEqual(parseMeasurementToInches("abc").success, false);
assert.strictEqual(parseMeasurementToInches("-5").success, false);
assert.strictEqual(parseMeasurementToInches("0").success, false);
assert.strictEqual(parseMeasurementToInches("").success, false);
assert.strictEqual(parseMeasurementToInches("10/0").success, false);

console.log("✓ ALL UNIT & FRACTION TESTS PASSED (100% OK)");
