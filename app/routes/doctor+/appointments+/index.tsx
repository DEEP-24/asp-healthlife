import type { LoaderFunctionArgs } from "@remix-run/node";
import { json, Link, useLoaderData } from "@remix-run/react";
import { Button } from "components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card";
import { Calendar, Clock, EyeIcon, User } from "lucide-react";
import PageHeading from "~/components/page-heading";
import { getAppointments } from "~/lib/appointment.server";
import { requireUserId } from "~/lib/session.server";

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
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Link to={`/doctor/appointments/${appointment.id}`}>
                  <Button className="w-full bg-green-100 hover:bg-green-200 text-green-800">
                    <EyeIcon className="h-4 w-4" />
                    View
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
