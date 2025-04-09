// This file was generated by a custom prisma generator, do not edit manually.
export const UserRole = {
  ADMIN: "ADMIN",
  USER: "USER",
  DOCTOR: "DOCTOR",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const AppointmentStatus = {
  PENDING: "PENDING",
  SCHEDULED: "SCHEDULED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export type AppointmentStatus = (typeof AppointmentStatus)[keyof typeof AppointmentStatus];

export const MealType = {
  BREAKFAST: "BREAKFAST",
  LUNCH: "LUNCH",
  DINNER: "DINNER",
  SNACK: "SNACK",
} as const;

export type MealType = (typeof MealType)[keyof typeof MealType];
