"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import Link from "next/link";

interface AdminAccess {
  hasAccess: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  userId?: string;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const currentUser = useStore((state) => state.currentUser);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModerator, setIsModerator] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      if (!currentUser?.id) {
        router.push("/auth/signin");
        setLoading(false);
        return;
      }

      try {
        // Check admin/moderator access via API
        const response = await fetch("/api/admin/access");

        if (!response.ok) {
          setAuthorized(false);
          setLoading(false);
          return;
        }

        const data = await response.json();
        const access: AdminAccess = data.access;

        if (!access.hasAccess) {
          setAuthorized(false);
          setLoading(false);
          return;
        }

        setAuthorized(true);
        setIsAdmin(access.isAdmin);
        setIsModerator(access.isModerator);
      } catch (error) {
        console.error("Access check failed:", error);
        setAuthorized(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [currentUser, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-4">
            You do not have admin or moderator permissions.
          </p>
          <button
            onClick={() => router.push("/")}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              Admin Dashboard {isModerator && !isAdmin && "(Moderator)"}
            </h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-600">
                    {isAdmin ? "A" : "M"}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {currentUser?.email}
                  </p>
                  <p className="text-xs text-gray-500">
                    {isAdmin ? "Administrator" : "Moderator"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push("/")}
                className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 rounded hover:bg-gray-100"
              >
                Exit Admin
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Admin Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <nav className="p-4 space-y-2">
            <h3 className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
              Management
            </h3>
            <Link
              href="/admin"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-lg hover:text-blue-600"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/payments"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-lg hover:text-blue-600"
            >
              Payments & Withdrawals
            </Link>
            {isAdmin && (
              <>
                <Link
                  href="/admin/providers"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-lg hover:text-blue-600"
                >
                  Payment Providers
                </Link>
                <Link
                  href="/admin/analytics"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-lg hover:text-blue-600"
                >
                  Analytics
                </Link>
                <Link
                  href="/admin/settings"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-lg hover:text-blue-600"
                >
                  Settings
                </Link>
              </>
            )}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-8">{children}</main>
      </div>
    </div>
  );
}
