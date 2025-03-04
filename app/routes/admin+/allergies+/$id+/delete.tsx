import { json } from "@remix-run/node";
import { redirectWithSuccess } from "remix-toast";
import { db } from "~/lib/prisma.server";

export const action = async ({ params }: { params: { id: string } }) => {
  const { id } = params;

  try {
    await db.allergy.delete({
      where: { id },
    });

    return redirectWithSuccess("/admin/allergies", "Allergy deleted successfully");
  } catch (error) {
    console.error("Failed to delete allergy:", error);
    return json({ error: "Failed to delete allergy" }, { status: 500 });
  }
};
