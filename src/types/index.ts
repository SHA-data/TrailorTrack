/**
 * Shared TypeScript domain models and interfaces for TailorTrack.
 */

export type UserRole = "customer" | "tailor";

export interface UserProfile {
  id: string;
  role: UserRole;
  fullName: string;
  phoneNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | "draft"
  | "received"
  | "in_cutting"
  | "stitching"
  | "trial_ready"
  | "completed"
  | "delivered"
  | "cancelled";

export interface MeasurementSet {
  id: string;
  profileId: string;
  label: string; // e.g. "Kameez Shalwar - Standard", "Kurta Fit"
  version: number;
  data: Record<string, number | string>;
  createdAt: string;
}
