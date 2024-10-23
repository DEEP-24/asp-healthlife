import type { ActionFunctionArgs } from "@remix-run/node";
import { Link } from "@remix-run/react";
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
import { Textarea } from "components/ui/textarea";
import { Reorder } from "framer-motion";
import _ from "lodash";
import { CloudUpload, GripVertical, Pencil, Trash, X } from "lucide-react";
import * as React from "react";
import { jsonWithError, redirectWithSuccess } from "remix-toast";
import { toast } from "sonner";
import PageHeading from "~/components/page-heading";
import { db } from "~/lib/prisma.server";
import { requireUserId } from "~/lib/session.server";
import { useFetcherCallback } from "~/utils/hooks/use-fetcher-callback";
import { cn } from "~/utils/misc";
import { type inferErrors, validateAction } from "~/utils/validation";
import { RecipeSchema, type SelectIngredient, type Step } from "~/utils/zod.schema";

type ActionData = {
  success: boolean;
  fieldErrors?: inferErrors<typeof RecipeSchema>;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);
  const { fieldErrors, fields } = await validateAction(request, RecipeSchema);

  if (fieldErrors) {
    return jsonWithError({ fieldErrors, success: false }, "Please correct the errors");
  }

  const { name, description, image, price, cookingTime, ingredients, steps } = fields;

  const createdRecipe = await db.recipes.create({
    data: {
      title: name,
      description,
      image,
      price: Number(price),
      cookingTime,
      ingredients: {
        create: ingredients.map((ingredient) => ({
          name: ingredient.name,
          quantity: ingredient.quantity,
        })),
      },
      steps: {
        create: steps.map((step, index) => ({
          order: index + 1,
          content: step.content,
        })),
      },
      userId,
    },
    include: {
      ingredients: true,
      steps: true,
    },
  });

  return redirectWithSuccess(`/recipes/${createdRecipe.id}/view`, "Recipe added");
};

