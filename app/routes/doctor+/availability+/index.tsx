import { type LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { requireUser } from "~/lib/session.server";

import { Link } from "@remix-run/react";
import { Badge } from "components/ui/badge";
import { Button } from "components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "components/ui/table";
import { format } from "date-fns";
import { PencilIcon } from "lucide-react";
import PageHeading from "~/components/page-heading";
import { db } from "~/lib/prisma.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);

  const availability = await db.doctorAvailability.findMany({
    where: {
      doctorId: user.id,
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return json({ availability });
}

const getDayName = (dayOfWeek: number) => {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[dayOfWeek];
};

export default function DoctorAvailability() {
  const { availability } = useLoaderData<typeof loader>();

  return (
    <div className="container mx-auto py-8">
      <PageHeading title="Availability" />
      <div className="flex justify-end items-center mb-6">
        <Button className="bg-green-100 hover:bg-green-200 text-black hover:text-green-900">
          <PencilIcon className="w-4 h-4 mr-1" />
          <Link to="/doctor/availability/edit">Edit Availability</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Weekly Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Day</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {availability.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No availability slots set up yet
                  </TableCell>
                </TableRow>
              ) : (
                availability.map((slot) => (
                  <TableRow key={slot.id}>
                    <TableCell className="font-medium">{getDayName(slot.dayOfWeek)}</TableCell>
                    <TableCell>{format(new Date(slot.startTime), "hh:mm a")}</TableCell>
                    <TableCell>{format(new Date(slot.endTime), "hh:mm a")}</TableCell>
                    <TableCell>
                      <Badge
                        variant="default"
                        className={
                          slot.isAvailable
                            ? "bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800"
                            : "bg-red-100 text-red-800 hover:bg-red-100 hover:text-red-800"
                        }
                      >
                        {slot.isAvailable ? "Available" : "Unavailable"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
