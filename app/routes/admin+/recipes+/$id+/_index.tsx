import { type LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { Button } from "components/ui/button";
import { Card, CardContent, CardTitle } from "components/ui/card";
import { ChevronLeftIcon } from "lucide-react";
import { getRecipe } from "~/lib/recipe.server";
import { requireUserId } from "~/lib/session.server";
import { formatDateTime } from "~/utils/misc";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const { id } = params;

  if (!id) {
    throw redirect("/admin/recipes");
  }

  const recipe = await getRecipe(id);

  if (!recipe) {
    throw redirect("/admin/recipes");
  }

  if (userId !== recipe.userId) {
    return redirect(`/admin/recipes/${id}/view`);
  }

  return json({
    recipe,
  });
};

export default function Recipe() {
  const { recipe } = useLoaderData<typeof loader>();

  return (
    <div className="space-y-8">
      <div className="max-lg:hidden">
        <Link
          className="inline-flex items-center gap-2 text-sm/6 text-zinc-500 dark:text-zinc-400"
          to="/admin/recipes"
        >
          <ChevronLeftIcon className="h-4 w-4 fill-zinc-400 dark:fill-zinc-500" />
          Recipes
        </Link>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-wrap items-center gap-6">
              <div className="w-32 shrink-0">
                <img alt="" className="aspect-[3/2] rounded-lg object-cover" src={recipe.image} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <CardTitle>{recipe.title}</CardTitle>
                </div>
                <div className="mt-2 text-sm/6 text-zinc-500">
                  {formatDateTime(new Date(recipe.createdAt))}
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <Button variant="outline" asChild>
                <Link to="edit">Edit</Link>
              </Button>
              <Button asChild>
                <Link to="view">View</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
