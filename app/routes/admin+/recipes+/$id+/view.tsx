import { json, redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { Badge } from "components/ui/badge";
import { Button } from "components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "components/ui/card";
import { ScrollArea } from "components/ui/scroll-area";
import type { LucideIcon } from "lucide-react";
import { Calendar, Clock, List, Utensils, DollarSign } from "lucide-react";
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
            <Link to="/recipes" className="text-green-900 hover:underline">
              ← Back to Recipes
            </Link>
          </div>
          <Card className="overflow-hidden shadow-lg">
            <CardHeader>
              <CardTitle>{recipe.title}</CardTitle>
              <CardDescription>{recipe.description}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {recipe.image && (
                <div className="mb-8">
                  <img
                    src={recipe.image}
                    alt={recipe.title}
                    className="w-full max-h-96 object-cover rounded-lg"
                  />
                </div>
              )}
              <div className="p-8">
                <div className="mt-8 grid gap-12 md:grid-cols-6">
                  <div className="col-span-1 md:col-span-2">
                    <h3 className="text-2xl font-semibold mb-6">Recipe Details</h3>
                    <div className="bg-secondary/10 rounded-lg p-6 space-y-4">
                      <DetailItem icon={Clock} label="Cooking Time" value={recipe.cookingTime} />
                      <DetailItem
                        icon={List}
                        label="Steps"
                        value={recipe.steps.length.toString()}
                      />
                      <DetailItem
                        icon={Utensils}
                        label="Ingredients"
                        value={recipe._count.ingredients.toString()}
                      />
                      <DetailItem
                        icon={Calendar}
                        label="Last Updated"
                        value={formatDateTime(new Date(recipe.updatedAt))}
                      />
                      <DetailItem
                        icon={DollarSign}
                        label="Price"
                        value={`$${recipe.price.toFixed(2)}`}
                      />
                    </div>
                  </div>

                  <div className="col-span-1 space-y-12 md:col-span-4">
                    <div>
                      <h3 className="text-2xl font-semibold mb-6">Ingredients</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {recipe.ingredients.map((ingredient) => (
                          <div
                            key={ingredient.id}
                            className="flex items-center justify-between bg-primary/5 rounded-lg p-3"
                          >
                            <span className="font-medium">{ingredient.name}</span>
                            <Badge variant="secondary">{ingredient.quantity}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-2xl font-semibold mb-6">Preparation Steps</h3>
                      <ol className="space-y-6">
                        {recipe.steps.map((step, index) => (
                          <li key={step.order} className="flex">
                            <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary text-primary-foreground rounded-full mr-4">
                              {index + 1}
                            </span>
                            <p className="mt-1">{step.content}</p>
                          </li>
                        ))}
                      </ol>
                    </div>
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

function DetailItem({
  icon: Icon,
  label,
  value,
}: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center space-x-3">
      <Icon className="w-5 h-5 text-primary" />
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}
