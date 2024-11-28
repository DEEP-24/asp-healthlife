import type { ActionFunctionArgs } from "@remix-run/node";
import { Link, useFetcher } from "@remix-run/react";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { EyeIcon, EyeOffIcon, HeartPulseIcon } from "lucide-react";
import * as React from "react";
import { jsonWithError } from "remix-toast";
import { UserRole } from "~/utils/enums";

import { Button } from "components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "components/ui/tabs";
import { z } from "zod";
import { db } from "~/lib/prisma.server";
import { createUserSession } from "~/lib/session.server";
import { createHash } from "~/utils/encryption";
import { badRequest, safeRedirect } from "~/utils/misc.server";
import { type inferErrors, validateAction } from "~/utils/validation";
import { RegisterSchema } from "~/utils/zod.schema";

interface ActionData {
  fieldErrors?: inferErrors<typeof RegisterSchema>;
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const { fieldErrors, fields } = await validateAction(request, RegisterSchema);

  if (fieldErrors) {
    console.log("Field validation errors:", fieldErrors);
    return badRequest<ActionData>({ fieldErrors });
  }

  const existingUser = await db.user.findUnique({
    where: {
      email: fields.email,
    },
  });

  if (existingUser) {
    return jsonWithError<ActionData>(
      {
        fieldErrors: {
          email: "Email already exists",
        },
      },
      "Email already exists",
    );
  }

  console.log("Form Fields", fields);

  // Convert dob string to Date object
  const dobDate = new Date(fields.dob);

  const createdUser = await db.user.create({
    data: {
      firstName: fields.firstName,
      lastName: fields.lastName,
      email: fields.email,
      password: await createHash(fields.password),
      street: fields.street,
      city: fields.city,
      state: fields.state,
      zip: fields.zip,
      dob: dobDate,
      phoneNo: fields.phoneNo,
      role: fields.role as UserRole,
      height: fields.height ? fields.height.toString() : undefined,
      weight: fields.weight ? fields.weight.toString() : undefined,
    },
  });

  return createUserSession({
    redirectTo: safeRedirect("/"),
    request,
    role: createdUser.role,
    userId: createdUser.id,
  });
};

