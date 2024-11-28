import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { Button } from "components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card";
import { format } from "date-fns";
import { CalendarIcon, Clock, User } from "lucide-react";
import PageHeading from "~/components/page-heading";
import { db } from "~/lib/prisma.server";
import { requireUserId } from "~/lib/session.server";
import { AppointmentStatus } from "~/utils/enums";
import { cn } from "~/utils/misc";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);

  const appointments = await db.appointment.findMany({
    where: {
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
    },
    orderBy: {
      date: "desc",
    },
  });

  return json({ appointments });
};

export default function AppointmentsPage() {
  const { appointments } = useLoaderData<typeof loader>();

  return (
    <div className="container mx-auto py-8 px-4">
      <PageHeading title="My Appointments" />

      <div className="grid gap-6">
        {appointments.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <p>You don't have any appointments yet.</p>
                <Link to="/book-appointment">
                  <Button className="mt-4">Book an Appointment</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          appointments.map((appointment) => (
            <Card key={appointment.id}>
              <CardHeader>
                <CardTitle>
                  Appointment with {appointment.doctor.firstName} {appointment.doctor.lastName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Date: {format(new Date(appointment.date), "PPP")}
                      </span>
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
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold w-fit",
                        {
                          "bg-green-100 text-green-800":
                            appointment.status === AppointmentStatus.COMPLETED,
                          "bg-yellow-100 text-yellow-800":
                            appointment.status === AppointmentStatus.PENDING,
                          "bg-blue-100 text-blue-800":
                            appointment.status === AppointmentStatus.SCHEDULED,
                          "bg-red-100 text-red-800":
                            appointment.status === AppointmentStatus.CANCELLED,
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
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

                  <div className="flex justify-end">
                    <Link to={`/appointments/${appointment.id}`}>
                      <Button className="bg-green-100 hover:bg-green-200 text-green-800">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
