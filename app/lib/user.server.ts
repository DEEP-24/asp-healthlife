import type { SerializeFrom } from "@remix-run/node";

import { db } from "~/lib/prisma.server";
import { UserRole } from "~/utils/enums";

export const getAllUsers = async () => {
	return db.user.findMany({
		where: {
			role: UserRole.USER,
		},
		orderBy: {
			createdAt: "desc",
		},
	});
};

export type GetAllUsers = SerializeFrom<typeof getAllUsers>;
