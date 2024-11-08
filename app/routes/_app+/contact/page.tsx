import type { ActionFunctionArgs } from "@remix-run/node";
import { json, useFetcher, useLoaderData } from "@remix-run/react";
import { Alert, AlertDescription } from "components/ui/alert";
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
import { addDays, format, parse, setHours, setMinutes } from "date-fns";
import { CalendarPlusIcon, Mail, MapPin, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { jsonWithSuccess } from "remix-toast";
import PageHeading from "~/components/page-heading";
import { getAllAppointments } from "~/lib/appointment.server";
import { db } from "~/lib/prisma.server";
import { requireUserId } from "~/lib/session.server";
import { AppointmentStatus, UserRole } from "~/utils/enums";
import { cn, getInitials } from "~/utils/misc";
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
  availability: {
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
  }[];
};

type DoctorAvailability = {
  id: string;
  dayOfWeek: number;
  startTime: Date;
  endTime: Date;
  isAvailable: boolean;
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
      availability: {
        select: {
          id: true,
          dayOfWeek: true,
          startTime: true,
          endTime: true,
          isAvailable: true,
        },
      },
    },
  });

  const appointments = await getAllAppointments();

  return json({ dieticians, appointments });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);
  const { fieldErrors, fields } = await validateAction(request, AppointmentSchema);

  if (fieldErrors) {
    return json({ fieldErrors, success: false });
  }

  const { doctorId, date, startTime, endTime } = fields;
  const doctorAvailability = await db.doctorAvailability.findMany({
    where: {
      doctorId,
      isAvailable: true,
    },
  });

  const appointmentDate = new Date(date);

  if (!isTimeWithinAvailability(appointmentDate, startTime, endTime, doctorAvailability)) {
    return json({
      fieldErrors: {
        startTime: "Selected time is outside doctor's availability",
      },
      success: false,
    });
  }

  const newAppointmentStart = new Date(`${date}T${startTime}`);
  const newAppointmentEnd = new Date(`${date}T${endTime}`);

  const conflictingAppointment = await db.appointment.findFirst({
    where: {
      doctorId,
      status: {
        not: AppointmentStatus.CANCELLED,
      },
      OR: [
        {
          AND: [
            { startTime: { lte: newAppointmentStart } },
            { endTime: { gt: newAppointmentStart } },
          ],
        },
        {
          AND: [{ startTime: { lt: newAppointmentEnd } }, { endTime: { gte: newAppointmentEnd } }],
        },
        {
          AND: [
            { startTime: { gte: newAppointmentStart } },
            { endTime: { lte: newAppointmentEnd } },
          ],
        },
      ],
    },
  });

  if (conflictingAppointment) {
    return json({
      fieldErrors: {
        startTime: "This time slot is already booked with another patient",
      },
      success: false,
    });
  }

  await db.appointment.create({
    data: {
      date: newAppointmentStart,
      startTime: newAppointmentStart,
      endTime: newAppointmentEnd,
      patientId: userId,
      doctorId,
      status: AppointmentStatus.PENDING,
      notes: "",
    },
  });

  return jsonWithSuccess({ success: true }, "Appointment booked successfully");
};

function parseTimeString(timeStr: string) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const date = new Date();
  return setMinutes(setHours(date, hours), minutes);
}

function isTimeWithinAvailability(
  date: Date,
  startTime: string,
  endTime: string,
  availability: DoctorAvailability[],
) {
  const dayOfWeek = date.getDay();
  const doctorAvailability = availability.find((a) => a.dayOfWeek === dayOfWeek && a.isAvailable);

  if (!doctorAvailability) {
    return false;
  }

  const appointmentStart = parseTimeString(startTime);
  const appointmentEnd = parseTimeString(endTime);
  const availabilityStart = new Date(doctorAvailability.startTime);
  const availabilityEnd = new Date(doctorAvailability.endTime);

  return (
    appointmentStart.getTime() >= availabilityStart.getTime() &&
    appointmentEnd.getTime() <= availabilityEnd.getTime()
  );
}

function formatAvailabilityTime(time: string | Date) {
  if (!time) {
    return "";
  }
  try {
    if (time instanceof Date) {
      return format(time, "h:mm a");
    }

    if (typeof time === "string") {
      if (time.includes("T")) {
        return format(new Date(time), "h:mm a");
      }

      return format(parse(time, "HH:mm:ss", new Date()), "h:mm a");
    }

    return "";
  } catch (error) {
    console.error("Error formatting time:", error);
    return "";
  }
}

