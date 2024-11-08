import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigation } from "@remix-run/react";
import { Alert, AlertDescription } from "components/ui/alert";
import { Button } from "components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card";
import { Label } from "components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "components/ui/tabs";
import { Textarea } from "components/ui/textarea";
import { format } from "date-fns";
import { CalendarIcon, Clock, User } from "lucide-react";
import { useEffect, useRef } from "react";
import { jsonWithSuccess } from "remix-toast";
import { db } from "~/lib/prisma.server";
import { requireUserId } from "~/lib/session.server";
import { AppointmentStatus } from "~/utils/enums";
import { cn } from "~/utils/misc";
import { validateAction } from "~/utils/validation";
import { z } from "zod";

const UpdateSchema = z.object({
  notes: z.string().min(1, "Notes are required"),
  mealPlan: z.string().min(1, "Meal plan is required"),
  status: z.enum([
    AppointmentStatus.COMPLETED,
    AppointmentStatus.PENDING,
    AppointmentStatus.CANCELLED,
  ]),
});

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { appointmentId } = params;

  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phoneNo: true,
        },
      },
      mealPlan: true,
    },
  });

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  return json({ appointment });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { appointmentId } = params;
  const { fields, fieldErrors } = await validateAction(request, UpdateSchema);

  if (fieldErrors) {
    return json({ fieldErrors }, { status: 400 });
  }

  await db.appointment.update({
    where: { id: appointmentId },
    data: {
      notes: fields?.notes,
      status: fields?.status,
      mealPlan: {
        upsert: {
          create: {
            plan: fields.mealPlan,
          },
          update: {
            plan: fields.mealPlan,
          },
        },
      },
    },
  });

  return jsonWithSuccess({ success: true }, "Appointment updated successfully");
};

export default function AppointmentView() {
  const { appointment } = useLoaderData<typeof loader>();
  const formRef = useRef<HTMLFormElement>(null);
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  useEffect(() => {
    if (navigation.state === "idle" && formRef.current) {
      formRef.current.reset();
    }
  }, [navigation.state]);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Appointment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Date: {format(new Date(appointment.date), "PPP")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Time: {format(new Date(appointment.startTime), "h:mm a")} -{" "}
                    {format(new Date(appointment.endTime), "h:mm a")}
                  </span>
                </div>
                <div
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    {
                      "bg-green-100 text-green-800":
                        appointment.status === AppointmentStatus.COMPLETED,
                      "bg-yellow-100 text-yellow-800":
                        appointment.status === AppointmentStatus.PENDING,
                      "bg-red-100 text-red-800": appointment.status === AppointmentStatus.CANCELLED,
                    },
                  )}
                >
                  {appointment.status}
                </div>
              </div>

              <div className="border rounded-lg p-4 mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium">Patient Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Name</Label>
                    <p>
                      {appointment.patient.firstName} {appointment.patient.lastName}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p>{appointment.patient.email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <p>{appointment.patient.phoneNo}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="notes" className="w-full">
          <TabsList>
            <TabsTrigger value="notes">Notes & Status</TabsTrigger>
            <TabsTrigger value="mealplan">Meal Plan</TabsTrigger>
          </TabsList>

          <TabsContent value="notes" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <form ref={formRef} method="post" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="notes">Appointment Notes</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      placeholder="Enter appointment notes..."
                      defaultValue={appointment.notes || ""}
                      className="min-h-[150px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      name="status"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      defaultValue={appointment.status}
                    >
                      <option value={AppointmentStatus.PENDING}>Pending</option>
                      <option value={AppointmentStatus.COMPLETED}>Completed</option>
                      <option value={AppointmentStatus.CANCELLED}>Cancelled</option>
                    </select>
                  </div>

                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mealplan">
            <Card>
              <CardContent className="pt-6">
                <form method="post" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mealPlan">Weekly Meal Plan</Label>
                    <Textarea
                      id="mealPlan"
                      name="mealPlan"
                      placeholder="Enter detailed meal plan with daily schedule, calories, water intake, etc..."
                      defaultValue={appointment.mealPlan?.plan || ""}
                      className="min-h-[400px]"
                    />
                    <p className="text-sm text-muted-foreground">
                      Include daily schedule with food items, water intake goals, calorie counts,
                      and special suggestions.
                    </p>
                  </div>

                  <input type="hidden" name="notes" value={appointment.notes || ""} />
                  <input type="hidden" name="status" value={appointment.status} />

                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Meal Plan"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
