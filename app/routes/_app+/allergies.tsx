import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Card } from "components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";
import { useState } from "react";
import PageHeading from "~/components/page-heading";
import { db } from "~/lib/prisma.server";

export async function loader() {
  const allergies = await db.allergy.findMany({
    include: {
      solutions: true,
    },
  });

  return json({ allergies });
}

export default function AllergiesPage() {
  const { allergies } = useLoaderData<typeof loader>();
  const [selectedAllergy, setSelectedAllergy] = useState<string>("");

  const selectedAllergyData = allergies.find((allergy) => allergy.id === selectedAllergy);

  return (
    <div className="container mx-auto py-8">
      <PageHeading title="Allergies and Solutions" />

      <div className="mt-8 max-w-3xl mx-auto">
        <div className="bg-muted/50 rounded-lg p-6 mb-6">
          <p className="text-muted-foreground">
            Managing allergies effectively starts with understanding your specific triggers and
            knowing the right solutions. Use this tool to learn about various allergies and their
            recommended treatments.
          </p>
        </div>

        <div className="max-w-xl">
          <Select value={selectedAllergy} onValueChange={setSelectedAllergy}>
            <SelectTrigger>
              <SelectValue placeholder="Select an allergy" />
            </SelectTrigger>
            <SelectContent>
              {allergies.map((allergy) => (
                <SelectItem key={allergy.id} value={allergy.id}>
                  {allergy.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedAllergyData && (
            <div className="mt-6 space-y-4">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-2">{selectedAllergyData.name}</h2>
                <h3 className="font-semibold mb-2">Recommended Solutions:</h3>
                <ul className="list-disc pl-5 space-y-2">
                  {selectedAllergyData.solutions.map((solution) => (
                    <li key={solution.id} className="text-muted-foreground">
                      {solution.solution}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
