import type { ActionFunctionArgs } from "@remix-run/node";
import { Link, useFetcher, useSearchParams } from "@remix-run/react";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";
import { HeartPulseIcon, EyeIcon, EyeOffIcon } from "lucide-react";

import { verifyLogin } from "~/lib/auth.server";
import { createUserSession } from "~/lib/session.server";
import { UserRole } from "~/utils/enums";
import { badRequest, safeRedirect } from "~/utils/misc.server";
import { type inferErrors, validateAction } from "~/utils/validation";
import { LoginSchema } from "~/utils/zod.schema";

export type SearchParams = {
  redirectTo?: string;
};

interface ActionData {
  fieldErrors?: inferErrors<typeof LoginSchema>;
}

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { fieldErrors, fields } = await validateAction(request, LoginSchema);

    if (fieldErrors) {
      console.log("Field validation errors:", fieldErrors);
      return badRequest<ActionData>({ fieldErrors });
    }

    const { email, password, redirectTo, remember, role } = fields;

    const user = await verifyLogin(email, password, role);

    if (!user) {
      console.log("Invalid login attempt for email:", email);
      return badRequest<ActionData>({
        fieldErrors: {
          password: "Invalid username or password",
        },
      });
    }

    const safeRedirectTo = safeRedirect(redirectTo, "/");

    return createUserSession({
      redirectTo: safeRedirectTo,
      remember: remember === "on",
      request,
      role: user.role,
      userId: user.id,
    });
  } catch (error) {
    console.error("Login error:", error);
    return badRequest<ActionData>({
      fieldErrors: {
        email: "An unexpected error occurred. Please try again.",
      },
    });
  }
};

export default function Login() {
  const fetcher = useFetcher<ActionData>();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";
  const isSubmitting = fetcher.state !== "idle";
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <div className="rounded-lg bg-white p-8 shadow-xl">
      <div className="mb-8 text-center">
        <HeartPulseIcon className="mx-auto h-12 w-12 text-green-500" />
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Welcome to HealthLife</h2>
        <p className="mt-2 text-sm text-gray-600">Your Personalized Health Companion</p>
      </div>

      <fetcher.Form method="post" className="space-y-6">
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <div>
          <Label htmlFor="role">Role</Label>
          <Select name="role" required disabled={isSubmitting}>
            <SelectTrigger>
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(UserRole).map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fetcher.data?.fieldErrors?.role && (
            <p className="mt-2 text-sm text-red-600">{fetcher.data.fieldErrors.role}</p>
          )}
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={isSubmitting}
          />
          {fetcher.data?.fieldErrors?.email && (
            <p className="mt-2 text-sm text-red-600">{fetcher.data.fieldErrors.email}</p>
          )}
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              disabled={isSubmitting}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            </button>
          </div>
          {fetcher.data?.fieldErrors?.password && (
            <p className="mt-2 text-sm text-red-600">{fetcher.data.fieldErrors.password}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember"
              name="remember"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <Label htmlFor="remember" className="ml-2 block text-sm text-gray-900">
              Remember me
            </Label>
          </div>
          <div className="text-sm">
            <Link to="/forgot-password" className="font-medium text-green-600 hover:text-green-500">
              Forgot your password?
            </Link>
          </div>
        </div>

        <div>
          <Button
            type="submit"
            className="w-full rounded-md bg-green-500 px-4 py-2 text-white transition duration-150 ease-in-out hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </div>
      </fetcher.Form>

      <p className="mt-8 text-center text-sm text-gray-600">
        Not a member?{" "}
        <Link to="/register" className="font-medium text-green-600 hover:text-green-500">
          Start your health journey today
        </Link>
      </p>
    </div>
  );
}
