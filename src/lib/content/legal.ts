export const SUPPORT_EMAIL: string = "SUPPORT_EMAIL_PLACEHOLDER";

export const isSupportEmailConfigured =
  SUPPORT_EMAIL !== "SUPPORT_EMAIL_PLACEHOLDER" && SUPPORT_EMAIL.includes("@");

export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

export const privacyPolicy = {
  title: "Privacy Policy",
  lastUpdated: "25 November 2026",
  intro:
    "This Privacy Policy explains what TailorTrack collects, who can view your records, and how you can export or delete your account data.",
  sections: [
    {
      heading: "1. Information We Store",
      paragraphs: [
        "For customer accounts, TailorTrack stores your account email (managed by authentication), full name, optional phone number, city, default fit category, preferred unit (inches or centimetres), and a random QR passport token.",
        "If you add them, TailorTrack also stores family member profiles (name, relation, fit category) and versioned measurement sets (garment type, numeric values stored in inches, fit preference, notes, and date taken).",
        "For tailor accounts, TailorTrack stores your account email, full name, phone number, and tailor shop details (shop name, city, address, and shop phone).",
        "For tailoring orders, TailorTrack stores order items, garment quantities, fabric details, design notes, price and advance/paid amounts in whole PKR, target delivery dates, status history events, and server-side measurement snapshots copied at order creation.",
      ],
    },
    {
      heading: "2. Who Can See Your Data and When",
      paragraphs: [
        "When a tailor scans or looks up your QR passport token, TailorTrack displays only your masked name (first name and last initial) and whether an access relationship already exists. Your phone number, city, and measurements are not shown during a scan.",
        "A tailor can view your contact details (full name, phone, city, fit category), family profiles, and measurement sets only while you have an active, unexpired, unrevoked consent granting the relevant permission (measurements or orders).",
        "Once a tailor creates an order under active orders consent, the shop can view that order's details and measurement snapshot while the order is open (received, cutting, stitching, or ready), even if your consent later expires or is revoked. After an order is delivered or cancelled, the shop can open its measurement snapshot only if an active consent with measurements permission still exists.",
      ],
    },
    {
      heading: "3. Access Log and Notifications",
      paragraphs: [
        "When a consented tailor views your profile, family list, or measurements, TailorTrack records an entry in your access log (de-duplicated within 30-minute windows) showing the shop name and timestamp.",
        "Order creation, status changes, reschedules, price changes, and recorded payments generate machine-readable in-app notifications for the customer.",
      ],
    },
    {
      heading: "4. Payments, Hosting, and Cookies",
      paragraphs: [
        "TailorTrack does not process payments or collect card or bank account details. Total bill and paid amounts are recorded manually by the tailor shop for record-keeping.",
        "TailorTrack is hosted on Supabase (PostgreSQL database and user authentication) and Vercel (web application hosting).",
        "Cookies are limited strictly to the session cookies required to keep you signed in.",
      ],
    },
    {
      heading: "5. Exporting and Deleting Your Data",
      paragraphs: [
        "You can download a JSON copy of your account data at any time from your Profile (customers) or Shop Settings (tailors). Customer exports exclude internal QR tokens; tailor exports include only customer first names on consents and omit closed-order snapshots unless active measurements consent exists.",
        "Accounts with open orders (received, cutting, stitching, or ready) cannot be deleted until all open orders are delivered or cancelled.",
        "Deleting a customer account removes the customer's profile, QR passport, family profiles, measurement sets, consents, access-log entries, notifications, and closed orders (which also removes those closed orders from the shop's records).",
        "Deleting a tailor shop account removes the tailor's profile, shop record, consents, and the customer's access-log entries for that shop. Closed orders remain visible to their customers using the shop name, city, and phone snapshot saved on each order.",
      ],
    },
  ] as LegalSection[],
  contactNote:
    "For privacy questions or support requests, please use the contact channel below once configured.",
};

export const termsOfService = {
  title: "Terms of Service",
  lastUpdated: "25 November 2026",
  intro:
    "These Terms of Service govern your use of TailorTrack as a customer or tailor shop. By creating an account, you agree to these terms.",
  sections: [
    {
      heading: "1. Eligibility and Accounts",
      paragraphs: [
        "You must provide accurate account information and keep your login credentials secure. Each account has a permanent role (customer or tailor).",
      ],
    },
    {
      heading: "2. Measurement Accuracy",
      paragraphs: [
        "Customers and tailors are responsible for checking physical measurements, fabric shrinkage, seam allowances, and garment notes before cutting cloth. TailorTrack stores and shares the numbers you enter or snapshot at order booking.",
      ],
    },
    {
      heading: "3. Tailor Orders and Transactions",
      paragraphs: [
        "TailorTrack is a record-keeping tool and is not a party to any tailoring agreement or transaction between a customer and a tailor shop.",
        "Tailor shops are solely responsible for stitching quality, pricing, delivery dates, and fulfilling open orders. TailorTrack does not process payments or handle disputes.",
      ],
    },
    {
      heading: "4. Acceptable Use",
      paragraphs: [
        "You may not attempt to access another user's records without consent, abuse QR passport lookups, or interfere with the availability of the service.",
      ],
    },
    {
      heading: "5. Account Deletion",
      paragraphs: [
        "You may delete your account at any time provided you have no open orders (received, cutting, stitching, or ready). Deleting a customer account removes closed orders; deleting a tailor account leaves closed orders visible to customers using the shop snapshot stored on the order.",
      ],
    },
    {
      heading: "6. Changes and No Warranties",
      paragraphs: [
        "We may update the service or these terms from time to time. TailorTrack is provided on an 'as is' and 'as available' basis without warranties of any kind.",
      ],
    },
  ] as LegalSection[],
};
