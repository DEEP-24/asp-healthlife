import { type ActionFunctionArgs, type LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { Link, useFetcher, useLoaderData } from "@remix-run/react";
import { Button } from "components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card";
import { Label } from "components/ui/label";
import { Textarea } from "components/ui/textarea";
import { format } from "date-fns";
import { ArrowLeftIcon, CalendarIcon, Clock, User } from "lucide-react";
import { useEffect, useRef } from "react";
import { jsonWithSuccess } from "remix-toast";
import PageHeading from "~/components/page-heading";
import { db } from "~/lib/prisma.server";
import { AppointmentStatus } from "~/utils/enums";
import { cn } from "~/utils/misc";
import type { Meal, MealType } from "@prisma/client";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { appointmentId } = params;

  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phoneNo: true,
          street: true,
          city: true,
          state: true,
          zip: true,
          dob: true,
        },
      },
      mealPlan: {
        include: {
          meal: true,
        },
      },
      healthMetrics: true,
    },
  });

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  return json({ appointment });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { appointmentId } = params;
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
  });

  if (!appointment) {
    redirect("/doctor/appointments");
  }

  if (intent === "update_status") {
    const status = formData.get("status") as string;
    try {
      await db.appointment.update({
        where: { id: appointmentId },
        data: {
          status: status as AppointmentStatus,
        },
      });
      return jsonWithSuccess({ success: true }, "Appointment status updated successfully");
    } catch (_error) {
      return json({ error: "Failed to update status" }, { status: 500 });
    }
  }

  if (intent === "update_notes") {
    const notes = formData.get("notes") as string;
    try {
      await db.appointment.update({
        where: { id: appointmentId },
        data: {
          notes,
        },
      });
      return jsonWithSuccess({ success: true }, "Appointment notes updated successfully");
    } catch (error) {
      console.error("Failed to update notes:", error);
      return json({ error: "Failed to update notes" }, { status: 500 });
    }
  }

  if (intent === "update_meal_plan") {
    const meals = JSON.parse(formData.get("meals") as string);
    try {
      const updatedAppointment = await db.appointment.update({
        where: { id: appointmentId },
        data: {
          mealPlan: {
            upsert: {
              create: {
                plan: "Weekly meal plan",
                meal: {
                  createMany: {
                    data: meals.map((meal: any) => ({
                      name: meal.name,
                      type: meal.type,
                      calories: Number.parseInt(meal.calories),
                      protein: Number.parseFloat(meal.protein),
                      carbs: Number.parseFloat(meal.carbs),
                      fats: Number.parseFloat(meal.fats),
                      foods: meal.foods,
                    })),
                  },
                },
              },
              update: {
                plan: "Weekly meal plan",
                meal: {
                  deleteMany: {},
                  createMany: {
                    data: meals.map((meal: any) => ({
                      name: meal.name,
                      type: meal.type,
                      calories: Number.parseInt(meal.calories),
                      protein: Number.parseFloat(meal.protein),
                      carbs: Number.parseFloat(meal.carbs),
                      fats: Number.parseFloat(meal.fats),
                      foods: meal.foods,
                    })),
                  },
                },
              },
            },
          },
        },
        include: {
          mealPlan: {
            include: {
              meal: true,
            },
          },
        },
      });

      return jsonWithSuccess(
        { success: true, mealPlan: updatedAppointment.mealPlan },
        "Meal plan updated successfully",
      );
    } catch (error) {
      console.error("Failed to update meal plan:", error);
      return json({ error: "Failed to update meal plan" }, { status: 500 });
    }
  }

  if (intent === "update_health_metrics") {
    const waterIntake = Number.parseFloat(formData.get("waterIntake") as string);
    const calories = Number.parseInt(formData.get("calories") as string);
    const notes = formData.get("notes") as string;

    try {
      await db.appointment.update({
        where: { id: appointmentId },
        data: {
          healthMetrics: {
            create: {
              waterIntake,
              calories,
              notes,
              user: {
                connect: {
                  id: appointment!.patientId,
                },
              },
            },
          },
        },
      });
      return jsonWithSuccess({ success: true }, "Health metrics added successfully");
    } catch (error) {
      console.error("Failed to add health metrics:", error);
      return json({ error: "Failed to add health metrics" }, { status: 500 });
    }
  }

  return json({ error: "Invalid intent" }, { status: 400 });
};

const getStatusOptions = () => Object.values(AppointmentStatus);