export default function Register() {
  const fetcher = useFetcher<ActionData>();
  const isSubmitting = fetcher.state !== "idle";

  const [step, setStep] = React.useState(1);

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [street, setStreet] = React.useState("");
  const [city, setCity] = React.useState("");
  const [state, setState] = React.useState("");
  const [zip, setZip] = React.useState("");
  const [dob, setDob] = React.useState("");
  const [phoneNo, setPhoneNo] = React.useState("");
  const [role, setRole] = React.useState<UserRole | undefined>(undefined);
  const [height, setHeight] = React.useState("");
  const [weight, setWeight] = React.useState("");

  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  // Update the stepErrors type definition to be more specific
  const [stepErrors, setStepErrors] = React.useState<{
    [key: number]: Record<string, string | undefined>;
  }>({});

  // Update the validateStep function to handle array paths in Zod errors
  const validateStep = (currentStep: number) => {
    const errors: Record<string, string> = {};

    if (currentStep === 1) {
      const stepOneSchema = z
        .object({
          role: z.nativeEnum(UserRole, { required_error: "Role is required" }),
          firstName: z.string().min(1, "First name is required"),
          lastName: z.string().min(1, "Last name is required"),
          dob: z.string().min(1, "Date of birth is required"),
          height: z.string().optional(),
          weight: z.string().optional(),
        })
        .refine(
          (data) => {
            if (role === UserRole.USER) {
              return !!data.height && !!data.weight;
            }
            return true;
          },
          {
            message: "Height and weight are required for users",
            path: ["height"],
          },
        );

      const result = stepOneSchema.safeParse({
        role,
        firstName,
        lastName,
        dob,
        height: role === UserRole.USER ? height : undefined,
        weight: role === UserRole.USER ? weight : undefined,
      });

      if (!result.success) {
        result.error.issues.forEach((issue) => {
          // Handle both string and array paths
          const path = Array.isArray(issue.path) ? issue.path[0] : issue.path;
          errors[path.toString()] = issue.message;
        });
      }
    }

    if (currentStep === 2) {
      const stepTwoSchema = z.object({
        street: z.string().min(1, "Street is required"),
        city: z.string().min(1, "City is required"),
        state: z.string().min(1, "State is required"),
        zip: z.string().min(1, "ZIP code is required"),
        phoneNo: z.string().length(10, "Phone number must be 10 digits"),
      });

      const result = stepTwoSchema.safeParse({
        street,
        city,
        state,
        zip,
        phoneNo,
      });

      if (!result.success) {
        result.error.issues.forEach((issue) => {
          errors[issue.path[0]] = issue.message;
        });
      }
    }

    if (currentStep === 3) {
      const stepThreeSchema = z
        .object({
          email: z.string().email("Invalid email address"),
          password: z.string().min(8, "Password must be at least 8 characters long"),
          confirmPassword: z.string(),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: "Passwords don't match",
          path: ["confirmPassword"],
        });

      const result = stepThreeSchema.safeParse({
        email,
        password,
        confirmPassword,
      });

      if (!result.success) {
        result.error.issues.forEach((issue) => {
          errors[issue.path[0]] = issue.message;
        });
      }
    }

    setStepErrors((prev) => ({ ...prev, [currentStep]: errors }));
    return Object.keys(errors).length === 0;
  };

  // Update nextStep to include validation
  const nextStep = () => {
    if (validateStep(step)) {
      setStep((prevStep) => Math.min(prevStep + 1, 3));
    }
  };

  // Add the prevStep function definition near the other state management functions
  const prevStep = () => setStep((prevStep) => Math.max(prevStep - 1, 1));

  // Update handleSubmit to validate final step before submission
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateStep(3)) {
      return;
    }

    const formData = new FormData(event.currentTarget);

    // Add all form fields to formData
    formData.set("firstName", firstName);
    formData.set("lastName", lastName);
    formData.set("email", email);
    formData.set("password", password);
    formData.set("confirmPassword", confirmPassword);
    formData.set("street", street);
    formData.set("city", city);
    formData.set("state", state);
    formData.set("zip", zip);
    formData.set("dob", dob);
    formData.set("phoneNo", phoneNo);
    formData.set("role", role || "");
    formData.set("height", height);
    formData.set("weight", weight);

    fetcher.submit(formData, { method: "post" });
  };

  // Update the getStepError function to handle undefined values
  const getStepError = (field: string) => {
    const stepError = stepErrors[step]?.[field];
    const fetcherError = fetcher?.data?.fieldErrors?.[field as keyof ActionData["fieldErrors"]];

    if (!stepError && !fetcherError) {
      return null;
    }

    return <p className="mt-1 text-xs text-red-600">{stepError || fetcherError}</p>;
  };

  return (
    <div className="mx-auto w-full max-w-md rounded-lg bg-white p-8 shadow-xl">
      <div className="mb-8 text-center">
        <HeartPulseIcon className="mx-auto h-12 w-12 text-green-500" />
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Create an account</h2>
        <p className="mt-2 text-sm text-gray-600">
          Join HealthLife - Your Personalized Health Companion
        </p>
      </div>

      <fetcher.Form className="space-y-6" method="post" onSubmit={handleSubmit}>
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Role & Personal Information</h3>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Tabs
                value={role}
                onValueChange={(value) => setRole(value as UserRole)}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-md">
                  <TabsTrigger value={UserRole.USER}>User</TabsTrigger>
                  <TabsTrigger value={UserRole.DOCTOR}>Doctor</TabsTrigger>
                </TabsList>
              </Tabs>
              <input type="hidden" name="role" value={role} />
              {getStepError("role")}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
                {getStepError("firstName")}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
                {getStepError("lastName")}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                name="dob"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                max={
                  role === UserRole.DOCTOR ? "2000-12-31" : new Date().toISOString().split("T")[0]
                }
                required
              />
              {getStepError("dob")}
            </div>

            {role === UserRole.USER && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="height" className="block text-sm font-medium text-gray-700">
                    Height (cm)
                  </Label>
                  <Input
                    id="height"
                    name="height"
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    required
                    className="mt-1 block w-full"
                  />
                  {getStepError("height")}
                </div>
                <div>
                  <Label htmlFor="weight" className="block text-sm font-medium text-gray-700">
                    Weight (kg)
                  </Label>
                  <Input
                    id="weight"
                    name="weight"
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    required
                    className="mt-1 block w-full"
                  />
                  {getStepError("weight")}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Contact Information</h3>
            <div>
              <Label htmlFor="street" className="block text-sm font-medium text-gray-700">
                Street
              </Label>
              <Input
                id="street"
                name="street"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                required
                className="mt-1 block w-full"
              />
              {getStepError("street")}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city" className="block text-sm font-medium text-gray-700">
                  City
                </Label>
                <Input
                  id="city"
                  name="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  className="mt-1 block w-full"
                />
                {getStepError("city")}
              </div>
              <div>
                <Label htmlFor="state" className="block text-sm font-medium text-gray-700">
                  State
                </Label>
                <Input
                  id="state"
                  name="state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  required
                  className="mt-1 block w-full"
                />
                {getStepError("state")}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="zip" className="block text-sm font-medium text-gray-700">
                  ZIP Code
                </Label>
                <Input
                  id="zip"
                  name="zip"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  required
                  maxLength={10}
                  className="mt-1 block w-full"
                />
                {getStepError("zip")}
              </div>
              <div>
                <Label htmlFor="phoneNo" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </Label>
                <Input
                  id="phoneNo"
                  name="phoneNo"
                  value={phoneNo}
                  onChange={(e) => setPhoneNo(e.target.value)}
                  required
                  className="mt-1 block w-full"
                />
                {getStepError("phoneNo")}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Account Setup</h3>
            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full"
              />
              {getStepError("email")}
            </div>
            <div>
              <Label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1 block w-full"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
              {getStepError("password")}
            </div>
            <div>
              <Label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="mt-1 block w-full"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOffIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
              {getStepError("confirmPassword")}
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-between">
          {step > 1 && (
            <Button type="button" onClick={prevStep} variant="outline">
              Previous
            </Button>
          )}
          {step < 3 ? (
            <Button
              type="button"
              onClick={nextStep}
              className="bg-emerald-500 text-white hover:bg-emerald-600"
            >
              Next
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-500 text-white hover:bg-emerald-600"
            >
              {isSubmitting ? "Creating account..." : "Create Account"}
            </Button>
          )}
        </div>
      </fetcher.Form>

      <p className="mt-8 text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-green-600 hover:text-green-500">
          Sign in
        </Link>
      </p>

      <div className="mt-8 text-center text-xs text-gray-500">
        <p>HealthLife - Your Personalized Health Companion</p>
      </div>
    </div>
  );
}
