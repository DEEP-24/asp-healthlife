import { type ActionFunctionArgs, type LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { Button } from "components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Switch } from "components/ui/switch";
import { format } from "date-fns";
import { z } from "zod";
import PageHeading from "~/components/page-heading";
import { db } from "~/lib/prisma.server";
import { requireUser } from "~/lib/session.server";
import { validateAction } from "~/utils/validation";

const schema = z.object({
  "startTime-0": z.string(),
  "endTime-0": z.string(),
  "isAvailable-0": z.string().optional(),
  "startTime-1": z.string(),
  "endTime-1": z.string(),
  "isAvailable-1": z.string().optional(),
  "startTime-2": z.string(),
  "endTime-2": z.string(),
  "isAvailable-2": z.string().optional(),
  "startTime-3": z.string(),
  "endTime-3": z.string(),
  "isAvailable-3": z.string().optional(),
  "startTime-4": z.string(),
  "endTime-4": z.string(),
  "isAvailable-4": z.string().optional(),
  "startTime-5": z.string(),
  "endTime-5": z.string(),
  "isAvailable-5": z.string().optional(),
  "startTime-6": z.string(),
  "endTime-6": z.string(),
  "isAvailable-6": z.string().optional(),
});

type ActionFields = z.infer<typeof schema>;

interface DoctorAvailability {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const availability = await db.doctorAvailability.findMany({
    where: {
      doctorId: user.id,
    },
    orderBy: {
      dayOfWeek: "asc",
    },
  });

  return json({ availability });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);

  const { fieldErrors, fields } = await validateAction(request, schema);

  if (fieldErrors) {
    return json({ errors: fieldErrors }, { status: 400 });
  }

  try {
    for (let i = 0; i < 7; i++) {
      const startTimeKey = `startTime-${i}` as keyof ActionFields;
      const endTimeKey = `endTime-${i}` as keyof ActionFields;
      const isAvailableKey = `isAvailable-${i}` as keyof ActionFields;

      const startTime = fields[startTimeKey];
      const endTime = fields[endTimeKey];
      const isAvailable = fields[isAvailableKey] === "on";

      if (!startTime || !endTime) {
        continue;
      }

      const [startHour, startMinute] = startTime.split(":").map(Number);
      const [endHour, endMinute] = endTime.split(":").map(Number);

      const baseDate = new Date();
      const startDateTime = new Date(baseDate.setHours(startHour, startMinute, 0));
      const endDateTime = new Date(baseDate.setHours(endHour, endMinute, 0));

      const existingAvailability = await db.doctorAvailability.findFirst({
        where: {
          doctorId: user.id,
          dayOfWeek: i,
        },
      });

      if (existingAvailability) {
        await db.doctorAvailability.update({
          where: {
            id: existingAvailability.id,
            dayOfWeek: i,
          },
          data: {
            startTime: startDateTime,
            endTime: endDateTime,
            isAvailable,
          },
        });
      } else if (startTime && endTime) {
        await db.doctorAvailability.create({
          data: {
            doctorId: user.id,
            dayOfWeek: i,
            startTime: startDateTime,
            endTime: endDateTime,
            isAvailable,
          },
        });
      }
    }

    return redirect("/doctor/availability", {
      headers: {
        "Set-Cookie": "flash=Availability schedule updated successfully",
      },
    });
  } catch (error) {
    console.error(error);
    return json({ error: "Failed to update availability" }, { status: 500 });
  }
}

export default function EditAvailability() {
  const { availability } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  const isSubmitting = fetcher.state === "submitting";

  const weekDays = [
    { value: "0", label: "Sunday" },
    { value: "1", label: "Monday" },
    { value: "2", label: "Tuesday" },
    { value: "3", label: "Wednesday" },
    { value: "4", label: "Thursday" },
    { value: "5", label: "Friday" },
    { value: "6", label: "Saturday" },
  ];

  const availabilityMap = new Map<number, DoctorAvailability>();
  availability.forEach((avail: DoctorAvailability) => {
    availabilityMap.set(avail.dayOfWeek, avail);
  });

  return (
    <div className="container mx-auto py-8">
      <PageHeading title="Edit Availability" />

      <Card className="w-full mx-auto">
        <CardHeader>
          <CardTitle>Weekly Availability Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <fetcher.Form method="post" className="space-y-6">
            <div className="space-y-4">
              {weekDays.map((day) => (
                <div key={day.value} className="p-4 rounded-lg border border-gray-200">
                  <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0">
                    <div className="flex items-center space-x-4">
                      <Label className="text-lg font-semibold w-[100px]">{day.label}</Label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 mx-4">
                      <div className="space-y-2 w-[160px]">
                        <Label htmlFor={`startTime-${day.value}`}>Start Time</Label>
                        <Input
                          id={`startTime-${day.value}`}
                          type="time"
                          name={`startTime-${day.value}`}
                          defaultValue={
                            availabilityMap.get(Number(day.value))
                              ? format(
                                  new Date(availabilityMap.get(Number(day.value))?.startTime || ""),
                                  "HH:mm",
                                )
                              : "09:00"
                          }
                        />
                      </div>
                      <div className="space-y-2 w-[160px]">
                        <Label htmlFor={`endTime-${day.value}`}>End Time</Label>
                        <Input
                          id={`endTime-${day.value}`}
                          type="time"
                          name={`endTime-${day.value}`}
                          defaultValue={
                            availabilityMap.get(Number(day.value))
                              ? format(
                                  new Date(availabilityMap.get(Number(day.value))?.endTime || ""),
                                  "HH:mm",
                                )
                              : "17:00"
                          }
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 min-w-[140px] justify-end">
                      <Switch
                        name={`isAvailable-${day.value}`}
                        defaultChecked={availabilityMap.get(Number(day.value))?.isAvailable ?? true}
                      />
                      <Label>Available</Label>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                variant="outline"
                type="button"
                onClick={() => window.history.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-green-100 hover:bg-green-200 text-black hover:text-green-900"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </fetcher.Form>
        </CardContent>
      </Card>
    </div>
  );
}
