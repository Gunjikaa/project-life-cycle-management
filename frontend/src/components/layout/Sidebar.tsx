import { useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Bell,
  CheckSquare,
  ClipboardList,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react";

const navigation = [
  {
    title: "Overview",
    items: [
      {
        label: "Dashboard",
        icon: LayoutDashboard,
        path: "/dashboard",
      },
      {
        label: "Notifications",
        icon: Bell,
        path: "/notifications",
      },
    ],
  },
  {
    title: "Project Management",
    items: [
      {
        label: "All Projects",
        icon: FolderKanban,
        path: "/projects",
      },
      {
        label: "Create Project",
        icon: ClipboardList,
        path: "/projects/create",
      },
    ],
  },
  {
    title: "Lifecycle",
    items: [
      {
        label: "Lifecycle Pipeline",
        icon: BarChart3,
        path: "/lifecycle",
      },
      {
        label: "Pending Actions",
        icon: CheckSquare,
        path: "/pending-actions",
      },
    ],
  },
  {
    title: "Documents",
    items: [
      {
        label: "Document Repository",
        icon: FileText,
        path: "/documents",
      },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        label: "Users & Roles",
        icon: Users, path: "/users"
      },
    ],
  },
];

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="flex h-[calc(100vh-4rem)] w-64 flex-col border-r bg-white">
      <div className="flex-1 overflow-y-auto p-4">
        <nav className="space-y-6">
          {navigation.map((section) => (
            <div key={section.title}>
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                {section.title}
              </p>

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.path === location.pathname;

                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        if (item.path) {
                          navigate(item.path);
                        }
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                        isActive
                          ? "bg-slate-900 text-white"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className="border-t p-4">
        <button
  type="button"
  onClick={() => navigate("/settings")}
  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
    location.pathname === "/settings"
      ? "bg-slate-900 text-white"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
  }`}
>
  <Settings size={18} />
  <span>Settings</span>
</button>
      </div>
    </aside>
  );
}

export default Sidebar;
