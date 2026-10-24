import { useEffect, useState } from "react";

interface CurrentUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

const formatRole = (role: string) => {
  switch (role) {
    case "ADMIN":
      return "Admin";
    case "PROJECT_DIRECTOR":
      return "Project Director";
    case "REVIEWER":
      return "Reviewer";
    default:
      return role;
  }
};

function Settings() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [backendStatus, setBackendStatus] = useState<
    "checking" | "connected" | "error"
  >("checking");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to read stored user:", error);
      }
    }

    const checkBackend = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/health`
        );

        if (response.ok) {
          setBackendStatus("connected");
        } else {
          setBackendStatus("error");
        }
      } catch (error) {
        console.error("Backend health check failed:", error);
        setBackendStatus("error");
      }
    };

    checkBackend();
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">
          Settings
        </h2>

        <p className="mt-2 text-slate-500">
          View your account and application information.
        </p>
      </div>

      {/* Account Information */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">
          Account Information
        </h3>

        {user ? (
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Name
              </p>

              <p className="mt-1 text-sm font-medium text-slate-800">
                {user.name}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Email
              </p>

              <p className="mt-1 text-sm font-medium text-slate-800">
                {user.email}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Role
              </p>

              <p className="mt-1 text-sm font-medium text-slate-800">
                {formatRole(user.role)}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            User information is not available.
          </p>
        )}
      </div>

      {/* System Information */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">
          System Information
        </h3>

        <div className="mt-6 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-800">
                Application
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Project Life Cycle Management System
              </p>
            </div>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              PLCMS
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-800">
                Backend
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Node.js + Express + TypeScript
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                backendStatus === "connected"
                  ? "bg-green-100 text-green-700"
                  : backendStatus === "error"
                    ? "bg-red-100 text-red-700"
                    : "bg-slate-100 text-slate-600"
              }`}
            >
              {backendStatus === "connected"
                ? "Connected"
                : backendStatus === "error"
                  ? "Unavailable"
                  : "Checking..."}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-800">
                Database
              </p>

              <p className="mt-1 text-xs text-slate-500">
                PostgreSQL + Prisma
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                backendStatus === "connected"
                  ? "bg-green-100 text-green-700"
                  : backendStatus === "error"
                    ? "bg-red-100 text-red-700"
                    : "bg-slate-100 text-slate-600"
              }`}
            >
              {backendStatus === "connected"
                ? "Connected"
                : backendStatus === "error"
                  ? "Unavailable"
                  : "Checking..."}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;