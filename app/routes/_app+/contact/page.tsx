import type { ActionFunctionArgs } from "@remix-run/node";
import { json, useFetcher, useLoaderData } from "@remix-run/react";
import { Avatar, AvatarFallback } from "components/ui/avatar";
import { Button } from "components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "components/ui/dialog";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { CalendarPlusIcon, Mail, MapPin, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { jsonWithError, jsonWithSuccess } from "remix-toast";
import PageHeading from "~/components/page-heading";
import { db } from "~/lib/prisma.server";
import { requireUserId } from "~/lib/session.server";
import { AppointmentStatus, UserRole } from "~/utils/enums";
import { getInitials } from "~/utils/misc";
import { type inferErrors, validateAction } from "~/utils/validation";
import { AppointmentSchema } from "~/utils/zod.schema";

type ActionData = {
  success: boolean;
  fieldErrors?: inferErrors<typeof AppointmentSchema>;
};

type Dietician = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNo: string;
  street: string;
  city: string;
  state: string;
  zip: string;
};

export const loader = async () => {
  const dieticians = await db.user.findMany({
    where: {
      role: UserRole.DOCTOR,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phoneNo: true,
      street: true,
      city: true,
      state: true,
      zip: true,
    },
  });

  return json({ dieticians });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);
  const { fieldErrors, fields } = await validateAction(request, AppointmentSchema);

  if (fieldErrors) {
    return jsonWithError({ fieldErrors, success: false }, "Please correct the errors");
  }

  const { doctorId, date, startTime, endTime } = fields;

  await db.appointment.create({
    data: {
      date: new Date(`${date}T${startTime}`),
      startTime: new Date(`${date}T${startTime}`),
      endTime: new Date(`${date}T${endTime}`),
      patientId: userId,
      doctorId,
      status: AppointmentStatus.PENDING,
      notes: "",
    },
  });

  return jsonWithSuccess({ success: true }, "Appointment booked successfully");
};

export default function ContactPage() {
  const { dieticians } = useLoaderData<typeof loader>();
  const [selectedDietician, setSelectedDietician] = useState<Dietician | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetcher = useFetcher<ActionData>();
  const isSubmitting = fetcher.state !== "idle";

  useEffect(() => {
    if (fetcher.data?.success) {
      setIsDialogOpen(false);
    }
  }, [fetcher.data]);

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeading title="Contact Our Dieticians" />
      {dieticians.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-5">
          {dieticians.map((dietician) => (
            <Card key={dietician.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-[#0b5c11] text-white">
                        {getInitials(`${dietician.firstName} ${dietician.lastName}`)}
                      </AvatarFallback>
                    </Avatar>
                    {dietician.firstName} {dietician.lastName}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="space-y-2">
                  <p className="flex items-center text-sm gap-3">
                    <Mail className="h-4 w-4" />
                    {dietician.email}
                  </p>
                  <p className="flex items-center text-sm gap-3">
                    <Phone className="h-4 w-4" />
                    {dietician.phoneNo}
                  </p>
                  <div className="flex items-start text-sm gap-3">
                    <MapPin className="h-4 w-4 mt-1" />
                    <address className="not-italic">
                      {dietician.street}
                      <br />
                      {dietician.city}, {dietician.state} {dietician.zip}
                    </address>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className="w-full bg-green-100 hover:bg-green-200 text-green-900 hover:text-black"
                      onClick={() => {
                        setSelectedDietician(dietician);
                        setIsDialogOpen(true);
                      }}
                    >
                      <CalendarPlusIcon className="mr-2 h-4 w-4" /> Book Appointment
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        Book Appointment with {dietician.firstName} {dietician.lastName}
                      </DialogTitle>
                    </DialogHeader>
                    <fetcher.Form method="post" className="space-y-4">
                      <input type="hidden" name="doctorId" value={selectedDietician?.id} />
                      <div>
                        <Label htmlFor="date">Date</Label>
                        <Input type="date" id="date" name="date" required />
                        <span className="text-red-500 text-xs">
                          {fetcher.data?.fieldErrors?.date}
                        </span>
                      </div>
                      <div>
                        <Label htmlFor="startTime">Start Time</Label>
                        <Input type="time" id="startTime" name="startTime" required />
                        <span className="text-red-500 text-xs">
                          {fetcher.data?.fieldErrors?.startTime}
                        </span>
                      </div>
                      <div>
                        <Label htmlFor="endTime">End Time</Label>
                        <Input type="time" id="endTime" name="endTime" required />
                        <span className="text-red-500 text-xs">
                          {fetcher.data?.fieldErrors?.endTime}
                        </span>
                      </div>
                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? "Booking..." : "Book Appointment"}
                      </Button>
                    </fetcher.Form>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground">No dieticians found</div>
      )}
    </div>
  );
}
