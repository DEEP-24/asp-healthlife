import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card";
import { format } from "date-fns";
import { ArrowLeftIcon, CalendarIcon, Clock, HeartPulse, Salad, User } from "lucide-react";
import PageHeading from "~/components/page-heading";
import { db } from "~/lib/prisma.server";
import { requireUserId } from "~/lib/session.server";
import { AppointmentStatus } from "~/utils/enums";
import { cn } from "~/utils/misc";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const { appointmentId } = params;

  const appointment = await db.appointment.findUnique({
    where: {
      id: appointmentId,
      patientId: userId,
    },
    include: {
      doctor: {
        select: {
          firstName: true,
          lastName: true,
          specialty: true,
          email: true,
          phoneNo: true,
        },
      },
      mealPlan: {
        include: {
          meal: true,
        },
      },
      healthMetrics: true,
    },
  });

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  return json({ appointment });
};

export default function AppointmentDetailsPage() {
  const { appointment } = useLoaderData<typeof loader>();

  return (
    <div className="container mx-auto py-8 px-4">
      <PageHeading title="Appointment Details" />
      <div>
        <Link
          to="/appointments"
          className="hover:underline flex items-center gap-1 mb-4 text-sm text-muted-foreground w-fit"
        >
          <ArrowLeftIcon className="h-2.5 w-2.5" />
          <span>Back</span>
        </Link>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Appointment Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between px-4">
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
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    {
                      "bg-green-100 text-green-800":
                        appointment.status === AppointmentStatus.COMPLETED,
                      "bg-yellow-100 text-yellow-800":
                        appointment.status === AppointmentStatus.PENDING,
                      "bg-blue-100 text-blue-800":
                        appointment.status === AppointmentStatus.SCHEDULED,
                      "bg-red-100 text-red-800": appointment.status === AppointmentStatus.CANCELLED,
                    },
                  )}
                >
                  {appointment.status}
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium">Doctor Information</h3>
                </div>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name</span>
                    <p>
                      Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Specialty</span>
                    <p>{appointment.doctor.specialty}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email</span>
                    <p>{appointment.doctor.email}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone</span>
                    <p>{appointment.doctor.phoneNo}</p>
                  </div>
                </div>
              </div>

              {appointment.notes && (
                <div className="border rounded-lg p-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">Appointment Notes</h3>
                    <p className="text-sm text-muted-foreground">{appointment.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {appointment.mealPlan && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Salad className="h-5 w-5 text-green-600" />
                <CardTitle>Prescribed Meal Plan</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {appointment.mealPlan.meal.map((meal) => (
                  <div key={meal.id} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <h3 className="font-medium text-lg">{meal.type}</h3>
                      <span className="text-sm text-muted-foreground">({meal.name})</span>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Calories</span>
                          <p className="font-medium">{meal.calories} cal</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Protein</span>
                          <p className="font-medium">{meal.protein}g</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Carbs</span>
                          <p className="font-medium">{meal.carbs}g</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Fats</span>
                          <p className="font-medium">{meal.fats}g</p>
                        </div>
                      </div>

                      <div>
                        <span className="text-muted-foreground block mb-2">Suggested Foods</span>
                        <div className="text-sm space-y-1">
                          {meal.foods.map((food, index) => (
                            // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                            <div key={index} className="text-sm">
                              • {food}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {appointment.healthMetrics.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <HeartPulse className="h-5 w-5 text-red-600" />
                <CardTitle>Health Metrics</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {appointment.healthMetrics.map((metric) => (
                  <div key={metric.id} className="border rounded-lg p-4">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Water Intake Goal</span>
                        <p className="font-medium">{metric.waterIntake}L per day</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Calorie Goal</span>
                        <p className="font-medium">{metric.calories} cal per day</p>
                      </div>
                      {metric.notes && (
                        <div>
                          <span className="text-muted-foreground">Notes</span>
                          <p className="mt-1">{metric.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
