/**
 * TailorTrack Measurement Templates
 * Single source of truth for Pakistani tailoring specifications,
 * localized terminology, anatomical measuring instructions, and Zod validation schemas.
 */

import { z } from "zod";
import type { FitCategory, GarmentType } from "@/types/database";

export interface MeasurementFieldDef {
  key: string;
  label: string;
  localTerm: string; // e.g., "[Lambai]", "[Teera]"
  tip: string; // How to measure
  minInches: number;
  maxInches: number;
  stepInches: number; // default 0.25
}

export interface GarmentMeta {
  type: GarmentType;
  label: string;
  urduName: string;
  description: string;
}

export const ALL_GARMENTS: Record<GarmentType, GarmentMeta> = {
  kameez: {
    type: "kameez",
    label: "Kameez / Kurta",
    urduName: "قمیض / کرتہ",
    description: "Traditional straight-cut or A-line long tunic with collar and placket options.",
  },
  shalwar: {
    type: "shalwar",
    label: "Shalwar",
    urduName: "شلوار",
    description: "Classic pleated Pakistani trousers with drawstring or elastic belt.",
  },
  trouser: {
    type: "trouser",
    label: "Pajama / Trouser",
    urduName: "ٹراؤزر / پاجامہ",
    description: "Straight-cut trouser, cigarette pants, or churidar style pants.",
  },
  waistcoat: {
    type: "waistcoat",
    label: "Waistcoat",
    urduName: "واسکٹ",
    description: "Formal sleeveless tailored vest worn over Kurta or Kameez.",
  },
  sherwani: {
    type: "sherwani",
    label: "Sherwani / Achkan",
    urduName: "شیروانی",
    description: "High-collar formal celebratory or wedding coat.",
  },
  shirt: {
    type: "shirt",
    label: "Casual / Formal Shirt",
    urduName: "قمیض شرٹ",
    description: "Western tailored button-down shirt.",
  },
  coat: {
    type: "coat",
    label: "Blazer / Prince Coat",
    urduName: "کوٹ / پرنس کوٹ",
    description: "Structured prince coat, bandhgala, or dinner jacket.",
  },
};

export const GARMENTS_BY_CATEGORY: Record<FitCategory, GarmentType[]> = {
  men: ["kameez", "shalwar", "trouser", "waistcoat", "sherwani", "shirt", "coat"],
  women: ["kameez", "shalwar", "trouser"],
  boys: ["kameez", "shalwar", "trouser", "waistcoat", "shirt"],
  girls: ["kameez", "shalwar", "trouser"],
};

// ------------------------------------------------------------------------------
// MEASUREMENT TEMPLATE DICTIONARIES
// ------------------------------------------------------------------------------

