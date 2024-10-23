import { json, redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { Badge } from "components/ui/badge";
import { Button } from "components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "components/ui/card";
import { ScrollArea } from "components/ui/scroll-area";
import { Separator } from "components/ui/separator";
import PageHeading from "~/components/page-heading";
import { getRecipe } from "~/lib/recipe.server";
import { formatDateTime } from "~/utils/misc";

export const loader = async ({ params }: { params: { id: string } }) => {
  const recipe = await getRecipe(params.id);

  if (!recipe) {
    throw redirect("/recipes");
  }

  return json({
    recipe,
  });
};

export default function ViewRecipe() {
  const { recipe } = useLoaderData<typeof loader>();

  return (
    <>
      <PageHeading title={recipe.title} />
      <ScrollArea className="h-full">
        <div className="container py-10">
          <div className="mb-4">
            <Button variant="outline" asChild>
              <Link to="/admin/recipes">← Back to Recipes</Link>
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>{recipe.title}</CardTitle>
              <CardDescription>{recipe.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {recipe.image && (
                <div className="mb-8">
                  <img
                    src={recipe.image}
                    alt={recipe.title}
                    className="w-full max-h-96 object-cover rounded-lg"
                  />
                </div>
              )}
              <div className="mt-12 grid gap-8 md:grid-cols-6">
                <div className="col-span-1 md:col-span-2">
                  <h3 className="text-lg font-semibold">Summary</h3>
                  <Separator className="my-4" />
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt>Cooking Time</dt>
                      <dd>{recipe.cookingTime}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Steps</dt>
                      <dd>{recipe.steps.length}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Ingredients</dt>
                      <dd>{recipe._count.ingredients}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Last Updated</dt>
                      <dd>{formatDateTime(new Date(recipe.updatedAt))}</dd>
                    </div>
                  </dl>
                </div>

                <div className="col-span-1 space-y-8 md:col-span-4">
                  <div>
                    <h3 className="text-lg font-semibold">Ingredients</h3>
                    <Separator className="my-4" />
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      {recipe.ingredients.map((ingredient) => (
                        <div key={ingredient.id} className="flex items-center gap-2">
                          <span>{ingredient.name}</span>
                          <Badge variant="secondary">{ingredient.quantity}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold">Steps</h3>
                    <Separator className="my-4" />
                    <ol className="list-decimal pl-4 space-y-2">
                      {recipe.steps.map((step) => (
                        <li key={step.order}>{step.content}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </>
  );
}
