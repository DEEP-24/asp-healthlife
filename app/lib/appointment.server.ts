import { db } from "~/lib/prisma.server";

export const getAppointments = async (userId: string) => {
  return db.appointment.findMany({
    where: {
      doctorId: userId,
    },
    include: {
      patient: true,
      doctor: true,
    },
  });
};
