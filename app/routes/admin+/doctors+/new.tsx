import type { ActionFunctionArgs } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { Button } from "components/ui/button";
import { Card, CardContent } from "components/ui/card";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";
import { jsonWithError, redirectWithSuccess } from "remix-toast";
import PageHeading from "~/components/page-heading";
import { db } from "~/lib/prisma.server";
import { requireUserId } from "~/lib/session.server";
import { createHash } from "~/utils/encryption";
import { UserRole } from "~/utils/enums";
import { useFetcherCallback } from "~/utils/hooks/use-fetcher-callback";
import { type inferErrors, validateAction } from "~/utils/validation";
import { DoctorSchema } from "~/utils/zod.schema";

type ActionData = {
  success: boolean;
  fieldErrors?: inferErrors<typeof DoctorSchema>;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  await requireUserId(request);
  const { fieldErrors, fields } = await validateAction(request, DoctorSchema);

  if (fieldErrors) {
    return jsonWithError({ fieldErrors, success: false }, "Please correct the errors");
  }

  const doctorWithEmail = await db.user.findUnique({
    where: { email: fields.email },
  });

  if (doctorWithEmail) {
    return jsonWithError(
      { fieldErrors: { email: "Email already exists" }, success: false },
      "Email already exists",
    );
  }

  await db.user.create({
    data: {
      ...fields,
      dob: new Date(fields.dob),
      password: await createHash(fields.password),
      role: UserRole.HEALTHCARE_PROFESSIONAL,
    },
  });

  return redirectWithSuccess("/admin/doctors", "Doctor added successfully");
};

export default function NewDoctor() {
  const fetcher = useFetcherCallback<ActionData>();

  return (
    <Card className="mx-auto max-w-screen-xl mt-10">
      <CardContent className="p-6">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div className="max-sm:w-full sm:flex-1">
            <PageHeading title="New Doctor" />
          </div>
        </div>

        <fetcher.Form method="post" id="new-doctor-form">
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="specialty">Specialty</Label>
                <Select name="specialty">
                  <SelectTrigger>
                    <SelectValue placeholder="Select specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cardiology">Cardiology</SelectItem>
                    <SelectItem value="dermatology">Dermatology</SelectItem>
                    <SelectItem value="neurology">Neurology</SelectItem>
                    <SelectItem value="pediatrics">Pediatrics</SelectItem>
                    <SelectItem value="psychiatry">Psychiatry</SelectItem>
                  </SelectContent>
                </Select>
                {fetcher.data?.fieldErrors?.specialty && (
                  <p className="text-sm text-destructive">{fetcher.data.fieldErrors.specialty}</p>
                )}
              </div>
              <div>
                <Label htmlFor="phoneNo">Phone Number</Label>
                <Input
                  id="phoneNo"
                  name="phoneNo"
                  placeholder="Enter phone number"
                  aria-invalid={!!fetcher.data?.fieldErrors?.phoneNo}
                />
                {fetcher.data?.fieldErrors?.phoneNo && (
                  <p className="text-sm text-destructive">{fetcher.data.fieldErrors.phoneNo}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  name="dob"
                  type="date"
                  aria-invalid={!!fetcher.data?.fieldErrors?.dob}
                />
                {fetcher.data?.fieldErrors?.dob && (
                  <p className="text-sm text-destructive">{fetcher.data.fieldErrors.dob}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <Label>Address</Label>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  name="street"
                  placeholder="Street"
                  aria-invalid={!!fetcher.data?.fieldErrors?.street}
                />
                <Input
                  name="city"
                  placeholder="City"
                  aria-invalid={!!fetcher.data?.fieldErrors?.city}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  name="state"
                  placeholder="State"
                  aria-invalid={!!fetcher.data?.fieldErrors?.state}
                />
                <Input
                  name="zip"
                  placeholder="ZIP"
                  aria-invalid={!!fetcher.data?.fieldErrors?.zip}
                />
              </div>
            </div>

            <div className="flex gap-4 items-center justify-end">
              <Button variant="outline" asChild>
                <Link to="/admin/doctors">Cancel</Link>
              </Button>
              <Button
                type="submit"
                form="new-doctor-form"
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