function formatFormDataToMeals(formData: FormData) {
  const meals: Array<{
    type: MealType;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    foods: string[];
  }> = [];

  for (const mealType of ["BREAKFAST", "LUNCH", "DINNER", "SNACK"] as MealType[]) {
    const meal = {
      type: mealType,
      name: formData.get(`meals[${mealType}].name`) as string,
      calories: Number(formData.get(`meals[${mealType}].calories`)),
      protein: Number(formData.get(`meals[${mealType}].protein`)),
      carbs: Number(formData.get(`meals[${mealType}].carbs`)),
      fats: Number(formData.get(`meals[${mealType}].fats`)),
      foods: ((formData.get(`meals[${mealType}].foods`) as string) || "")
        .split(",")
        .map((food) => food.trim())
        .filter(Boolean),
    };
    meals.push(meal);
  }
  return meals;
}

function findMeal(meals: Meal[] | undefined, mealType: MealType) {
  return meals?.find((m) => m.type === mealType);
}

export default function AppointmentView() {
  const { appointment } = useLoaderData<typeof loader>();
  const formRef = useRef<HTMLFormElement>(null);
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state === "submitting";

  useEffect(() => {
    if (fetcher.state === "idle" && formRef.current) {
      formRef.current.reset();
    }
  }, [fetcher.state]);

  return (
    <div className="container mx-auto py-8 px-4">
      <PageHeading title="Appointment Details" />
      <div>
        <Link
          to="/doctor/appointments"
          className="hover:underline flex items-center gap-1 mb-4 text-sm text-muted-foreground w-fit"
        >
          <ArrowLeftIcon className="h-2.5 w-2.5" />
          <span>Back</span>
        </Link>
      </div>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Appointment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Date: {format(new Date(appointment.date), "PPP")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Time: {format(new Date(appointment.startTime), "h:mm a")} -{" "}
                    {format(new Date(appointment.endTime), "h:mm a")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {appointment.status !== AppointmentStatus.CANCELLED &&
                  appointment.status !== AppointmentStatus.COMPLETED ? (
                    <fetcher.Form method="post" className="flex items-center gap-2">
                      <select
                        name="status"
                        className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                        defaultValue={appointment.status}
                        onChange={(e) => {
                          fetcher.submit(
                            {
                              status: e.target.value,
                              intent: "update_status",
                            },
                            { method: "post" },
                          );
                        }}
                        disabled={isSubmitting}
                      >
                        {getStatusOptions().map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </fetcher.Form>
                  ) : null}
                  <div
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      {
                        "bg-green-100 text-green-800":
                          appointment.status === AppointmentStatus.COMPLETED,
                        "bg-yellow-100 text-yellow-800":
                          appointment.status === AppointmentStatus.PENDING,
                        "bg-blue-100 text-blue-800":
                          appointment.status === AppointmentStatus.SCHEDULED,
                        "bg-red-100 text-red-800":
                          appointment.status === AppointmentStatus.CANCELLED,
                      },
                    )}
                  >
                    {appointment.status}
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4 mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium">Patient Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Name</Label>
                    <p>
                      {appointment.patient.firstName} {appointment.patient.lastName}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p>{appointment.patient.email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <p>{appointment.patient.phoneNo}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Date of Birth</Label>
                    <p>{format(new Date(appointment.patient.dob), "PPP")}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Address</Label>
                    <p>
                      {appointment.patient.street}, {appointment.patient.city},{" "}
                      {appointment.patient.state}, {appointment.patient.zip}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {(appointment.status === AppointmentStatus.SCHEDULED ||
          appointment.status === AppointmentStatus.COMPLETED) && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Appointment Notes</CardTitle>
              </CardHeader>
              <CardContent>
                {appointment.status === AppointmentStatus.COMPLETED ? (
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <div className="min-h-[150px] p-3 rounded-md border bg-muted">
                      {appointment.notes || "No notes added"}
                    </div>
                  </div>
                ) : (
                  <fetcher.Form ref={formRef} method="post" className="space-y-4">
                    <input type="hidden" name="intent" value="update_notes" />
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        name="notes"
                        placeholder="Enter appointment notes..."
                        defaultValue={appointment.notes || ""}
                        className="min-h-[150px]"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-fit bg-green-100 hover:bg-green-200 text-green-800"
                    >
                      {isSubmitting ? "Saving..." : "Save Notes"}
                    </Button>
                  </fetcher.Form>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Weekly Meal Plan</CardTitle>
              </CardHeader>
              <CardContent>
                {appointment.status === AppointmentStatus.COMPLETED ? (
                  <div className="grid grid-cols-2 gap-4">
                    {appointment.mealPlan?.meal.map((meal) => (
                      <div key={meal.id} className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-4">
                          <h3 className="font-medium text-lg">{meal.type}</h3>
                          <span className="text-sm text-muted-foreground">({meal.name})</span>
                        </div>

                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Calories</span>
                              <p className="font-medium">{meal.calories} cal</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Protein</span>
                              <p className="font-medium">{meal.protein}g</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Carbs</span>
                              <p className="font-medium">{meal.carbs}g</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Fats</span>
                              <p className="font-medium">{meal.fats}g</p>
                            </div>
                          </div>

                          <div>
                            <span className="text-muted-foreground block mb-2">
                              Suggested Foods
                            </span>
                            <div className="text-sm space-y-1">
                              {meal.foods.map((food, index) => (
                                // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                                <div key={index} className="text-sm">
                                  • {food}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <fetcher.Form
                    method="post"
                    className="space-y-6"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const meals = formatFormDataToMeals(formData);
                      formData.set("meals", JSON.stringify(meals));
                      formData.set("intent", "update_meal_plan");
                      fetcher.submit(formData, { method: "post" });
                    }}
                  >
                    <input type="hidden" name="intent" value="update_meal_plan" />
                    <input type="hidden" name="notes" value={appointment.notes || ""} />

                    {["BREAKFAST", "LUNCH", "DINNER", "SNACK"].map((mealType) => (
                      <div key={mealType} className="space-y-4">
                        <h3 className="font-medium">{mealType}</h3>
                        <div className="grid gap-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`${mealType}-name`}>Meal Name</Label>
                              <input
                                type="text"
                                id={`${mealType}-name`}
                                name={`meals[${mealType}].name`}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                defaultValue={
                                  findMeal(appointment.mealPlan?.meal, mealType as MealType)
                                    ?.name || ""
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`${mealType}-calories`}>Calories</Label>
                              <input
                                type="number"
                                id={`${mealType}-calories`}
                                name={`meals[${mealType}].calories`}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                defaultValue={
                                  findMeal(appointment.mealPlan?.meal, mealType as MealType)
                                    ?.calories || ""
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`${mealType}-protein`}>Protein (g)</Label>
                              <input
                                type="number"
                                step="0.1"
                                id={`${mealType}-protein`}
                                name={`meals[${mealType}].protein`}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                defaultValue={
                                  findMeal(appointment.mealPlan?.meal, mealType as MealType)
                                    ?.protein || ""
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`${mealType}-carbs`}>Carbs (g)</Label>
                              <input
                                type="number"
                                step="0.1"
                                id={`${mealType}-carbs`}
                                name={`meals[${mealType}].carbs`}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                defaultValue={
                                  findMeal(appointment.mealPlan?.meal, mealType as MealType)
                                    ?.carbs || ""
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`${mealType}-fats`}>Fats (g)</Label>
                              <input
                                type="number"
                                step="0.1"
                                id={`${mealType}-fats`}
                                name={`meals[${mealType}].fats`}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                defaultValue={
                                  findMeal(appointment.mealPlan?.meal, mealType as MealType)
                                    ?.fats || ""
                                }
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`${mealType}-foods`}>Suggested Foods</Label>
                            <Textarea
                              id={`${mealType}-foods`}
                              name={`meals[${mealType}].foods`}
                              className="min-h-[100px]"
                              defaultValue={
                                findMeal(
                                  appointment.mealPlan?.meal,
                                  mealType as MealType,
                                )?.foods.join(", ") || ""
                              }
                              placeholder="Enter foods you wanna suggest to the patient."
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-fit bg-green-100 hover:bg-green-200 text-green-800"
                    >
                      {isSubmitting ? "Saving..." : "Save Meal Plan"}
                    </Button>
                  </fetcher.Form>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Health Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                {appointment.status === AppointmentStatus.COMPLETED ? (
                  <div className="space-y-4">
                    {appointment.healthMetrics.map((metric) => (
                      <div key={metric.id} className="border rounded-lg p-4">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Water Intake Goal</span>
                            <p className="font-medium">{metric.waterIntake}L per day</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Calorie Goal</span>
                            <p className="font-medium">{metric.calories} cal per day</p>
                          </div>
                          {metric.notes && (
                            <div>
                              <span className="text-muted-foreground">Notes</span>
                              <p className="mt-1">{metric.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <fetcher.Form method="post" className="space-y-4">
                    <input type="hidden" name="intent" value="update_health_metrics" />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="waterIntake">Water Intake (L)</Label>
                        <input
                          type="number"
                          step="0.1"
                          id="waterIntake"
                          name="waterIntake"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          placeholder="Enter water intake in liters"
                          defaultValue={appointment.healthMetrics?.[0]?.waterIntake || ""}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="calories">Calories to consume</Label>
                        <input
                          type="number"
                          id="calories"
                          name="calories"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          placeholder="Enter calories consumed"
                          defaultValue={appointment.healthMetrics?.[0]?.calories || ""}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="healthNotes">Notes</Label>
                      <Textarea
                        id="healthNotes"
                        name="notes"
                        className="min-h-[100px]"
                        placeholder="Enter any health-related notes, observations, or concerns..."
                        defaultValue={appointment.healthMetrics?.[0]?.notes || ""}
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-fit bg-green-100 hover:bg-green-200 text-green-800"
                    >
                      {isSubmitting ? "Saving..." : "Save Health Metrics"}
                    </Button>
                  </fetcher.Form>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
