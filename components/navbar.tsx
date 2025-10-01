"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export function Navbar() {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  // Don't render navbar while loading or if not authenticated
  if (loading || !user) {
    return null;
  }

  const isActive = (path: string) => {
    return pathname.startsWith(path);
  };

  return (
    <nav className="border-b bg-white">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo / Brand */}
          <div className="flex items-center gap-8">
            <Link href="/pos" className="text-xl font-bold text-gray-900">
              POS App
            </Link>

            {/* Main Navigation */}
            <div className="hidden md:flex items-center gap-1">
              <Link
                href="/pos"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive("/pos")
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                POS
              </Link>

              {user.role === "admin" && (
                <>
                  <Link
                    href="/admin/menu"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive("/admin/menu")
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    Menu
                  </Link>
                  <Link
                    href="/admin/tickets"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive("/admin/tickets")
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    Tickets
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className="text-gray-600">{user.email}</span>
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                {user.role}
              </span>
            </div>
            <Link
              href="/logout"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Logout
            </Link>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden mt-3 flex items-center gap-2 border-t pt-3">
          <Link
            href="/pos"
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              isActive("/pos")
                ? "bg-gray-100 text-gray-900"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            POS
          </Link>

          {user.role === "admin" && (
            <>
              <Link
                href="/admin/menu"
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive("/admin/menu")
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                Menu
              </Link>
              <Link
                href="/admin/tickets"
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive("/admin/tickets")
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                Tickets
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

