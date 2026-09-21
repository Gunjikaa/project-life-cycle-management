import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  FolderKanban,
  ListTodo,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Project {
  id: number;
  projectId: string;
  projectName: string;
  phase: string;
  preProjectStage?: string | null;
  createdAt: string;
}

const lifecycleStages = [
  { name: "Proposal", phase: "PROPOSAL" },
  { name: "Pre-Project", phase: "PRE_PROJECT" },
  { name: "AoN", phase: "AON" },
  { name: "Sanction", phase: "SANCTION" },
  { name: "Execution", phase: "EXECUTION" },
  { name: "Monitoring", phase: "MONITORING" },
  { name: "Closure", phase: "CLOSURE" },
  { name: "Post-Closure", phase: "POST_CLOSURE" },
];

const formatPhase = (phase: string) => {
  switch (phase) {
    case "PROPOSAL":
      return "Proposal";
    case "PRE_PROJECT":
      return "Pre-Project";
    case "AON":
      return "AoN";
    case "SANCTION":
      return "Sanction";
    case "EXECUTION":
      return "Execution";
    case "MONITORING":
      return "Monitoring";
    case "CLOSURE":
      return "Closure";
    case "POST_CLOSURE":
      return "Post-Closure";
    default:
      return phase;
  }
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(
          "http://localhost:5000/api/projects",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to fetch projects."
          );
        }

        setProjects(data);
      } catch (error) {
        console.error(
          "Failed to fetch dashboard projects:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load dashboard."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const totalProjects = projects.length;

  const activeProjects = projects.filter(
    (project) =>
      project.phase !== "CLOSURE" &&
      project.phase !== "POST_CLOSURE"
  ).length;

  const completedProjects = projects.filter(
    (project) =>
      project.phase === "CLOSURE" ||
      project.phase === "POST_CLOSURE"
  ).length;

  const stageData = lifecycleStages.map((stage) => ({
    ...stage,
    count: projects.filter(
      (project) => project.phase === stage.phase
    ).length,
  }));

  const stats = [
    {
      label: "Total Projects",
      value: totalProjects,
      description: "All registered projects",
      icon: FolderKanban,
    },
    {
      label: "Active Projects",
      value: activeProjects,
      description: "Currently in progress",
      icon: Clock3,
    },
    {
      label: "Pending Actions",
      value: 0,
      description: "Action tracking not implemented yet",
      icon: ListTodo,
    },
    {
      label: "Completed Projects",
      value: completedProjects,
      description: "Projects in closure or post-closure",
      icon: CheckCircle2,
    },
  ];

  const recentProjects = [...projects]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  if (loading) {
    return <p>Loading dashboard...</p>;
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
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">
          Dashboard
        </h2>

        <p className="mt-2 text-slate-500">
          Overview of your project lifecycle and current activities.
        </p>
      </div>

      {/* Statistics */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {stat.label}
                  </p>

                  <p className="mt-3 text-3xl font-bold text-slate-900">
                    {stat.value}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-100 p-2.5 text-slate-700">
                  <Icon size={21} />
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-500">
                {stat.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Lifecycle Overview */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-900">
            Lifecycle Overview
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Distribution of projects across the current lifecycle stages.
          </p>
        </div>

        <div className="space-y-4">
          {stageData.map((stage) => {
            const percentage =
              totalProjects > 0
                ? Math.round(
                    (stage.count / totalProjects) * 100
                  )
                : 0;

            return (
              <button
                key={stage.phase}
                type="button"
                onClick={() =>
                  navigate(
                    `/projects?phase=${stage.phase}`
                  )
                }
                className="block w-full rounded-lg p-2 text-left transition hover:bg-slate-50"
              >
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">
                    {stage.name}
                  </span>

                  <span className="text-sm text-slate-500">
                    {stage.count}{" "}
                    {stage.count === 1
                      ? "project"
                      : "projects"}
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-slate-800 transition-all"
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Projects */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-900">
            Recent Projects
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Recently created projects in the system.
          </p>
        </div>

        {recentProjects.length === 0 ? (
          <div className="rounded-lg bg-slate-50 px-4 py-6 text-center">
            <p className="text-sm font-medium text-slate-700">
              No projects available.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {recentProjects.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() =>
                  navigate(`/projects/${project.id}`)
                }
                className="flex w-full items-center justify-between gap-4 px-2 py-4 text-left transition hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {project.projectName}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {project.projectId}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-xs font-medium text-blue-700">
                    {formatPhase(project.phase)}
                  </p>

                  {project.phase === "PRE_PROJECT" &&
                    project.preProjectStage && (
                      <p className="mt-1 text-xs text-slate-500">
                        {project.preProjectStage}
                      </p>
                    )}

                  <p className="mt-1 text-xs text-slate-400">
                    {formatDate(project.createdAt)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;