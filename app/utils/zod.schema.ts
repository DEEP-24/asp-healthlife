import { z } from "zod";
import { UserRole } from "~/utils/enums";

// const EMAIL_REGEX =
//   /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/

export const LoginSchema = z.object({
  email: z.string().trim().min(3, "Name is required"),
  password: z.string().min(1, "Password is required"),
  redirectTo: z.string().trim().default("/"),
  remember: z.enum(["on"]).optional(),
});

export const RegisterSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    confirmPassword: z.string().min(8, "Password must be at least 8 characters long"),
    street: z.string().min(1, "Street address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    zip: z.string().min(5, "ZIP code must be at least 5 characters"),
    dob: z
      .string()
      .refine((date) => !Number.isNaN(Date.parse(date)), {
        message: "Invalid date format",
      })
      .transform((date) => new Date(date)),
    phoneNo: z.string().min(10, "Phone number must be at least 10 digits"),
    role: z.nativeEnum(UserRole).refine((role) => role !== UserRole.ADMIN, {
      message: "Invalid role selection",
    }),
    height: z.string().min(1, "Height is required"),
    weight: z.string().min(1, "Weight is required"),
  })
  .superRefine((val, ctx) => {
    if (val.password !== val.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Password and confirm password must match",
        path: ["confirmPassword", "password"],
      });
    }
    return true;
  });

export const ResetPasswordSchema = z
  .object({
    password: z.string().trim().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().trim().min(8, "Password must be at least 8 characters"),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      return ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match",
        path: ["confirmPassword", "password"],
      });
    }
  });

export const CreateHospitalSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  street: z.string().trim().min(1, "Street is required"),
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim().min(1, "State is required"),
  zip: z.string().trim().min(1, "Zip is required"),
  phoneNo: z.string().trim().min(1, "Phone number is required"),
  email: z.string().trim().email("Invalid email"),
  password: z.string().trim().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().trim().min(8, "Password must be at least 8 characters"),
});

export const EditHospitalSchema = CreateHospitalSchema.omit({
  password: true,
  confirmPassword: true,
}).extend({
  hospitalId: z.string().trim().min(1, "ID is required"),
});

export const CreateUserSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  street: z.string().trim().min(1, "Street is required"),
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim().min(1, "State is required"),
  zip: z.string().trim().min(1, "Zip is required"),
  dob: z.string().trim().min(1, "Date of birth is required"),
  phoneNo: z.string().trim().min(1, "Phone number is required"),
  email: z.string().trim().email("Invalid email"),
  password: z.string().trim().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().trim().min(8, "Password must be at least 8 characters"),
});

export const EditUserSchema = CreateUserSchema.omit({
  password: true,
  confirmPassword: true,
}).extend({
  donorId: z.string().trim().min(1, "ID is required"),
});
