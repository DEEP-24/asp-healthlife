import { json } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { Avatar, AvatarFallback } from "components/ui/avatar";
import { Button } from "components/ui/button";
import { Card, CardContent } from "components/ui/card";
import { Separator } from "components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "components/ui/table";
import { PencilIcon, PlusIcon, TrashIcon } from "lucide-react";
import PageHeading from "~/components/page-heading";
import { getAllUsers } from "~/lib/user.server";
import { formatDate } from "~/utils/misc";

export const loader = async () => {
  const users = await getAllUsers();
  return json({ users });
};

export default function AdminUsers() {
  const { users } = useLoaderData<typeof loader>();

  return (
    <>
      <PageHeading title="Users" />
      <div className="flex items-center justify-end mt-5 pr-10">
        <Link to="/admin/users/new">
          <Button className="bg-green-100 hover:bg-green-200 text-black hover:text-green-900">
            <PlusIcon className="w-4 h-4 mr-1" />
            Add User
          </Button>
        </Link>
      </div>

      {users.length > 0 ? (
        <Card className="mt-10 mx-auto max-w-screen-xl">
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="font-bold">
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Date of Birth</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback>
                            {user.firstName.charAt(0) + user.lastName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{`${user.firstName} ${user.lastName}`}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phoneNo}</TableCell>
                    <TableCell>{formatDate(user.dob)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Link to={`/admin/users/${user.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <PencilIcon className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        <Form method="post" action={`/admin/users/${user.id}/delete`}>
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
              <h2 className="text-lg font-semibold">You don't have any users yet!</h2>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