// Men Kameez / Kurta
const MEN_KAMEEZ_FIELDS: MeasurementFieldDef[] = [
  {
    key: "length",
    label: "Length",
    localTerm: "[Lambai]",
    tip: "From high shoulder point beside collar straight down to the desired hemline (usually 1-2 inches below knee).",
    minInches: 30,
    maxInches: 52,
    stepInches: 0.25,
  },
  {
    key: "shoulder",
    label: "Shoulder",
    localTerm: "[Teera]",
    tip: "From outer bone of left shoulder across back curvature to outer bone of right shoulder.",
    minInches: 14,
    maxInches: 24,
    stepInches: 0.25,
  },
  {
    key: "chest",
    label: "Chest",
    localTerm: "[Chhati]",
    tip: "Around the fullest part of chest under arms, keeping tape comfortably level.",
    minInches: 28,
    maxInches: 58,
    stepInches: 0.25,
  },
  {
    key: "waist",
    label: "Waist",
    localTerm: "[Kamar]",
    tip: "Around natural waistline (above naval level).",
    minInches: 24,
    maxInches: 56,
    stepInches: 0.25,
  },
  {
    key: "hip",
    label: "Hip / Seat",
    localTerm: "[Hip]",
    tip: "Around the fullest part of hips.",
    minInches: 30,
    maxInches: 62,
    stepInches: 0.25,
  },
  {
    key: "daman",
    label: "Hem Width",
    localTerm: "[Daman / Ghera]",
    tip: "Bottom width across front hemline from side slit to side slit.",
    minInches: 18,
    maxInches: 36,
    stepInches: 0.25,
  },
  {
    key: "sleeve",
    label: "Sleeve Length",
    localTerm: "[Astin]",
    tip: "From tip of shoulder bone down outer arm past elbow to wrist bone.",
    minInches: 18,
    maxInches: 30,
    stepInches: 0.25,
  },
  {
    key: "cuff",
    label: "Cuff / Sleeve Opening",
    localTerm: "[Kuff / Mori]",
    tip: "Circumference around wrist cuff or open sleeve hem.",
    minInches: 7,
    maxInches: 14,
    stepInches: 0.25,
  },
  {
    key: "neck",
    label: "Collar / Neck",
    localTerm: "[Gala / Bain]",
    tip: "Around base of neck where collar band rests, with room for 1 finger.",
    minInches: 12,
    maxInches: 22,
    stepInches: 0.25,
  },
  {
    key: "armhole",
    label: "Armhole",
    localTerm: "[Mudda]",
    tip: "Circumference around shoulder joint under the armpit.",
    minInches: 14,
    maxInches: 26,
    stepInches: 0.25,
  },
];

// Men Shalwar
const MEN_SHALWAR_FIELDS: MeasurementFieldDef[] = [
  {
    key: "length",
    label: "Length",
    localTerm: "[Lambai]",
    tip: "From waistline where shalwar is tied down to ankle bone.",
    minInches: 32,
    maxInches: 48,
    stepInches: 0.25,
  },
  {
    key: "waist",
    label: "Waist / Asan",
    localTerm: "[Naffa / Kamar]",
    tip: "Waist circumference or crotch depth.",
    minInches: 26,
    maxInches: 56,
    stepInches: 0.25,
  },
  {
    key: "hip",
    label: "Hip / Ghera",
    localTerm: "[Hip]",
    tip: "Shalwar volume / fullness width.",
    minInches: 32,
    maxInches: 60,
    stepInches: 0.25,
  },
  {
    key: "thigh",
    label: "Thigh",
    localTerm: "[Raan]",
    tip: "Around upper thigh 1 inch below crotch.",
    minInches: 20,
    maxInches: 38,
    stepInches: 0.25,
  },
  {
    key: "knee",
    label: "Knee",
    localTerm: "[Ghutna]",
    tip: "Circumference at knee height.",
    minInches: 14,
    maxInches: 28,
    stepInches: 0.25,
  },
  {
    key: "pancha",
    label: "Bottom Opening",
    localTerm: "[Pancha / Paicha]",
    tip: "Width of ankle opening hem (e.g. 7.5 to 9 inches).",
    minInches: 6,
    maxInches: 14,
    stepInches: 0.25,
  },
];

// Men Waistcoat
const MEN_WAISTCOAT_FIELDS: MeasurementFieldDef[] = [
  {
    key: "length",
    label: "Length",
    localTerm: "[Lambai]",
    tip: "From high shoulder point down to belt level or hip line.",
    minInches: 22,
    maxInches: 34,
    stepInches: 0.25,
  },
  {
    key: "shoulder",
    label: "Shoulder",
    localTerm: "[Teera]",
    tip: "Across back from shoulder bone to shoulder bone.",
    minInches: 13,
    maxInches: 23,
    stepInches: 0.25,
  },
  {
    key: "chest",
    label: "Chest",
    localTerm: "[Chhati]",
    tip: "Around fullest part of chest over kurta.",
    minInches: 28,
    maxInches: 56,
    stepInches: 0.25,
  },
  {
    key: "waist",
    label: "Waist",
    localTerm: "[Kamar]",
    tip: "Around waist area.",
    minInches: 26,
    maxInches: 54,
    stepInches: 0.25,
  },
  {
    key: "armhole",
    label: "Armhole",
    localTerm: "[Mudda]",
    tip: "Circumference around arm opening.",
    minInches: 14,
    maxInches: 26,
    stepInches: 0.25,
  },
];

