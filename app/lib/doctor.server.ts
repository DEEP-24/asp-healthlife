import { db } from "~/lib/prisma.server";
import { UserRole } from "~/utils/enums";

export async function getDoctors() {
  const doctors = await db.user.findMany({
    where: {
      role: UserRole.HEALTHCARE_PROFESSIONAL,
    },
  });
  return doctors;
}
