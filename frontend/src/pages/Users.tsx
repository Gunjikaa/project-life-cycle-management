import { useEffect, useState } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
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

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/users`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to fetch users."
          );
        }

        setUsers(data);
      } catch (error) {
        console.error("Failed to fetch users:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to fetch users."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-sm text-slate-500">
          Loading users...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <p className="text-sm font-medium text-red-700">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">
          Users & Roles
        </h2>

        <p className="mt-2 text-slate-500">
          View users and their assigned system roles.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <p className="text-sm text-slate-500">
            {users.length}{" "}
            {users.length === 1 ? "user" : "users"} registered
          </p>
        </div>

        {users.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-700">
              No users found.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {user.name}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {user.email}
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {formatRole(user.role)}
                  </span>

                  <span className="text-xs text-slate-400">
                    Joined {formatDate(user.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Users;