export const accessContent = {
  passport: {
    badge: "Digital Passport",
    title: "My QR Passport",
    subtitle:
      "Show this secure QR code to your master tailor to grant them access to your measurements.",
    savePng: "Save as Image",
    printCard: "Print Card",
    shareWhatsApp: "Share via WhatsApp",
    copyLink: "Copy Passport Link",
    resetQr: "Reset My QR",
    resetWarning:
      "Resetting your QR code generates a new link and invalidates the previous QR code. Tailors you have already approved will keep their active access until expired or revoked.",
    resetSuccess: "Your QR code has been regenerated successfully.",
    whatsappShareText: (link: string, name: string) =>
      `Assalam-o-Alaikum! Here is my TailorTrack digital measurement passport (${name}): ${link}\n\nPlease scan or open this link to request access to my tailoring measurements.`,
  },
  access: {
    title: "Access & Security",
    subtitle:
      "Control which tailors can view your measurements and monitor their activity in real time.",
    tabs: {
      requests: "Requests",
      active: "Active",
      activity: "Activity Log",
    },
    emptyRequests:
      "No pending tailor requests. When a tailor scans your passport, their request will appear here.",
    emptyActive: "No active tailor permissions. Approved tailors will be listed here.",
    emptyActivity:
      "No activity recorded yet. Tailor visits to your profile or measurements will be logged here.",
    approveTitle: "Grant Tailor Access",
    approveSubtitle:
      "Select which information this tailor can view and how long their access lasts.",
    scopes: {
      measurements: "Measurements & Family (View body measurements & family sizes)",
      orders: "Orders (Create & update tailoring orders)",
      saved_looks: "Saved Looks (View saved styles & fabric preferences)",
    },
    durations: {
      7: "7 Days (Quick order)",
      30: "30 Days (Standard stitching)",
      90: "90 Days (Wedding / Season)",
      365: "1 Year (Family tailor)",
    },
  },
  scanner: {
    title: "Passport Scanner",
    subtitle:
      "Scan a customer's TailorTrack QR code to request permission to view their measurements.",
    cameraError:
      "Camera access was denied or is unavailable on this device. You can paste the passport link below instead.",
    switchCamera: "Switch Camera",
    torchOn: "Turn Torch On",
    torchOff: "Turn Torch Off",
    fallbackLabel: "Or Enter Passport Link / Token",
    fallbackPlaceholder: "Paste full URL or token (e.g. 1a2b3c...)",
    lookupButton: "Lookup Passport",
  },
  gateway: {
    loggedOutTitle: "TailorTrack Digital Passport",
    loggedOutMessage:
      "This is a verified customer passport on TailorTrack. If you are a master tailor, please sign in to your shop account to request access to these measurements.",
    customerMessage:
      "This is your tailoring passport link. Share this QR code or link with your master tailor so they can request access.",
    maskedCustomer: "Customer Passport",
    requestAccessTitle: "Request Customer Permission",
    requestAccessSubtitle: "Select the data your shop needs to stitch garments for this customer.",
    pendingTitle: "Waiting for Customer Approval",
    pendingSubtitle:
      "A permission request has been sent to the customer's phone. This screen will automatically update as soon as they approve.",
    cooldownTitle: "Request Cooldown Active",
    cooldownSubtitle:
      "The customer declined access recently. A 3-day privacy cooldown is currently in effect.",
    expiredTitle: "Access Expired",
    expiredSubtitle:
      "Your previous access to this customer has expired. You can submit a new request.",
    revokedTitle: "Access Revoked",
    revokedSubtitle: "Access to this customer's passport was revoked.",
  },
};
