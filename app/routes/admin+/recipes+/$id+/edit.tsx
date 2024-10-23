import { type ActionFunctionArgs, type LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { Link, useLoaderData, useParams } from "@remix-run/react";
import { Badge } from "components/ui/badge";
import { Button } from "components/ui/button";
import { Card, CardContent } from "components/ui/card";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";
import { Separator } from "components/ui/separator";
import { Textarea } from "components/ui/textarea";
import { Reorder } from "framer-motion";
import _ from "lodash";
import { CloudUploadIcon, GripVerticalIcon, PencilIcon, TrashIcon, XIcon } from "lucide-react";
import * as React from "react";
import { jsonWithError, redirectWithSuccess } from "remix-toast";
import { toast } from "sonner";
import PageHeading from "~/components/page-heading";
import { db } from "~/lib/prisma.server";
import { getRecipe } from "~/lib/recipe.server";
import { requireUserId } from "~/lib/session.server";
import { useFetcherCallback } from "~/utils/hooks/use-fetcher-callback";
import { cn } from "~/utils/misc";
import { type inferErrors, validateAction } from "~/utils/validation";
import { RecipeSchema, type SelectIngredient, type Step } from "~/utils/zod.schema";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { id } = params;
  if (!id) {
    throw redirect("/recipes");
  }

  const recipe = await getRecipe(id);
  if (!recipe) {
    throw redirect("/recipes");
  }

  return json({
    recipe,
  });
};

type ActionData = {
  success: boolean;
  fieldErrors?: inferErrors<typeof RecipeSchema>;
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { id: recipeId } = params;
  if (!recipeId) {
    throw redirect("/recipes");
  }

  const userId = await requireUserId(request);
  const { fieldErrors, fields } = await validateAction(request, RecipeSchema);

  if (fieldErrors) {
    return jsonWithError({ fieldErrors, success: false }, "Please correct the errors");
  }

  const { name, description, image, price, cookingTime, ingredients, steps } = fields;

  const updatedRecipe = await db.recipes.update({
    where: {
      id: recipeId,
    },
    data: {
      title: name,
      description,
      image,

      price: Number(price),
      cookingTime,
      ingredients: {
        deleteMany: {},
        create: ingredients.map((ingredient) => ({
          name: ingredient.name,
          quantity: ingredient.quantity,
        })),
      },
      steps: {
        deleteMany: {},
        create: steps.map((step) => ({
          order: step.order,
          content: step.content,
        })),
      },
      userId,
    },
    include: {
      ingredients: true,
    },
  });

  return redirectWithSuccess(`/recipes/${updatedRecipe.id}/view`, "Recipe updated");
};

