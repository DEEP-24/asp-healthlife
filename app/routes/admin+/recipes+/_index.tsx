import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { Avatar, AvatarImage } from "components/ui/avatar";
import { Separator } from "components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "components/ui/table";
import PageHeading from "~/components/page-heading";
import { getRecipes } from "~/lib/recipe.server";
import { formatCurrency } from "~/utils/misc";
import { Button } from "components/ui/button";
import { Card, CardContent } from "components/ui/card";
import { PlusIcon, PencilIcon, TrashIcon } from "lucide-react";

export const loader = async () => {
  const recipes = await getRecipes();

  return json({ recipes });
};

export default function AdminRecipes() {
  const { recipes } = useLoaderData<typeof loader>();

  return (
    <>
      <PageHeading title="Recipes" />
      <div className="flex items-center justify-end mt-5 pr-10">
        <Link to="/admin/recipes/new">
          <Button className="bg-green-100 hover:bg-green-200 text-black hover:text-green-900">
            <PlusIcon className="w-4 h-4 mr-1" />
            <Link to="/admin/recipes/new">Add Recipe</Link>
          </Button>
        </Link>
      </div>

      {recipes.length > 0 ? (
        <Card className="mt-10 mx-auto max-w-screen-xl">
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="font-bold">
                  <TableHead>Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Cooking Time</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipes.map((recipe) => (
                  <TableRow key={recipe.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={recipe.image} alt={recipe.title} />
                        </Avatar>
                        <span>{recipe.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(recipe.price)}</TableCell>
                    <TableCell>{recipe.cookingTime}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Link to={`/admin/recipes/${recipe.id}/view`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                        <Link to={`/admin/recipes/${recipe.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <PencilIcon className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        <Link to={`/admin/recipes/${recipe.id}/delete`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                          >
                            <TrashIcon className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-8">
          <Separator className="my-4" />
          <div className="flex items-center justify-center py-6">
            <div className="space-y-1.5 text-center">
              <h2 className="text-lg font-semibold">You don't have any recipes yet!</h2>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
