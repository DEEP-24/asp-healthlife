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
    confirmPassword: z.string(),
    street: z.string().min(1, "Street is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    zip: z.string().min(1, "ZIP code is required"),
    dob: z.string().min(1, "Date of birth is required"),
    phoneNo: z.string().min(1, "Phone number is required"),
    role: z.nativeEnum(UserRole),
    height: z.string().optional(),
    weight: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => {
      if (data.role === UserRole.USER) {
        return !!data.height && !!data.weight;
      }
      return true;
    },
    {
      message: "Height and weight are required for users",
      path: ["height", "weight"],
    },
  );

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
