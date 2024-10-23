import { json, redirect } from "@remix-run/node";
import { redirectWithSuccess } from "remix-toast";
import { db } from "~/lib/prisma.server";

export const action = async ({ params }: { params: { id: string } }) => {
  const { id } = params;

  try {
    await db.recipes.delete({
      where: { id },
    });

    return redirectWithSuccess("/admin/recipes", "Recipe deleted successfully");
  } catch (error) {
    console.error("Failed to delete recipe:", error);
    return json({ error: "Failed to delete recipe" }, { status: 500 });
  }
};