export default function NewRecipe() {
  const [ingredients, setIngredients] = React.useState<Array<SelectIngredient>>([
    {
      id: _.uniqueId(),
      name: "Spaghetti",
      quantity: "1 pound",
    },
  ]);
  const [steps, setSteps] = React.useState<Array<Step>>([
    {
      id: _.uniqueId(),
      order: 1,
      content: "Start by boiling salted water in a large pot.",
    },
  ]);

  const fetcher = useFetcherCallback<ActionData>();

  return (
    <Card className="mx-auto max-w-screen-xl mt-10">
      <CardContent className="p-6">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div className="max-sm:w-full sm:flex-1">
            <PageHeading title="New Recipe" />
          </div>
        </div>

        <fetcher.Form
          method="post"
          id="new-recipe-form"
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
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">Name</Label>
                <p className="text-sm text-muted-foreground">
                  This will be displayed on your public platform
                </p>
              </div>
              <div className="space-y-2">
                <Input
                  id="name"
                  name="name"
                  placeholder="Enter recipe name"
                  autoFocus
                  aria-invalid={!!fetcher.data?.fieldErrors?.name}
                />
                {fetcher.data?.fieldErrors?.name && (
                  <p className="text-sm text-destructive">{fetcher.data.fieldErrors.name}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="description">Description</Label>
                <p className="text-sm text-muted-foreground">Maximum 240 characters</p>
              </div>
              <div className="space-y-2">
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Enter description"
                  aria-invalid={!!fetcher.data?.fieldErrors?.description}
                />
                {fetcher.data?.fieldErrors?.description && (
                  <p className="text-sm text-destructive">{fetcher.data.fieldErrors.description}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="price">Price</Label>
                <p className="text-sm text-muted-foreground">Price in USD</p>
              </div>
              <div className="space-y-2">
                <Input
                  id="price"
                  name="price"
                  placeholder="Enter price"
                  min={1}
                  type="number"
                  aria-invalid={!!fetcher.data?.fieldErrors?.price}
                />
                {fetcher.data?.fieldErrors?.price && (
                  <p className="text-sm text-destructive">{fetcher.data.fieldErrors.price}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="image">Image</Label>
                <p className="text-sm text-muted-foreground">Image of your final dish</p>
              </div>
              <div className="space-y-2">
                <Input
                  id="image"
                  name="image"
                  placeholder="Enter image URL"
                  type="url"
                  aria-invalid={!!fetcher.data?.fieldErrors?.image}
                />
                {fetcher.data?.fieldErrors?.image && (
                  <p className="text-sm text-destructive">{fetcher.data.fieldErrors.image}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="cookingTime">Cooking Time</Label>
                <p className="text-sm text-muted-foreground">How long will it take to cook?</p>
              </div>
              <div className="space-y-2">
                <Input
                  id="cookingTime"
                  name="cookingTime"
                  placeholder="Enter cooking time"
                  aria-invalid={!!fetcher.data?.fieldErrors?.cookingTime}
                />
                {fetcher.data?.fieldErrors?.cookingTime && (
                  <p className="text-sm text-destructive">{fetcher.data.fieldErrors.cookingTime}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="ingredients">Ingredients</Label>
                <p className="text-sm text-muted-foreground">List of ingredients</p>
              </div>
              <div className="space-y-2">
                <Ingredients
                  integrdients={ingredients}
                  onUpdate={(ingredients) => setIngredients(ingredients)}
                />
                {fetcher.data?.fieldErrors?.ingredients && (
                  <p className="text-sm text-destructive">{fetcher.data.fieldErrors.ingredients}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="steps">Steps</Label>
                <p className="text-sm text-muted-foreground">List of steps</p>
              </div>
              <div className="space-y-4">
                <Steps
                  steps={steps}
                  onUpdate={(steps) => {
                    const updatedSteps = steps.map((s, index) => ({ ...s, order: index + 1 }));
                    setSteps(updatedSteps);
                  }}
                />
                {fetcher.data?.fieldErrors?.steps && (
                  <p className="text-sm text-destructive">{fetcher.data.fieldErrors.steps}</p>
                )}
              </div>
            </div>
            <div className="flex gap-4 items-center justify-end">
              <Button variant="outline" asChild>
                <Link to="/recipes">Cancel</Link>
              </Button>
              <Button
                type="submit"
                form="new-recipe-form"
                className="bg-green-200 text-green-900 hover:bg-green-300"
              >
                {fetcher.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </fetcher.Form>
      </CardContent>
    </Card>
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

  const addIngredient = () => {
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

  return (
    <>
      <div className={cn("flex items-center gap-4", integrdients.length > 0 ? "pb-6" : "")}>
        <div className="flex flex-1 items-center gap-2">
          <Input
            placeholder="Enter Name"
            value={name}
            onChange={(e) => setName(e.target.value.trim())}
          />
          <Input
            placeholder="Enter Quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value.trim())}
            type="number"
            min={0}
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
        <Button
          type="button"
          onClick={addIngredient}
          className="bg-green-100 text-green-900 hover:bg-green-200"
        >
          Add
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {integrdients.map((ingredient) => (
          <Badge key={ingredient.id} variant="secondary" className="flex items-center gap-2">
            {ingredient.name} - {ingredient.quantity}
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-muted-foreground"
              onClick={() => onUpdate(integrdients.filter((i) => i.id !== ingredient.id))}
            >
              <X className="h-4 w-4" />
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

  const addStep = () => {
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
          />
        </div>

        <Button
          type="button"
          onClick={addStep}
          className="bg-green-100 text-green-900 hover:bg-green-200"
        >
          Add
        </Button>
      </div>

      <Reorder.Group
        axis="y"
        values={steps}
        className="space-y-2"
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
        <CardContent className="flex items-center gap-2 p-2">
          <div className="flex w-24 shrink-0 items-center gap-4">
            <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
            <span className="text-sm font-medium">Step {step.order}</span>
          </div>
          <div className="flex-1">
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
                      step: {
                        ...step,
                        content,
                      },
                    });
                    setIsEditing(false);
                  }
                }}
              />
            ) : (
              <p className="line-clamp-1 text-sm">{content}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (!content) {
                  toast.error("Please enter both name and quantity");
                  return;
                }
                onUpdate({
                  intent: "update",
                  step: {
                    ...step,
                    content,
                  },
                });
                setIsEditing(false);
              }}
            >
              {isEditing ? <CloudUpload className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                onUpdate({
                  intent: "remove",
                  step,
                })
              }
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Reorder.Item>
  );
}
