import { z } from "zod";
import { UserRole } from "~/utils/enums";
import type { Ingredient } from "@prisma/client";

export const LoginSchema = z.object({
  email: z.string().trim().min(3, "Name is required"),
  password: z.string().min(1, "Password is required"),
  redirectTo: z.string().trim().default("/"),
  remember: z.enum(["on"]).optional(),
  role: z.nativeEnum(UserRole),
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
    phoneNo: z.string().length(10, "Phone number must be 10 digits"),
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

export type SelectIngredient = Omit<Ingredient, "recipeId">;
export type Step = {
  id: string;
  order: number;
  content: string;
};

export const RecipeSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    description: z.string().trim().min(1, "Description is required"),
    image: z.string().url().trim().min(1, "Image is required"),
    price: z.string().trim().min(1, "Price is required"),
    cookingTime: z.string().trim().min(1, "Cooking time is required"),
    commission: z.string().optional().default("0"),
    ingredients: z
      .string()
      .min(1, "Ingredients is required")
      .transform((ingredients) => JSON.parse(ingredients) as Array<SelectIngredient>),
    steps: z
      .string()
      .min(1, "Steps is required")
      .transform((steps) => JSON.parse(steps) as Array<Step>),
  })
  .superRefine((data, ctx) => {
    if (data.ingredients.length === 0) {
      return ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ingredients is required",
        path: ["ingredients"],
      });
    }

    if (data.steps.length === 0) {
      return ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Steps is required",
        path: ["steps"],
      });
    }

    return true;
  });

export const AppointmentSchema = z.object({
  doctorId: z.string().trim().min(1, "Doctor is required"),
  date: z.string().trim().min(1, "Date is required"),
  startTime: z.string().trim().min(1, "Start time is required"),
  endTime: z.string().trim().min(1, "End time is required"),
});

export const DoctorSchema = z
  .object({
    email: z.string().email(),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
    street: z.string().min(1, "Street is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    zip: z.string().min(5, "ZIP code is required"),
    dob: z
      .string()
      .min(1, "Date of birth is required")
      .refine((date) => !Number.isNaN(Date.parse(date)), {
        message: "Invalid date format",
      }),
    phoneNo: z.string().length(10, "Phone number must be 10 digits"),
    speciality: z.string().min(1, "Specialty is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const EditDoctorSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip: z.string().min(5, "ZIP code is required"),
  dob: z
    .string()
    .min(1, "Date of birth is required")
    .refine((date) => !Number.isNaN(Date.parse(date)), {
      message: "Invalid date format",
    }),
  phoneNo: z.string().length(10, "Phone number must be 10 digits"),
  speciality: z.string().min(1, "Specialty is required"),
});

export const CreateUserSchema = z
  .object({
    email: z.string().email(),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
    street: z.string().min(1, "Street is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    zip: z.string().min(5, "ZIP code is required"),
    dob: z
      .string()
      .min(1, "Date of birth is required")
      .refine((date) => !Number.isNaN(Date.parse(date)), {
        message: "Invalid date format",
      }),
    phoneNo: z.string().length(10, "Phone number must be 10 digits"),
    height: z.string().min(1, "Height is required"),
    weight: z.string().min(1, "Weight is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const EditUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip: z.string().min(5, "ZIP code is required"),
  dob: z
    .string()
    .min(1, "Date of birth is required")
    .refine((date) => !Number.isNaN(Date.parse(date)), {
      message: "Invalid date format",
    }),
  phoneNo: z.string().length(10, "Phone number must be 10 digits"),
  height: z.string().min(1, "Height is required"),
  weight: z.string().min(1, "Weight is required"),
});