// Men Sherwani / Coat
const MEN_SHERWANI_FIELDS: MeasurementFieldDef[] = [
  {
    key: "length",
    label: "Length",
    localTerm: "[Lambai]",
    tip: "From high shoulder down to knee or calf level.",
    minInches: 34,
    maxInches: 48,
    stepInches: 0.25,
  },
  {
    key: "shoulder",
    label: "Shoulder",
    localTerm: "[Teera]",
    tip: "From outer bone across back.",
    minInches: 15,
    maxInches: 24,
    stepInches: 0.25,
  },
  {
    key: "chest",
    label: "Chest",
    localTerm: "[Chhati]",
    tip: "Around fullest chest point.",
    minInches: 30,
    maxInches: 58,
    stepInches: 0.25,
  },
  {
    key: "waist",
    label: "Waist",
    localTerm: "[Kamar]",
    tip: "Around waist.",
    minInches: 26,
    maxInches: 56,
    stepInches: 0.25,
  },
  {
    key: "hip",
    label: "Hip",
    localTerm: "[Hip]",
    tip: "Around fullest hips.",
    minInches: 32,
    maxInches: 60,
    stepInches: 0.25,
  },
  {
    key: "sleeve",
    label: "Sleeve Length",
    localTerm: "[Astin]",
    tip: "From shoulder bone to wrist.",
    minInches: 20,
    maxInches: 30,
    stepInches: 0.25,
  },
  {
    key: "neck",
    label: "Collar / Stand",
    localTerm: "[Gala / Bain]",
    tip: "Stand collar circumference.",
    minInches: 13,
    maxInches: 22,
    stepInches: 0.25,
  },
  {
    key: "armhole",
    label: "Armhole",
    localTerm: "[Mudda]",
    tip: "Armhole circumference.",
    minInches: 16,
    maxInches: 26,
    stepInches: 0.25,
  },
];

// Women Kameez
const WOMEN_KAMEEZ_FIELDS: MeasurementFieldDef[] = [
  {
    key: "length",
    label: "Length",
    localTerm: "[Lambai]",
    tip: "From high shoulder point down to desired hemline.",
    minInches: 32,
    maxInches: 52,
    stepInches: 0.25,
  },
  {
    key: "shoulder",
    label: "Shoulder",
    localTerm: "[Teera]",
    tip: "Shoulder tip to shoulder tip across upper back.",
    minInches: 12,
    maxInches: 20,
    stepInches: 0.25,
  },
  {
    key: "bust",
    label: "Bust",
    localTerm: "[Chhati]",
    tip: "Around fullest bust point.",
    minInches: 28,
    maxInches: 56,
    stepInches: 0.25,
  },
  {
    key: "waist",
    label: "Waist",
    localTerm: "[Kamar]",
    tip: "Around natural waist curve.",
    minInches: 22,
    maxInches: 52,
    stepInches: 0.25,
  },
  {
    key: "hip",
    label: "Hip / Chaak",
    localTerm: "[Hip]",
    tip: "Around fullest hip point where side slits (chaak) open.",
    minInches: 30,
    maxInches: 60,
    stepInches: 0.25,
  },
  {
    key: "daman",
    label: "Daman / Ghera",
    localTerm: "[Daman]",
    tip: "Width of front hem.",
    minInches: 18,
    maxInches: 38,
    stepInches: 0.25,
  },
  {
    key: "sleeve",
    label: "Sleeve Length",
    localTerm: "[Astin]",
    tip: "Shoulder bone to wrist or 3/4 length.",
    minInches: 12,
    maxInches: 26,
    stepInches: 0.25,
  },
  {
    key: "sleeve_opening",
    label: "Sleeve Opening",
    localTerm: "[Mori]",
    tip: "Circumference at sleeve hem.",
    minInches: 7,
    maxInches: 16,
    stepInches: 0.25,
  },
  {
    key: "armhole",
    label: "Armhole",
    localTerm: "[Mudda]",
    tip: "Circumference around armpit.",
    minInches: 12,
    maxInches: 24,
    stepInches: 0.25,
  },
  {
    key: "front_neck",
    label: "Front Neck Depth",
    localTerm: "[Agla Gala]",
    tip: "Diagonal depth from shoulder neck point to center front.",
    minInches: 4.5,
    maxInches: 10,
    stepInches: 0.25,
  },
  {
    key: "back_neck",
    label: "Back Neck Depth",
    localTerm: "[Pichla Gala]",
    tip: "Depth from shoulder neck point down back center.",
    minInches: 2,
    maxInches: 10,
    stepInches: 0.25,
  },
];

