import type { ActionFunctionArgs } from "@remix-run/node";
import { Link, useActionData, useFetcher } from "@remix-run/react";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { HeartPulseIcon } from "lucide-react";
import * as React from "react";
import { jsonWithError } from "remix-toast";
import { UserRole } from "~/utils/enums";

import { db } from "~/lib/prisma.server";
import { createUserSession } from "~/lib/session.server";
import { createHash } from "~/utils/encryption";
import { badRequest, safeRedirect } from "~/utils/misc.server";
import { type inferErrors, validateAction } from "~/utils/validation";
import { RegisterSchema } from "~/utils/zod.schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "components/ui/dropdown-menu";
import { Button } from "components/ui/button";
import { titleCase } from "~/utils/misc";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";

interface ActionData {
  fieldErrors?: inferErrors<typeof RegisterSchema>;
  success: boolean;
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const { fieldErrors, fields } = await validateAction(request, RegisterSchema);

  if (fieldErrors) {
    return badRequest<ActionData>({ fieldErrors, success: false });
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
        success: false,
      },
      "Email already exists",
    );
  }

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
      dob: fields.dob,
      phoneNo: fields.phoneNo,
      role: fields.role as UserRole,
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
  const actionData = useActionData<ActionData>();
  const fetcher = useFetcher();
  const isPending = fetcher.state === "submitting";
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
  const [role, setRole] = React.useState<UserRole>();
  const [height, setHeight] = React.useState("");
  const [weight, setWeight] = React.useState("");

  const nextStep = () => setStep((prevStep) => Math.min(prevStep + 1, 3));
  const prevStep = () => setStep((prevStep) => Math.max(prevStep - 1, 1));

  return (
    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md mx-auto">
      <div className="mb-8 text-center">
        <HeartPulseIcon className="mx-auto h-12 w-12 text-green-500" />
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Create an account</h2>
        <p className="mt-2 text-sm text-gray-600">
          Join HealthLife - Your Personalized Health Companion
        </p>
      </div>

      <fetcher.Form className="space-y-6" method="post">
        <fieldset disabled={isPending}>
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Role & Personal Information</h3>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  name="role"
                  value={role}
                  onValueChange={(value) => setRole(value as UserRole)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(UserRole)
                      .filter((r) => r !== UserRole.ADMIN)
                      .map((r) => (
                        <SelectItem key={r} value={r}>
                          {titleCase(r.replace(/_/g, " "))}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {actionData?.fieldErrors?.role && (
                  <p className="text-xs text-red-600">{actionData.fieldErrors.role}</p>
                )}
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
                  {actionData?.fieldErrors?.firstName && (
                    <p className="text-xs text-red-600">{actionData.fieldErrors.firstName}</p>
                  )}
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
                  {actionData?.fieldErrors?.lastName && (
                    <p className="text-xs text-red-600">{actionData.fieldErrors.lastName}</p>
                  )}
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
                  required
                />
                {actionData?.fieldErrors?.dob && (
                  <p className="text-xs text-red-600">{actionData.fieldErrors.dob}</p>
                )}
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
                    {actionData?.fieldErrors?.height && (
                      <p className="mt-1 text-xs text-red-600">{actionData.fieldErrors.height}</p>
                    )}
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
                    {actionData?.fieldErrors?.weight && (
                      <p className="mt-1 text-xs text-red-600">{actionData.fieldErrors.weight}</p>
                    )}
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
                {actionData?.fieldErrors?.street && (
                  <p className="mt-1 text-xs text-red-600">{actionData.fieldErrors.street}</p>
                )}
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
                  {actionData?.fieldErrors?.city && (
                    <p className="mt-1 text-xs text-red-600">{actionData.fieldErrors.city}</p>
                  )}
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
                  {actionData?.fieldErrors?.state && (
                    <p className="mt-1 text-xs text-red-600">{actionData.fieldErrors.state}</p>
                  )}
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
                  {actionData?.fieldErrors?.zip && (
                    <p className="mt-1 text-xs text-red-600">{actionData.fieldErrors.zip}</p>
                  )}
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
                  {actionData?.fieldErrors?.phoneNo && (
                    <p className="mt-1 text-xs text-red-600">{actionData.fieldErrors.phoneNo}</p>
                  )}
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
                {actionData?.fieldErrors?.email && (
                  <p className="mt-1 text-xs text-red-600">{actionData.fieldErrors.email}</p>
                )}
              </div>
              <div>
                <Label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1 block w-full"
                />
                {actionData?.fieldErrors?.password && (
                  <p className="mt-1 text-xs text-red-600">{actionData.fieldErrors.password}</p>
                )}
              </div>
              <div>
                <Label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="mt-1 block w-full"
                />
                {actionData?.fieldErrors?.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">
                    {actionData.fieldErrors.confirmPassword}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between mt-6">
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
                disabled={isPending}
                className="bg-emerald-500 text-white hover:bg-emerald-600"
              >
                {isPending ? "Creating account..." : "Create Account"}
              </Button>
            )}
          </div>
        </fieldset>
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
