import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { HeartPulseIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { jsonWithSuccess, redirectWithSuccess } from "remix-toast";
import { toast } from "sonner";
import { z } from "zod";
import { db } from "~/lib/prisma.server";
import { createHash } from "~/utils/encryption";
import { type inferErrors, validateAction } from "~/utils/validation";

const ResetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

interface ActionData {
  fieldErrors?: inferErrors<typeof ResetPasswordSchema>;
  success?: boolean;
  email?: string;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return redirect("/forgot-password");
  }

  const passwordReset = await db.passwordReset.findFirst({
    where: {
      token,
      expiresAt: { gt: new Date() },
      used: false,
    },
    include: { user: true },
  });

  if (!passwordReset) {
    return redirect("/forgot-password");
  }

  return json({ userId: passwordReset.userId });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  const { fieldErrors, fields } = await validateAction(request, ResetPasswordSchema);

  if (fieldErrors) {
    return json({ fieldErrors, success: false });
  }

  const { password } = fields;

  try {
    const passwordReset = await db.passwordReset.findFirst({
      where: {
        token: token ?? "",
        expiresAt: { gt: new Date() },
        used: false,
      },
      include: { user: true },
    });

    if (!passwordReset) {
      return json({
        fieldErrors: { password: "Invalid or expired reset token" },
        success: false,
      });
    }

    // Update the password
    await db.user.update({
      where: { id: passwordReset.userId },
      data: {
        password: await createHash(password),
      },
    });

    await db.passwordReset.delete({
      where: { id: passwordReset.id },
    });

    return redirectWithSuccess("/login", {
      message: "Password updated successfully!",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    return json({
      fieldErrors: { password: "Failed to update password. Please try again." },
      success: false,
    });
  }
};

export default function ResetPassword() {
  const fetcher = useFetcher<ActionData>();
  const location = useLocation();
  const isSubmitting = fetcher.state !== "idle";

  const token = new URLSearchParams(location.search).get("token");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="rounded-lg bg-white p-8 shadow-xl">
      <div className="mb-8 text-center">
        <HeartPulseIcon className="mx-auto h-12 w-12 text-emerald-500" />
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Reset Password</h2>
        <p className="mt-2 text-sm text-gray-600">Enter your new password</p>
      </div>

      <fetcher.Form method="post" className="space-y-6">
        <input type="hidden" name="token" value={token ?? ""} />

        <div>
          <Label htmlFor="password">New Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
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

        <div>
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              required
              disabled={isSubmitting}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOffIcon className="h-4 w-4" />
              ) : (
                <EyeIcon className="h-4 w-4" />
              )}
            </button>
          </div>
          {fetcher.data?.fieldErrors?.confirmPassword && (
            <p className="mt-2 text-sm text-red-600">{fetcher.data.fieldErrors.confirmPassword}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-500"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Updating Password..." : "Update Password"}
        </Button>
      </fetcher.Form>
    </div>
  );
}
