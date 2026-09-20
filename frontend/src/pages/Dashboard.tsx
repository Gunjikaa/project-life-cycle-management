import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  FolderKanban,
  ListTodo,
} from "lucide-react";

const stats = [
  {
    label: "Total Projects",
    value: "42",
    description: "All registered projects",
    icon: FolderKanban,
  },
  {
    label: "Active Projects",
    value: "27",
    description: "Currently in progress",
    icon: Clock3,
  },
  {
    label: "Pending Actions",
    value: "8",
    description: "Require attention",
    icon: ListTodo,
  },
  {
    label: "Completed Projects",
    value: "15",
    description: "Successfully completed",
    icon: CheckCircle2,
  },
];
const lifecycleStages = [
  { name: "Proposal", count: 8 },
  { name: "Pre-Project", count: 5 },
  { name: "PRC", count: 4 },
  { name: "Technical Evaluation", count: 6 },
  { name: "DMC", count: 3 },
  { name: "AON", count: 4 },
  { name: "IFA", count: 2 },
  { name: "CFA", count: 1 },
  { name: "Sanction", count: 2 },
  { name: "Execution", count: 7 },
  { name: "Monitoring", count: 3 },
  { name: "Closure", count: 1 },
  { name: "Post-Closure", count: 1 },
];


function Dashboard() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

        if (response.ok) {
          setProjects(data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard projects:", error);
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

  const lifecycleStages = [
    { name: "Proposal", phase: "PROPOSAL" },
    { name: "Pre-Project", phase: "PRE_PROJECT" },
    { name: "AoN", phase: "AON" },
    { name: "Sanction", phase: "SANCTION" },
    { name: "Execution", phase: "EXECUTION" },
    { name: "Monitoring", phase: "MONITORING" },
    { name: "Closure", phase: "CLOSURE" },
    { name: "Post-Closure", phase: "POST_CLOSURE" },
  ].map((stage) => ({
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

  if (loading) {
    return <p>Loading dashboard...</p>;
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">
          Dashboard
        </h2>

        <p className="mt-2 text-slate-500">
          Overview of your project lifecycle and current activities.
        </p>
      </div>

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
    {lifecycleStages.map((stage) => {
      const percentage =
  totalProjects > 0
    ? Math.round((stage.count / totalProjects) * 100)
    : 0;

      return (
        <div key={stage.name}>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">
              {stage.name}
            </span>

            <span className="text-sm text-slate-500">
              {stage.count} {stage.count === 1 ? "project" : "projects"}
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-slate-800 transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      );
    })}
  </div>
</div>
    
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-900">
            Current Activity
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Recent updates across your projects.
          </p>
        </div>

        <div className="rounded-lg bg-slate-50 px-4 py-6 text-center">
  <p className="text-sm font-medium text-slate-700">
    No recent activity available.
  </p>

  <p className="mt-1 text-xs text-slate-500">
    Activity tracking will be available when lifecycle actions are recorded.
  </p>
</div>
      </div>
    </div>
  );
}

export default Dashboard;