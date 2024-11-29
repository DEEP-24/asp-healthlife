import { json } from "@remix-run/node";
import { redirectWithSuccess } from "remix-toast";
import { db } from "~/lib/prisma.server";

export const action = async ({ params }: { params: { id: string } }) => {
  const { id } = params;

  try {
    await db.user.delete({
      where: { id },
    });

    return redirectWithSuccess("/admin/users", "User deleted successfully");
  } catch (error) {
    console.error("Failed to delete user:", error);
    return json({ error: "Failed to delete user" }, { status: 500 });
  }
};
