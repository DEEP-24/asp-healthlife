import { json } from '@remix-run/node'
import { useLoaderData, Link, Form } from '@remix-run/react'
import { Avatar, AvatarFallback, AvatarImage } from 'components/ui/avatar'
import { Separator } from 'components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'components/ui/table'
import PageHeading from '~/components/page-heading'
import { Button } from 'components/ui/button'
import { Card, CardContent } from 'components/ui/card'
import { PlusIcon, PencilIcon, TrashIcon } from 'lucide-react'
import { getDoctors } from '~/lib/doctor.server'

export const loader = async () => {
  const doctors = await getDoctors()
  return json({ doctors })
}

export default function AdminDoctors() {
  const { doctors } = useLoaderData<typeof loader>()

  return (
    <>
      <PageHeading title="Doctors" />
      <div className="mt-5 flex items-center justify-end pr-10">
        <Link to="/admin/doctors/new">
          <Button className="bg-green-100 text-black hover:bg-green-200 hover:text-green-900">
            <PlusIcon className="mr-1 h-4 w-4" />
            Add Doctor
          </Button>
        </Link>
      </div>

      {doctors.length > 0 ? (
        <Card className="mx-auto mt-10 max-w-screen-xl">
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="font-bold">
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Specialty</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {doctors.map(doctor => (
                  <TableRow key={doctor.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback>
                            {doctor.firstName.charAt(0) +
                              doctor.lastName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{`${doctor.firstName} ${doctor.lastName}`}</span>
                      </div>
                    </TableCell>
                    <TableCell>{doctor.email}</TableCell>
                    <TableCell>{doctor.phoneNo}</TableCell>
                    <TableCell>{doctor.speciality}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Link to={`/admin/doctors/${doctor.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <PencilIcon className="mr-1 h-4 w-4" />
                            Edit
                          </Button>
                        </Link>
                        <Form
                          method="post"
                          action={`/admin/doctors/${doctor.id}/delete`}
                        >
                          <Button
                            type="submit"
                            variant="outline"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                          >
                            <TrashIcon className="mr-1 h-4 w-4" />
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
              <h2 className="text-lg font-semibold">
                You don't have any doctors yet!
              </h2>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
