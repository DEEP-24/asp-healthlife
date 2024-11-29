import { json } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { Button } from "components/ui/button";
import { Card, CardContent } from "components/ui/card";
import { Separator } from "components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "components/ui/table";
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from "lucide-react";
import PageHeading from "~/components/page-heading";
import { db } from "~/lib/prisma.server";
import { useState } from "react";
import { Badge } from "components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "components/ui/dialog";

export const loader = async () => {
  const allergies = await db.allergy.findMany({
    include: {
      solutions: true,
      _count: {
        select: {
          solutions: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return json({ allergies });
};

export default function AdminAllergies() {
  const { allergies } = useLoaderData<typeof loader>();
  const [selectedAllergy, setSelectedAllergy] = useState<(typeof allergies)[0] | null>(null);

  return (
    <>
      <PageHeading title="Allergies Management" />
      <div className="flex items-center justify-end mt-5 pr-10">
        <Link to="/admin/allergies/new">
          <Button className="bg-green-100 hover:bg-green-200 text-black hover:text-green-900">
            <PlusIcon className="w-4 h-4 mr-1" />
            Add Allergy
          </Button>
        </Link>
      </div>

      {allergies.length > 0 ? (
        <Card className="mt-10 mx-auto max-w-screen-xl">
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="font-bold">
                  <TableHead>Name</TableHead>
                  <TableHead>Solutions Count</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allergies.map((allergy) => (
                  <TableRow key={allergy.id}>
                    <TableCell className="font-medium">{allergy.name}</TableCell>
                    <TableCell>{allergy._count.solutions}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedAllergy(allergy)}
                        >
                          <EyeIcon className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Link to={`/admin/allergies/${allergy.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <PencilIcon className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        <Form method="post" action={`/admin/allergies/${allergy.id}/delete`}>
                          <Button
                            type="submit"
                            variant="outline"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                          >
                            <TrashIcon className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </Form>
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
              <h2 className="text-lg font-semibold">No allergies added yet!</h2>
              <p className="text-sm text-gray-500">Add your first allergy to get started.</p>
            </div>
          </div>
        </div>
      )}

      <Dialog open={!!selectedAllergy} onOpenChange={() => setSelectedAllergy(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">{selectedAllergy?.name}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <h3 className="font-medium mb-2">Solutions:</h3>
            <div className="space-y-2">
              {selectedAllergy?.solutions.map((solution, index) => (
                <Badge
                  key={solution.id}
                  variant="secondary"
                  className="block w-full py-2 px-3 text-sm"
                >
                  {index + 1}. {solution.solution}
                </Badge>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
