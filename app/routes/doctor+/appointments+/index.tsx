import type { LoaderFunctionArgs } from "@remix-run/node";
import { json, useLoaderData } from "@remix-run/react";
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card";
import PageHeading from "~/components/page-heading";
import { getAppointments } from "~/lib/appointment.server";
import { requireUserId } from "~/lib/session.server";
import { Calendar, Clock, User } from "lucide-react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);

  const appointments = await getAppointments(userId);

  return json({ appointments });
};

export default function Appointments() {
  const { appointments } = useLoaderData<typeof loader>();

  const formatTime = (date: string) => {
    return new Date(date)
      .toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      .toLowerCase();
  };

  return (
    <>
      <PageHeading title="Appointments" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8 px-6">
        {appointments.map((appointment) => (
          <Card key={appointment.id} className="overflow-hidden transition-shadow hover:shadow-lg">
            <CardHeader className="bg-primary/10 pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                {`${appointment.patient.firstName} ${appointment.patient.lastName}`}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2">
                <p className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="font-medium">Date:</span>
                  {new Date(appointment.date).toLocaleDateString()}
                </p>
                <p className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="font-medium">Time:</span>
                  {formatTime(appointment.startTime)} to {formatTime(appointment.endTime)}
                </p>
                {appointment.notes && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm font-medium">Notes:</p>
                    <p className="text-sm mt-1 text-gray-600">{appointment.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