export default function EditRecipe() {
  const { recipe } = useLoaderData<typeof loader>();
  const [ingredients, setIngredients] = React.useState<Array<SelectIngredient>>(recipe.ingredients);
  const [steps, setSteps] = React.useState<Array<Step>>(
    recipe.steps.map((step) => ({
      id: _.uniqueId(),
      order: step.order,
      content: step.content,
    })),
  );

  const fetcher = useFetcherCallback<ActionData>();
  const params = useParams();

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-sm:w-full sm:flex-1">
          <PageHeading title="Edit Recipe" />
        </div>
        <div className="flex gap-4">
          <Button variant="outline">
            <Link to={`/recipes/${params.id}/view`}>Cancel</Link>
          </Button>
          <Button type="submit" form="edit-recipe-form" disabled={fetcher.isPending}>
            {fetcher.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <Separator className="my-6" />

      <fetcher.Form
        method="post"
        id="edit-recipe-form"
        // onKeyDown={(e) => {
        //   if (e.key === 'Enter') {
        //     e.preventDefault()
        //   }
        // }}
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);

          formData.append("ingredients", JSON.stringify(ingredients));
          formData.append("steps", JSON.stringify(steps));

          fetcher.submit(formData, {
            method: "post",
          });
        }}
      >
        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-3">
          <div className="space-y-1">
            <Label>Name</Label>
            <p className="text-sm text-muted-foreground">
              This will be displayed on your public platform
            </p>
          </div>
          <div className="col-span-2 space-y-2">
            <Input
              aria-label="Recipe Name"
              placeholder="Enter recipe name"
              name="name"
              autoFocus
              defaultValue={recipe.title}
              disabled={!!fetcher.data?.fieldErrors?.name}
            />
            {fetcher.data?.fieldErrors?.name && (
              <div className="text-base/6 text-red-600 data-[disabled]:opacity-50 dark:text-red-500 sm:text-sm/6">
                {fetcher.data.fieldErrors.name}
              </div>
            )}
          </div>
        </section>

        <Separator className="my-6" />
        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-3">
          <div className="space-y-1">
            <Label>Description</Label>
            <p className="text-sm text-muted-foreground">Maximum 240 characters</p>
          </div>
          <div className="col-span-2 space-y-2">
            <Textarea
              aria-label="Description"
              name="description"
              placeholder="Enter description"
              defaultValue={recipe.description}
            />
            {fetcher.data?.fieldErrors?.description && (
              <div className="text-base/6 text-red-600 data-[disabled]:opacity-50 dark:text-red-500 sm:text-sm/6">
                {fetcher.data.fieldErrors.description}
              </div>
            )}
          </div>
        </section>

        <Separator className="my-6" />
        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-3">
          <div className="space-y-1">
            <Label>Price</Label>
            <p className="text-sm text-muted-foreground">Price in USD</p>
          </div>
          <div className="col-span-2 space-y-2">
            <Input
              aria-label="Price"
              name="price"
              placeholder="Enter price"
              min={1}
              type="number"
              defaultValue={recipe.price}
              disabled={!!fetcher.data?.fieldErrors?.price}
            />
            {fetcher.data?.fieldErrors?.price && (
              <div className="text-base/6 text-red-600 data-[disabled]:opacity-50 dark:text-red-500 sm:text-sm/6">
                {fetcher.data.fieldErrors.price}
              </div>
            )}
          </div>
        </section>

        <Separator className="my-6" />
        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-3">
          <div className="space-y-1">
            <Label>Image</Label>
            <p className="text-sm texst-muted-foreground">Image of your final dish</p>
          </div>
          <div className="col-span-2 space-y-2">
            <Input
              aria-label="Image URL"
              placeholder="Enter image URL"
              name="image"
              type="url"
              defaultValue={recipe.image}
              disabled={!!fetcher.data?.fieldErrors?.image}
            />
            {fetcher.data?.fieldErrors?.image && (
              <div className="text-base/6 text-red-600 data-[disabled]:opacity-50 dark:text-red-500 sm:text-sm/6">
                {fetcher.data.fieldErrors.image}
              </div>
            )}
          </div>
        </section>

        <Separator className="my-6" />

        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-3">
          <div className="space-y-1">
            <Label>Cooking Time</Label>
            <p className="text-sm text-muted-foreground">How long will it take to cook?</p>
          </div>
          <div className="col-span-2 space-y-2">
            <Input
              aria-label="Cooking Time"
              placeholder="Enter cooking time"
              name="cookingTime"
              defaultValue={recipe.cookingTime}
              disabled={!!fetcher.data?.fieldErrors?.cookingTime}
            />
            {fetcher.data?.fieldErrors?.cookingTime && (
              <div className="text-base/6 text-red-600 data-[disabled]:opacity-50 dark:text-red-500 sm:text-sm/6">
                {fetcher.data.fieldErrors.cookingTime}
              </div>
            )}
          </div>
        </section>

        <Separator className="my-6" />
        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Ingredients</Label>
            <p className="text-sm text-muted-foreground">List of ingredients</p>
          </div>
          <div className="col-span-2 space-y-2">
            <Ingredients
              integrdients={ingredients}
              onUpdate={(ingredients) => setIngredients(ingredients)}
            />
            {fetcher.data?.fieldErrors?.ingredients && (
              <div className="text-base/6 text-red-600 data-[disabled]:opacity-50 dark:text-red-500 sm:text-sm/6">
                {fetcher.data.fieldErrors.ingredients}
              </div>
            )}
          </div>
        </section>

        <Separator className="my-6" />

        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Steps</Label>
            <p className="text-sm text-muted-foreground">List of steps</p>
          </div>
          <div className="col-span-2 space-y-2">
            <Steps
              steps={steps}
              onUpdate={(steps) => {
                const updatedSteps = steps.map((s, index) => ({ ...s, order: index + 1 }));
                setSteps(updatedSteps);
              }}
            />
            {fetcher.data?.fieldErrors?.steps && (
              <div className="text-base/6 text-red-600 data-[disabled]:opacity-50 dark:text-red-500 sm:text-sm/6">
                {fetcher.data.fieldErrors.steps}
              </div>
            )}
          </div>
        </section>
      </fetcher.Form>
    </>
  );
}

