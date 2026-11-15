/**
 * Centralized content dictionary for TailorTrack.
 * Prepared for English (en) and future Urdu (ur) localization.
 */

export const content = {
  common: {
    appName: "TailorTrack",
    tagline: "Your Digital Tailoring Passport",
    loading: "Loading...",
    save: "Save",
    cancel: "Cancel",
    confirm: "Confirm",
    back: "Back",
    edit: "Edit",
    delete: "Delete",
  },
  roles: {
    customer: "Customer",
    tailor: "Tailor",
    tailorShop: "Tailor Shop",
  },
  phase0: {
    badge: "Phase 0 Foundation",
    title: "TailorTrack Design & Architecture Showcase",
    subtitle:
      "A clean, production-ready Next.js foundation featuring the TailorTrack boutique palette: Deep Forest Green, Warm Cream, Antique Gold, and Neutral Ink.",
    fontsHeading: "Typography System",
    serifHeading: "Cormorant Garamond (Display / Headings)",
    serifSample: "The Art of Bespoke Tailoring, Preserved in Digital Perfection.",
    sansHeading: "DM Sans (UI & Controls)",
    sansSample: "Clean, accessible, and responsive measurement tracking across all devices.",
    paletteHeading: "Color System",
    componentsHeading: "Installed shadcn/ui Components",
    componentsSub: "Visual verification of the 10 core primitives adhering to the brand theme.",
  },
} as const;

export type ContentDictionary = typeof content;
