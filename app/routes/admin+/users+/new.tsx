import type { ActionFunctionArgs } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { Button } from "components/ui/button";
import { Card, CardContent } from "components/ui/card";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { jsonWithError, redirectWithSuccess } from "remix-toast";
import PageHeading from "~/components/page-heading";
import { db } from "~/lib/prisma.server";
import { requireUserId } from "~/lib/session.server";
import { createHash } from "~/utils/encryption";
import { UserRole } from "~/utils/enums";
import { useFetcherCallback } from "~/utils/hooks/use-fetcher-callback";
import { type inferErrors, validateAction } from "~/utils/validation";
import { CreateUserSchema } from "~/utils/zod.schema";

type ActionData = {
  success: boolean;
  fieldErrors?: inferErrors<typeof CreateUserSchema>;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  await requireUserId(request);
  const { fieldErrors, fields } = await validateAction(request, CreateUserSchema);

  if (fieldErrors) {
    return jsonWithError({ fieldErrors, success: false }, "Please correct the errors");
  }

  const userWithEmail = await db.user.findUnique({
    where: { email: fields.email },
  });

  if (userWithEmail) {
    return jsonWithError(
      { fieldErrors: { email: "Email already exists" }, success: false },
      "Email already exists",
    );
  }

  await db.user.create({
    data: {
      firstName: fields.firstName,
      lastName: fields.lastName,
      email: fields.email,
      street: fields.street,
      city: fields.city,
      state: fields.state,
      zip: fields.zip,
      phoneNo: fields.phoneNo,
      height: fields.height,
      weight: fields.weight,
      dob: new Date(fields.dob),
      password: await createHash(fields.password),
      role: UserRole.USER,
    },
  });

  return redirectWithSuccess("/admin/users", "User added successfully");
};

export default function NewUser() {
  const fetcher = useFetcherCallback<ActionData>();

  return (
    <Card className="mx-auto max-w-screen-xl mt-10">
      <CardContent className="p-6">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div className="max-sm:w-full sm:flex-1">
            <PageHeading title="New User" />
          </div>
        </div>

        <fetcher.Form method="post" id="new-user-form">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder="Enter first name"
                  autoFocus
                  aria-invalid={!!fetcher.data?.fieldErrors?.firstName}
                />
                {fetcher.data?.fieldErrors?.firstName && (
                  <p className="text-sm text-destructive">{fetcher.data.fieldErrors.firstName}</p>
                )}
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="Enter last name"
                  aria-invalid={!!fetcher.data?.fieldErrors?.lastName}
                />
                {fetcher.data?.fieldErrors?.lastName && (
                  <p className="text-sm text-destructive">{fetcher.data.fieldErrors.lastName}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter email"
                  aria-invalid={!!fetcher.data?.fieldErrors?.email}
                />
                {fetcher.data?.fieldErrors?.email && (
                  <p className="text-sm text-destructive">{fetcher.data.fieldErrors.email}</p>
                )}
              </div>
              <div>
                <Label htmlFor="phoneNo">Phone Number</Label>
                <Input
                  id="phoneNo"
                  name="phoneNo"
                  type="tel"
                  placeholder="Enter phone number"
                  aria-invalid={!!fetcher.data?.fieldErrors?.phoneNo}
                />
                {fetcher.data?.fieldErrors?.phoneNo && (
                  <p className="text-sm text-destructive">{fetcher.data.fieldErrors.phoneNo}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter password"
                    aria-invalid={!!fetcher.data?.fieldErrors?.password}
                  />
                  {fetcher.data?.fieldErrors?.password && (
                    <p className="text-sm text-destructive">{fetcher.data.fieldErrors.password}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Enter password again"
                    aria-invalid={!!fetcher.data?.fieldErrors?.confirmPassword}
                  />
                  {fetcher.data?.fieldErrors?.confirmPassword && (
                    <p className="text-sm text-destructive">
                      {fetcher.data.fieldErrors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  name="dob"
                  type="date"
                  aria-invalid={!!fetcher.data?.fieldErrors?.dob}
                  max={new Date().toISOString().split("T")[0]}
                />
                {fetcher.data?.fieldErrors?.dob && (
                  <p className="text-sm text-destructive">{fetcher.data.fieldErrors.dob}</p>
                )}
              </div>
              <div>
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  name="height"
                  type="number"
                  placeholder="Enter height"
                  aria-invalid={!!fetcher.data?.fieldErrors?.height}
                />
                {fetcher.data?.fieldErrors?.height && (
                  <p className="text-sm text-destructive">{fetcher.data.fieldErrors.height}</p>
                )}
              </div>
              <div>
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  name="weight"
                  type="number"
                  placeholder="Enter weight"
                  aria-invalid={!!fetcher.data?.fieldErrors?.weight}
                />
                {fetcher.data?.fieldErrors?.weight && (
                  <p className="text-sm text-destructive">{fetcher.data.fieldErrors.weight}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <Label>Address</Label>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Input
                    name="street"
                    placeholder="Street"
                    aria-invalid={!!fetcher.data?.fieldErrors?.street}
                  />
                  {fetcher.data?.fieldErrors?.street && (
                    <p className="text-sm text-destructive">{fetcher.data.fieldErrors.street}</p>
                  )}
                </div>
                <div>
                  <Input
                    name="city"
                    placeholder="City"
                    aria-invalid={!!fetcher.data?.fieldErrors?.city}
                  />
                  {fetcher.data?.fieldErrors?.city && (
                    <p className="text-sm text-destructive">{fetcher.data.fieldErrors.city}</p>
                  )}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Input
                    name="state"
                    placeholder="State"
                    aria-invalid={!!fetcher.data?.fieldErrors?.state}
                  />
                  {fetcher.data?.fieldErrors?.state && (
                    <p className="text-sm text-destructive">{fetcher.data.fieldErrors.state}</p>
                  )}
                </div>
                <div>
                  <Input
                    name="zip"
                    placeholder="ZIP"
                    aria-invalid={!!fetcher.data?.fieldErrors?.zip}
                  />
                  {fetcher.data?.fieldErrors?.zip && (
                    <p className="text-sm text-destructive">{fetcher.data.fieldErrors.zip}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-4 items-center justify-end">
              <Button variant="outline" asChild>
                <Link to="/admin/users">Cancel</Link>
              </Button>
              <Button
                type="submit"
                form="new-user-form"
                className="bg-green-200 text-green-900 hover:bg-green-300"
              >
                {fetcher.isPending ? "Adding..." : "Add"}
              </Button>
            </div>
          </div>
        </fetcher.Form>
      </CardContent>
    </Card>
  );
}
