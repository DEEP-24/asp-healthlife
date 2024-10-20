import type { LoaderFunction } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import { validateUserRole } from "~/lib/session.server";

export const loader: LoaderFunction = async ({ request }) => {
  await validateUserRole(request, null);
  return null;
};

export default function AuthLayout() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4">
      <img
        src="https://cdn.pixabay.com/photo/2015/07/30/14/36/hypertension-867855_1280.jpg"
        alt="HealthLife Background"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black opacity-60" />
      <div className="relative w-full max-w-md">
        <Outlet />
      </div>
    </div>
  );
}