// Adjust min/max bounds for boys/girls
function adaptFieldsForKids(fields: MeasurementFieldDef[]): MeasurementFieldDef[] {
  return fields.map((f) => ({
    ...f,
    minInches: Math.max(4, Math.round(f.minInches * 0.45 * 4) / 4),
    maxInches: Math.round(f.maxInches * 0.85 * 4) / 4,
  }));
}

/**
 * Returns the array of measurement field specifications for a given fit category and garment type.
 */
export function getMeasurementTemplate(
  fitCategory: FitCategory,
  garmentType: GarmentType
): MeasurementFieldDef[] {
  if (fitCategory === "men") {
    switch (garmentType) {
      case "kameez":
      case "shirt":
        return MEN_KAMEEZ_FIELDS;
      case "shalwar":
      case "trouser":
        return MEN_SHALWAR_FIELDS;
      case "waistcoat":
        return MEN_WAISTCOAT_FIELDS;
      case "sherwani":
      case "coat":
        return MEN_SHERWANI_FIELDS;
      default:
        return MEN_KAMEEZ_FIELDS;
    }
  }

  if (fitCategory === "women") {
    switch (garmentType) {
      case "kameez":
        return WOMEN_KAMEEZ_FIELDS;
      case "shalwar":
      case "trouser":
        return MEN_SHALWAR_FIELDS;
      default:
        return WOMEN_KAMEEZ_FIELDS;
    }
  }

  if (fitCategory === "boys") {
    switch (garmentType) {
      case "kameez":
      case "shirt":
        return adaptFieldsForKids(MEN_KAMEEZ_FIELDS);
      case "shalwar":
      case "trouser":
        return adaptFieldsForKids(MEN_SHALWAR_FIELDS);
      case "waistcoat":
        return adaptFieldsForKids(MEN_WAISTCOAT_FIELDS);
      default:
        return adaptFieldsForKids(MEN_KAMEEZ_FIELDS);
    }
  }

  // girls
  switch (garmentType) {
    case "kameez":
      return adaptFieldsForKids(WOMEN_KAMEEZ_FIELDS);
    case "shalwar":
    case "trouser":
      return adaptFieldsForKids(MEN_SHALWAR_FIELDS);
    default:
      return adaptFieldsForKids(WOMEN_KAMEEZ_FIELDS);
  }
}

/**
 * Dynamically builds a Zod schema to validate values for a given category & garment.
 */
export function createMeasurementValuesSchema(fitCategory: FitCategory, garmentType: GarmentType) {
  const fields = getMeasurementTemplate(fitCategory, garmentType);
  const shape: Record<string, z.ZodNumber> = {};

  fields.forEach((field) => {
    shape[field.key] = z
      .number({ message: `${field.label} must be a number` })
      .min(field.minInches, {
        message: `${field.label} minimum is ${field.minInches}"`,
      })
      .max(field.maxInches, {
        message: `${field.label} maximum is ${field.maxInches}"`,
      });
  });

  return z.object(shape);
}
