import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Link, json, redirect, useLoaderData } from "@remix-run/react";
import { Button } from "components/ui/button";
import { Card, CardContent } from "components/ui/card";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { jsonWithError, redirectWithSuccess } from "remix-toast";
import PageHeading from "~/components/page-heading";
import { db } from "~/lib/prisma.server";
import { requireUserId } from "~/lib/session.server";
import { UserRole } from "~/utils/enums";
import { useFetcherCallback } from "~/utils/hooks/use-fetcher-callback";
import { type inferErrors, validateAction } from "~/utils/validation";
import { EditUserSchema } from "~/utils/zod.schema";

type ActionData = {
  success: boolean;
  fieldErrors?: inferErrors<typeof EditUserSchema>;
};

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { id } = params;
  if (!id) {
    throw redirect("/admin/users");
  }

  const user = await db.user.findUnique({
    where: {
      id,
      role: UserRole.USER,
    },
  });

  if (!user) {
    throw redirect("/admin/users");
  }

  return json({ user });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { id: userId } = params;
  if (!userId) {
    throw redirect("/admin/users");
  }

  await requireUserId(request);
  const { fieldErrors, fields } = await validateAction(request, EditUserSchema);

  if (fieldErrors) {
    return jsonWithError({ fieldErrors, success: false }, "Please correct the errors");
  }

  const userWithEmail = await db.user.findFirst({
    where: {
      email: fields.email,
      id: { not: userId },
    },
  });

  if (userWithEmail) {
    return jsonWithError(
      { fieldErrors: { email: "Email already exists" }, success: false },
      "Email already exists",
    );
  }

  await db.user.update({
    where: { id: userId },
    data: {
      firstName: fields.firstName,
      lastName: fields.lastName,
      email: fields.email,
      phoneNo: fields.phoneNo,
      dob: new Date(fields.dob),
      height: fields.height,
      weight: fields.weight,
      street: fields.street,
      city: fields.city,
      state: fields.state,
      zip: fields.zip,
    },
  });

  return redirectWithSuccess("/admin/users", "User updated successfully");
};

export default function EditUser() {
  const { user } = useLoaderData<typeof loader>();
  const fetcher = useFetcherCallback<ActionData>();

  return (
    <Card className="mx-auto max-w-screen-xl mt-10">
      <CardContent className="p-6">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div className="max-sm:w-full sm:flex-1">
            <PageHeading title="Edit User" />
          </div>
        </div>

        <fetcher.Form method="post" id="edit-user-form">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder="Enter first name"
                  defaultValue={user.firstName}
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
                  defaultValue={user.lastName}
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
                  defaultValue={user.email}
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
                  defaultValue={user.phoneNo}
                  aria-invalid={!!fetcher.data?.fieldErrors?.phoneNo}
                />
                {fetcher.data?.fieldErrors?.phoneNo && (
                  <p className="text-sm text-destructive">{fetcher.data.fieldErrors.phoneNo}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  name="dob"
                  type="date"
                  defaultValue={new Date(user.dob).toISOString().split("T")[0]}
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
                  defaultValue={user.height ?? ""}
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
                  defaultValue={user.weight ?? ""}
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
                    defaultValue={user.street}
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
                    defaultValue={user.city}
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
                    defaultValue={user.state}
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
                    defaultValue={user.zip}
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
                form="edit-user-form"
                className="bg-green-200 text-green-900 hover:bg-green-300"
              >
                {fetcher.isPending ? "Updating..." : "Update"}
              </Button>
            </div>
          </div>
        </fetcher.Form>
      </CardContent>
    </Card>
  );
}
