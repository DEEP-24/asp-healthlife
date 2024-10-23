import type { User } from "@prisma/client";
import bcrypt from "bcryptjs";

import { db } from "~/lib/prisma.server";
import type { UserRole } from "~/utils/enums";

export async function getUserById(id: User["id"]) {
  return db.user.findUnique({
    select: {
      email: true,
      id: true,
      firstName: true,
      lastName: true,
      role: true,
    },
    where: { id },
  });
}

export async function verifyLogin(email: User["email"], password: string, role: UserRole) {
  const userWithPassword = await db.user.findUnique({
    where: { email, role },
  });

  if (!userWithPassword || !userWithPassword.password) {
    return null;
  }

  const isValid = await bcrypt.compare(password, userWithPassword.password);

  if (!isValid) {
    return null;
  }

  const { password: _password, ...userWithoutPassword } = userWithPassword;

  return userWithoutPassword;
}
