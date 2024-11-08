import { type LoaderFunctionArgs, json } from "@remix-run/node";
import { NavLink, Outlet, useLocation } from "@remix-run/react";
import { Avatar, AvatarFallback } from "components/ui/avatar";
import { Button } from "components/ui/button";
import {
  ActivityIcon,
  CalendarIcon,
  CookingPotIcon,
  HeartPulseIcon,
  LogOutIcon,
  MessageCircleIcon,
} from "lucide-react";

import { requireUserId, validateUserRole } from "~/lib/session.server";
import { UserRole } from "~/utils/enums";
import { useAuth } from "~/utils/hooks/use-auth";
import { getInitials } from "~/utils/misc";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUserId(request);
  await validateUserRole(request, [UserRole.USER]);
  return json({});
};

type SidebarLinkType = {
  to: string;
  icon: React.ComponentType;
  label: string;
};

const sidebarLinks: SidebarLinkType[] = [
  {
    to: "/bmi",
    icon: ActivityIcon,
    label: "BMI",
  },
  {
    to: "/recipes",
    icon: CookingPotIcon,
    label: "Diet Recipes",
  },
  {
    to: "/contact",
    icon: MessageCircleIcon,
    label: "Contact",
  },
  {
    to: "/appointments",
    icon: CalendarIcon,
    label: "Appointments",
  },
];

function SidebarLink({
  to,
  icon: Icon,
  children,
}: {
  to: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <NavLink to={to} className="block">
      <Button
        variant="ghost"
        className={`w-full justify-start px-2 py-1.5 text-sm font-bold bg-emerald-100 ${
          isActive
            ? "bg-emerald-300 text-emerald-700"
            : "text-gray-600 hover:bg-emerald-100 hover:text-gray-900"
        }`}
      >
        <Icon className="mr-1 h-4 w-4" />
        {children}
      </Button>
    </NavLink>
  );
}

function Sidebar() {
  const { user, signOut } = useAuth();

  return (
    <div className="flex h-full w-64 flex-col bg-green-50 border-r">
      <div className="flex items-center justify-center gap-2 p-4">
        <HeartPulseIcon className="h-10 w-10 text-emerald-600" />
        <span className="text-xl font-semibold text-emerald-600">HealthLife</span>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
        {sidebarLinks.map((link) => (
          <SidebarLink key={link.to} to={link.to} icon={link.icon}>
            {link.label}
          </SidebarLink>
        ))}
      </nav>
      <div className="p-4 flex flex-col items-center justify-center">
        <div className="flex items-center gap-3 mb-4">
          <Avatar>
            <AvatarFallback className="text-white bg-[#0b5c11]">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-bold text-[#003406]">{user.name}</p>
            <p className="text-xs text-[#003406]">{user.role}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="justify-start text-gray-600 hover:bg-green-100 hover:text-gray-900 bg-green-200"
          onClick={() => signOut()}
        >
          <LogOutIcon className="mr-1 h-4 w-4" />
          Log out
        </Button>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto pt-16">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