function Ingredients({
  integrdients,
  onUpdate,
}: {
  integrdients: Array<SelectIngredient>;
  onUpdate: (ingredients: Array<SelectIngredient>) => void;
}) {
  const [name, setName] = React.useState("");
  const [quantity, setQuantity] = React.useState("");
  const [unit, setUnit] = React.useState("");

  const updateIngredient = (name: string, quantity: string, unit: string) => {
    if (name.trim() === "") {
      toast.error("Please enter a name");
      return;
    }

    if (quantity.trim() === "") {
      toast.error("Please enter a quantity");
      return;
    }

    if (unit.trim() === "") {
      toast.error("Please enter a unit");
      return;
    }

    const updatedIngredients = [
      ...integrdients,
      {
        id: _.uniqueId(),
        name,
        quantity: `${quantity} ${unit}`,
      },
    ];

    onUpdate(updatedIngredients);
    setName("");
    setQuantity("");
    setUnit("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      updateIngredient(name, quantity, unit);
      e.currentTarget.blur();
    }
  };

  return (
    <>
      <div className={cn("flex items-center gap-4", integrdients.length > 0 ? "pb-6" : "")}>
        <div className="flex flex-1 items-center gap-2">
          <Input
            placeholder="Enter Name"
            value={name}
            onChange={(e) => setName(e.target.value.trim())}
            onKeyDown={handleKeyDown}
          />
          <Input
            placeholder="Enter Quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value.trim())}
            onKeyDown={handleKeyDown}
            min={0}
            type="number"
          />
          <Select value={unit} onValueChange={(value) => setUnit(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a unit" />
            </SelectTrigger>
            <SelectContent>
              {[
                "cup",
                "tablespoon",
                "teaspoon",
                "gram",
                "ounce",
                "pound",
                "pint",
                "quart",
                "gallon",
              ].map((unit) => (
                <SelectItem key={unit} value={unit}>
                  {unit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => updateIngredient(name, quantity, unit)}>Add</Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {integrdients.map((ingredient) => (
          <Badge key={ingredient.id} variant="secondary" className="flex items-center gap-2">
            {ingredient.name} - {ingredient.quantity}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onUpdate(integrdients.filter((i) => i.id !== ingredient.id))}
            >
              <XIcon className="size-4" />
            </Button>
          </Badge>
        ))}
      </div>
    </>
  );
}

function Steps({
  steps,
  onUpdate,
}: { steps: Array<Step>; onUpdate: (steps: Array<Step>) => void }) {
  const [content, setContent] = React.useState("");

  const updateStep = (content: string) => {
    if (content.trim() === "") {
      toast.error("Please enter a step");
      return;
    }

    const updatedSteps = [
      ...steps,
      {
        id: _.uniqueId(),
        order: steps.length + 1,
        content: content,
      },
    ];

    onUpdate(updatedSteps);
    setContent("");
  };
  return (
    <>
      <div className={cn("flex items-center gap-4", steps.length > 0 ? "pb-6" : "")}>
        <div className="flex flex-1 items-center gap-2">
          <Input
            placeholder="Enter step"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                updateStep(e.currentTarget.value);
              }
            }}
          />
        </div>

        <Button
          onClick={() => {
            if (!content) {
              toast.error("Please enter both name and quantity");
              return;
            }
            updateStep(content);
          }}
        >
          Add
        </Button>
      </div>

      <Reorder.Group
        axis="y"
        values={steps}
        className="flex flex-col gap-4"
        onReorder={(steps) => onUpdate(steps)}
      >
        {steps.map((s) => (
          <EditableStep
            step={s}
            onUpdate={({ intent, step: modifiedStep }) => {
              console.log({ intent, modifiedStep });

              if (intent === "update") {
                const updatedSteps = steps.map((s) =>
                  s.id === modifiedStep.id ? modifiedStep : s,
                );
                onUpdate(updatedSteps);
                return;
              }

              onUpdate(steps.filter((s) => s.id !== modifiedStep.id));
            }}
            key={s.id}
          />
        ))}
      </Reorder.Group>
    </>
  );
}

function EditableStep({
  step,
  onUpdate,
}: {
  step: Step;
  onUpdate: (opts: { intent: "update" | "remove"; step: Step }) => void;
}) {
  const [content, setContent] = React.useState(step.content);
  const [isEditing, setIsEditing] = React.useState(false);

  return (
    <Reorder.Item key={step.id} value={step} dragListener={!isEditing}>
      <Card>
        <CardContent className="flex h-12 items-center gap-2 p-2">
          <div className="flex w-24 shrink-0 items-center gap-4">
            <GripVerticalIcon className="size-4 cursor-grab text-zinc-500" />
            <span className="text-sm font-medium">Step {step.order}</span>
          </div>
          <div className="flex-1 text-xs">
            {isEditing ? (
              <Input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onBlur={() => setIsEditing(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onUpdate({
                      intent: "update",
                      step: { ...step, content },
                    });
                    setIsEditing(false);
                  }
                }}
              />
            ) : (
              <p className="line-clamp-1">{content}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (isEditing) {
                  onUpdate({
                    intent: "update",
                    step: { ...step, content },
                  });
                }
                setIsEditing((prev) => !prev);
              }}
            >
              {isEditing ? (
                <CloudUploadIcon className="size-4" />
              ) : (
                <PencilIcon className="size-4" />
              )}
            </Button>

            <Button variant="ghost" size="sm" onClick={() => onUpdate({ intent: "remove", step })}>
              <TrashIcon className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Reorder.Item>
  );
}
