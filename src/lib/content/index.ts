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
    madeInPakistan: "Designed and crafted with pride in Pakistan",
  },
  roles: {
    customer: "Customer",
    tailor: "Tailor",
    tailorShop: "Tailor Shop",
  },
  nav: {
    howItWorks: "How It Works",
    features: "Features",
    forTailors: "For Tailors",
    faq: "FAQ",
    login: "Log In",
    getStarted: "Create Passport",
    menuLabel: "Open Navigation Menu",
  },
  hero: {
    badge: "The Future of Bespoke Tailoring in Pakistan",
    headlineStart: "Your measurements.",
    headlineMiddle: "Your style.",
    headlineEnd: "Your tailor.",
    headlineAccent: "Always with you.",
    subheading:
      "A customer-owned digital tailoring passport. Keep your exact measurements, preview cuts and fabrics before stitching, and grant instant consent-based access to any master tailor across Pakistan.",
    primaryCta: "Create Your Passport",
    secondaryCta: "See How It Works",
    microcopy: "Free for customers • No app download required • Instant QR sharing",
    passportCard: {
      ownerName: "Tariq Mahmood",
      passportId: "PK-LHR-8821",
      garment: "Kameez Shalwar (Regular Fit)",
      chest: '40.5"',
      length: '42.0"',
      waist: '34.0"',
      shoulder: '18.5"',
      collar: '16.0"',
      sleeve: '24.5"',
      qrStatus: "Active Consent Token",
      securityNotice: "Encrypted & Customer-Controlled",
    },
  },
  problems: {
    badge: "The Problem We Solve",
    title: "Why Tailoring in Pakistan Still Feels Like a Gamble",
    subtitle:
      "Every Pakistani has experienced the frustration of misplaced measurement diaries, missed Eid deadlines, and fit inconsistencies.",
    items: [
      {
        id: "lost-measurements",
        title: "Lost or Forgotten Diaries",
        description:
          "Tailor shops keep measurements on paper slips or thick diaries that get lost, damaged, or misfiled during rush seasons.",
      },
      {
        id: "remeasuring-fatigue",
        title: "Re-measuring at Every New Shop",
        description:
          "Moving to a new city or trying a recommended master tailor means starting from scratch and hoping they get your posture right.",
      },
      {
        id: "uncertain-dates",
        title: "Unpredictable Delivery Milestones",
        description:
          "Constant phone calls asking 'Bhai suit tayar hai?' with zero visibility into whether fabric has been cut or stitching has started.",
      },
      {
        id: "style-disputes",
        title: "Post-Stitching Style Disputes",
        description:
          "Misunderstandings over cuff styles, collar bands (Sherwani collar vs shirt collar), or pocket placement after the fabric is already cut.",
      },
    ],
  },
  howItWorks: {
    badge: "Seamless & Simple",
    title: "How Your Digital Passport Works",
    subtitle:
      "Three effortless steps to take complete ownership of your wardrobe and eliminate tailoring friction forever.",
    steps: [
      {
        number: "01",
        title: "Create Your Digital Passport",
        description:
          "Enter your measurements once, or have your trusted master tailor measure you. Save specific cuts for Shalwar Kameez, Kurtas, Waistcoats, and Sherwanis.",
        detail: "Supports custom collar, cuff, and drape notes",
      },
      {
        number: "02",
        title: "Show Your QR Code at Any Tailor",
        description:
          "Visiting a new tailor or a neighborhood boutique? Present your encrypted QR code. The tailor scans it to instantly view your measurement profile with your consent.",
        detail: "You decide when access expires and can revoke it anytime",
      },
      {
        number: "03",
        title: "Approve & Track Orders",
        description:
          "Review the shop's access request, approve what they can see, and track your garment as it moves from received to cutting, stitching, ready, and delivered.",
        detail: "Status updates appear in your order tracker and inbox",
      },
    ],
  },
  features: {
    badge: "Crafted for Perfection",
    title: "Everything You Need for a Flawless Fit",
    subtitle:
      "Engineered specifically for the nuances of South Asian ethnic wear and modern bespoke wardrobes.",
    items: [
      {
        id: "portable-measurements",
        title: "Measurements That Travel With You",
        description:
          "Your measurement profile lives with you, not locked in a single shop's paper ledger. Access your exact fit whether in Karachi, Lahore, Islamabad, or abroad.",
        tag: "Core Passport",
      },
      {
        id: "order-tracking",
        title: "Live Milestone Order Tracking",
        description:
          "Track order progress with clear stages: Received, Fabric Cutting, Stitching, Trial Ready, and Delivered. No more anxious guessing before weddings or festivals.",
        tag: "Transparency",
      },
      {
        id: "family-profiles",
        title: "Family Member Profiles",
        description:
          "Manage tailored wardrobe profiles for your spouse, children, and parents under a single master account for hassle-free family Eid stitching.",
        tag: "Convenience",
      },
      {
        id: "design-archive",
        title: "Access Activity Log",
        description:
          "See when a tailor shop viewed your profile or measurements, review active permissions, and revoke access whenever you choose.",
        tag: "Audit Trail",
      },
      {
        id: "consent-control",
        title: "Consent & Privacy Control",
        description:
          "You own your body data. Tailors only receive temporary, read-only access while your order is active. Revoke access with a single tap.",
        tag: "Security",
      },
      {
        id: "stitching-history",
        title: "Complete Order & Fit History",
        description:
          "Keep an unalterable history of which tailor stitched which suit, what fabric was used, how much you paid, and how the fit felt.",
        tag: "Record Keeping",
      },
    ],
  },
  privacy: {
    badge: "Data Sovereignty",
    title: "You Stay in Complete Control — Always",
    subtitle:
      "We believe your body measurements and personal style belong to you, not to shops or third parties.",
    pillars: [
      {
        id: "you-approve",
        title: "You Approve Each Tailor",
        description:
          "No tailor can view your measurements without scanning your unique, time-limited QR token generated from your phone.",
      },
      {
        id: "you-choose",
        title: "You Choose What They See",
        description:
          "Need only a waistcoat stitched? Share only torso and length specs while keeping other private garment measurements hidden.",
      },
      {
        id: "you-revoke",
        title: "You Can Revoke Anytime",
        description:
          "Once an order is complete or if you decide not to proceed, revoke the tailor's access immediately with a single tap.",
      },
    ],
  },
  tailorTeaser: {
    badge: "For Tailor Shops & Master Craftsmen",
    title: "Run a Faster, Dispute-Free Tailoring Business",
    subtitle:
      "Say goodbye to messy paper ledgers, lost measurement cards, and awkward customer disputes. Serve modern clients with a swift QR scan.",
    bulletPoints: [
      "No app installation required for your shop",
      "Look up a customer's saved measurements with a QR scan",
      "Keep clear written garment specs and frozen snapshots per order",
      "Share order status updates and delivery dates with customers",
    ],
    cta: "Learn More For Tailors",
  },
  faq: {
    badge: "Frequently Asked Questions",
    title: "Everything You Need to Know",
    subtitle:
      "Clear answers to how TailorTrack protects your fit, your privacy, and your peace of mind.",
    items: [
      {
        question: "What is TailorTrack?",
        answer:
          "TailorTrack is a digital tailoring passport made for Pakistan. It gives customers full ownership of their body measurements and style preferences in a secure digital profile. Participating tailors can scan your QR code with your permission to view your saved measurements, create orders, and send status updates.",
      },
      {
        question: "How do tailors read my measurements?",
        answer:
          "When you visit a tailor, you simply open your TailorTrack passport and show your unique QR code. The tailor scans it using their smartphone camera or web browser. They instantly see your garment-specific measurements without needing to download a heavy app or write anything down.",
      },
      {
        question: "Can I store measurements for my entire family?",
        answer:
          "Yes. TailorTrack includes Family Profiles, allowing you to manage distinct measurement records for yourself, your spouse, your children, and your parents under a single account—making Eid and wedding season shopping effortless.",
      },
      {
        question: "Is TailorTrack free for customers?",
        answer:
          "Yes. Creating and managing your digital tailoring passport, storing measurements, and sharing them via QR code is free for individual customers.",
      },
      {
        question: "What garments are supported?",
        answer:
          "TailorTrack is specifically designed for Pakistani ethnic and formal wear, including Men's & Women's Shalwar Kameez, Kurta Pajama, Waistcoats (Sadri), Prince Coats, Sherwanis, Trouser Suits, and bespoke Western formal wear.",
      },
      {
        question: "Can any tailor in Pakistan use this?",
        answer:
          "Yes. Any tailor with an internet-connected smartphone can scan your QR passport and access the lightweight tailor portal. There is no special hardware, pos terminal, or proprietary machine needed.",
      },
      {
        question: "Is my personal data safe from unauthorized shops?",
        answer:
          "Absolutely. Your measurements are encrypted, and access is governed strictly by your active consent. Tailors only get temporary read access during an active order, and you can revoke access at any time from your dashboard.",
      },
    ],
  },
  finalCta: {
    headline: "Keep Your Tailoring Passport Ready.",
    subheading:
      "Store your measurements, manage family profiles, and track your tailoring orders in one place.",
    cta: "Create Your Free Passport",
    secondaryCta: "Explore Partner Tailors",
    guarantee: "Free for Customers • Takes Less Than 2 Minutes",
  },
  footer: {
    description:
      "The digital tailoring passport for Pakistan. Preserving heritage craftsmanship with modern digital precision.",
    sections: {
      product: {
        title: "Product",
        links: [
          { label: "How It Works", href: "/#how-it-works" },
          { label: "Features", href: "/#features" },
          { label: "For Tailors", href: "/for-tailors" },
          { label: "FAQ", href: "/#faq" },
        ],
      },
      tailors: {
        title: "For Professionals",
        links: [
          { label: "Why Join as Tailor", href: "/for-tailors" },
          { label: "Order Management", href: "/for-tailors#benefits" },
          { label: "Partner Inquiries", href: "/for-tailors#join" },
        ],
      },
      legal: {
        title: "Trust & Legal",
        links: [
          { label: "Privacy Policy", href: "/privacy" },
          { label: "Terms of Service", href: "/terms" },
          { label: "Consent & Security", href: "/#privacy" },
        ],
      },
    },
    rights: "All rights reserved.",
  },
  forTailorsPage: {
    badge: "B2B Partner Network",
    title: "Modernize Your Shop. Eliminate Fit Disputes.",
    subtitle:
      "Designed specifically for Pakistani master tailors, boutiques, and stitching houses. Spend less time measuring and arguing, and more time crafting master garments.",
    benefits: [
      {
        title: "Zero Lost Measurements",
        description:
          "Instant access to customer measurements with one QR scan. No misplaced measurement diaries or unreadable handwriting.",
      },
      {
        title: "Fewer Customer Disputes",
        description:
          "Both you and your customer share the exact same digital specification for length, collar, cuffs, and style notes before cutting.",
      },
      {
        title: "Live Order Status Workflow",
        description:
          "Update status in one tap (Received → Cutting → Stitching → Trial Ready → Delivered). Customers track orders online instead of calling your shop.",
      },
      {
        title: "Higher Customer Retention",
        description:
          "Delight customers with modern service. When customers know their fit is saved and safe with you, they return every festive season.",
      },
    ],
    ctaTitle: "Ready to upgrade your tailor shop?",
    ctaSubtitle:
      "Partner onboarding is currently opening in Lahore, Karachi, and Rawalpindi/Islamabad.",
    ctaButton: "Register Your Tailor Shop",
    backLink: "← Back to TailorTrack Home",
  },
  notFound: {
    badge: "404 Error",
    title: "Lost the Thread?",
    description:
      "We couldn't find the page you were looking for. Perhaps the stitch slipped, or the link has moved.",
    button: "Return to Safe Tailoring",
  },
} as const;

export type ContentDictionary = typeof content;