export default function ContactPage() {
  const { dieticians, appointments } = useLoaderData<typeof loader>();
  const [selectedDietician, setSelectedDietician] = useState<Dietician | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const fetcher = useFetcher<ActionData>();
  const isSubmitting = fetcher.state !== "idle";

  useEffect(() => {
    if (fetcher.data?.success) {
      setIsDialogOpen(false);
    }
  }, [fetcher.data]);

  const validateTimeSlot = (date: string, startTime: string, endTime: string) => {
    if (!date || !startTime || !endTime) {
      return;
    }

    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay();

    const availability = selectedDietician?.availability.find(
      (a) => a.dayOfWeek === dayOfWeek && a.isAvailable,
    );

    if (!availability) {
      setValidationError("Doctor is not available on this day");
      return false;
    }

    try {
      const newAppointmentStart = new Date(`${date}T${startTime}`);
      const newAppointmentEnd = new Date(`${date}T${endTime}`);

      const hasConflict = appointments.some((appointment) => {
        const existingStart = new Date(appointment.startTime);
        const existingEnd = new Date(appointment.endTime);

        if (existingStart.toDateString() === newAppointmentStart.toDateString()) {
          return (
            (newAppointmentStart >= existingStart && newAppointmentStart < existingEnd) ||
            (newAppointmentEnd > existingStart && newAppointmentEnd <= existingEnd) ||
            (newAppointmentStart <= existingStart && newAppointmentEnd >= existingEnd)
          );
        }
        return false;
      });

      if (hasConflict) {
        setValidationError("This time slot is already booked with another patient");
        return false;
      }

      const baseDate = new Date();
      const [startHour, startMinute] = startTime.split(":").map(Number);
      const [endHour, endMinute] = endTime.split(":").map(Number);
      const appointmentStart = setMinutes(setHours(baseDate, startHour), startMinute);
      const appointmentEnd = setMinutes(setHours(baseDate, endHour), endMinute);

      const [availStartHour, availStartMinute] = availability.startTime.split(":").map(Number);
      const [availEndHour, availEndMinute] = availability.endTime.split(":").map(Number);
      const availabilityStart = setMinutes(setHours(baseDate, availStartHour), availStartMinute);
      const availabilityEnd = setMinutes(setHours(baseDate, availEndHour), availEndMinute);

      if (appointmentStart < availabilityStart || appointmentEnd > availabilityEnd) {
        setValidationError("Doctor is not available at this time");
        return false;
      }

      if (appointmentEnd <= appointmentStart) {
        setValidationError("End time must be after start time");
        return false;
      }

      setValidationError(null);
      return true;
    } catch (error) {
      console.error("Error validating time slot:", error);
      setValidationError("Invalid time format");
      return false;
    }
  };

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
                        setSelectedDietician(dietician as Dietician);
                        setIsDialogOpen(true);
                      }}
                    >
                      <CalendarPlusIcon className="mr-2 h-4 w-4" /> Book Appointment
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[800px]">
                    <DialogHeader>
                      <DialogTitle>
                        Book Appointment with {selectedDietician?.firstName}{" "}
                        {selectedDietician?.lastName}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="h-full flex flex-col border-r pr-6">
                        <fetcher.Form
                          method="post"
                          className="space-y-4 flex-1 flex flex-col"
                          onChange={(e) => {
                            const form = e.currentTarget;
                            const formData = new FormData(form);
                            const date = formData.get("date") as string;
                            const startTime = formData.get("startTime") as string;
                            const endTime = formData.get("endTime") as string;

                            setValidationError(null);

                            if (date && startTime && endTime) {
                              const selectedDate = new Date(date);
                              const dayOfWeek = selectedDate.getDay();
                              const availability = selectedDietician?.availability.find(
                                (a) => a.dayOfWeek === dayOfWeek && a.isAvailable,
                              );

                              if (!availability) {
                                setValidationError("Doctor is not available on this day");
                                return;
                              }

                              validateTimeSlot(date, startTime, endTime);
                            }
                          }}
                        >
                          <div className="flex-1 space-y-4">
                            <input type="hidden" name="doctorId" value={selectedDietician?.id} />
                            <div>
                              <Label htmlFor="date">Date</Label>
                              <Input
                                type="date"
                                id="date"
                                name="date"
                                min={format(new Date(), "yyyy-MM-dd")}
                                max={format(addDays(new Date(), 30), "yyyy-MM-dd")}
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="startTime">Start Time</Label>
                              <Input type="time" id="startTime" name="startTime" required />
                            </div>
                            <div>
                              <Label htmlFor="endTime">End Time</Label>
                              <Input type="time" id="endTime" name="endTime" required />
                            </div>

                            {(validationError || fetcher.data?.fieldErrors) && (
                              <Alert variant="destructive" className="mt-2">
                                <AlertDescription>
                                  {validationError || fetcher.data?.fieldErrors?.startTime}
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>

                          <Button
                            type="submit"
                            disabled={isSubmitting || !!validationError}
                            className="bg-green-100 hover:bg-green-200 text-green-900 hover:text-black w-full mt-auto"
                          >
                            {isSubmitting ? "Booking..." : "Book Appointment"}
                          </Button>
                        </fetcher.Form>
                      </div>

                      <div className="pl-6">
                        <h3 className="font-medium mb-3 text-base">Doctor's Availability</h3>
                        <div className="space-y-1.5">
                          {selectedDietician?.availability &&
                          selectedDietician.availability.length > 0 ? (
                            [0, 1, 2, 3, 4, 5, 6].map((day) => {
                              const dayAvailability = selectedDietician.availability.find(
                                (a) => a.dayOfWeek === day && a.isAvailable,
                              );

                              return (
                                <div
                                  key={day}
                                  className={cn(
                                    "p-2 rounded-lg transition-colors flex items-center justify-between",
                                    dayAvailability
                                      ? "bg-green-50 border border-green-100"
                                      : "bg-gray-50 border border-gray-100",
                                  )}
                                >
                                  <div className="text-sm font-medium">
                                    {format(new Date(2024, 0, day + 1), "EEEE")}
                                  </div>
                                  <div
                                    className={cn(
                                      "flex items-center gap-1.5",
                                      dayAvailability ? "text-green-700" : "text-gray-500",
                                    )}
                                  >
                                    <div
                                      className="w-1.5 h-1.5 rounded-full shrink-0"
                                      style={{
                                        backgroundColor: dayAvailability ? "#22c55e" : "#9ca3af",
                                      }}
                                    />
                                    {dayAvailability ? (
                                      <span className="text-xs">
                                        {formatAvailabilityTime(dayAvailability.startTime)} -{" "}
                                        {formatAvailabilityTime(dayAvailability.endTime)}
                                      </span>
                                    ) : (
                                      <span className="text-xs">Not available</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-xs text-muted-foreground p-3 bg-gray-50 rounded-lg border border-gray-100">
                              Doctor hasn't mentioned anything about their availability.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
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
