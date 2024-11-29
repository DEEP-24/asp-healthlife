import { db } from "~/lib/prisma.server";

export const getAppointmentsByDoctorId = async (userId: string) => {
  return db.appointment.findMany({
    where: {
      doctorId: userId,
    },
    include: {
      patient: true,
      doctor: true,
      questionnaire: {
        include: {
          questions: true,
        },
      },
    },
  });
};

export const getAllAppointments = async () => {
  return db.appointment.findMany({});
};
