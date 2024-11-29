import type { ActionFunctionArgs } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { Badge } from "components/ui/badge";
import { Button } from "components/ui/button";
import { Card, CardContent } from "components/ui/card";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { XIcon } from "lucide-react";
import { useState } from "react";
import { jsonWithError, redirectWithSuccess } from "remix-toast";
import { toast } from "sonner";
import { z } from "zod";
import PageHeading from "~/components/page-heading";
import { db } from "~/lib/prisma.server";
import { requireUserId } from "~/lib/session.server";
import { useFetcherCallback } from "~/utils/hooks/use-fetcher-callback";
import { type inferErrors, validateAction } from "~/utils/validation";

const AllergySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  solutions: z.string().transform((str) => {
    try {
      const parsed = JSON.parse(str);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("At least one solution is required");
      }
      return parsed;
    } catch {
      throw new Error("At least one solution is required");
    }
  }),
});

type ActionData = {
  success: boolean;
  fieldErrors?: inferErrors<typeof AllergySchema>;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  await requireUserId(request);
  const { fieldErrors, fields } = await validateAction(request, AllergySchema);

  if (fieldErrors) {
    return jsonWithError({ fieldErrors, success: false }, "Please correct the errors");
  }

  const allergyExists = await db.allergy.findUnique({
    where: { name: fields.name },
  });

  if (allergyExists) {
    return jsonWithError(
      { fieldErrors: { name: "Allergy with this name already exists" }, success: false },
      "Allergy already exists",
    );
  }

  await db.allergy.create({
    data: {
      name: fields.name,
      solutions: {
        create: fields.solutions.map((solution) => ({
          solution,
        })),
      },
    },
  });

  return redirectWithSuccess("/admin/allergies", "Allergy added successfully");
};

export default function NewAllergy() {
  const fetcher = useFetcherCallback<ActionData>();
  const [solutions, setSolutions] = useState<string[]>([]);
  const [newSolution, setNewSolution] = useState("");

  const handleAddSolution = () => {
    if (!newSolution.trim()) {
      toast.error("Please enter a solution");
      return;
    }
    setSolutions([...solutions, newSolution.trim()]);
    setNewSolution("");
  };

  const handleRemoveSolution = (index: number) => {
    setSolutions(solutions.filter((_, i) => i !== index));
  };

  return (
    <Card className="mx-auto max-w-screen-xl mt-10">
      <CardContent className="p-6">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div className="max-sm:w-full sm:flex-1">
            <PageHeading title="New Allergy" />
          </div>
        </div>

        <fetcher.Form
          method="post"
          id="new-allergy-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (solutions.length === 0) {
              toast.error("Please add at least one solution");
              return;
            }
            const formData = new FormData(e.currentTarget);
            formData.append("solutions", JSON.stringify(solutions));
            fetcher.submit(formData, { method: "post" });
          }}
        >
          <div className="space-y-6">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Enter allergy name"
                autoFocus
                aria-invalid={!!fetcher.data?.fieldErrors?.name}
              />
              {fetcher.data?.fieldErrors?.name && (
                <p className="text-sm text-destructive">{fetcher.data.fieldErrors.name}</p>
              )}
            </div>

            <div>
              <Label>Solutions</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newSolution}
                  onChange={(e) => setNewSolution(e.target.value)}
                  placeholder="Enter a solution"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSolution();
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={handleAddSolution}
                  className="bg-green-100 text-green-900 hover:bg-green-200"
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {solutions.map((solution, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                  <Badge key={index} variant="secondary" className="flex items-center gap-2">
                    {solution}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSolution(index)}
                      className="h-auto p-0 hover:bg-transparent"
                    >
                      <XIcon className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              {fetcher.data?.fieldErrors?.solutions && (
                <p className="text-sm text-destructive mt-1">
                  {fetcher.data.fieldErrors.solutions}
                </p>
              )}
            </div>

            <div className="flex gap-4 items-center justify-end">
              <Button variant="outline" asChild>
                <Link to="/admin/allergies">Cancel</Link>
              </Button>
              <Button
                type="submit"
                form="new-allergy-form"
                className="bg-green-200 text-green-900 hover:bg-green-300"
              >
                {fetcher.isPending ? "Adding..." : "Add Allergy"}
              </Button>
            </div>
          </div>
        </fetcher.Form>
      </CardContent>
    </Card>
  );
}
