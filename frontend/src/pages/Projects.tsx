import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
interface Project {
  id: number;
  projectId: string;
  projectName: string;
  objective: string;
  projectDirector: string;
  concernedLab: string;
  estimatedCost: number;
  startDate: string;
  completionDate: string;
  remarks?: string | null;
  phase: string;
  preProjectStage?: string | null;
  createdAt: string;
  updatedAt: string;
}

const lifecyclePhases = [
  { value: "ALL", label: "All Phases" },
  { value: "PROPOSAL", label: "Proposal" },
  { value: "PRE_PROJECT", label: "Pre-Project" },
  { value: "AON", label: "AoN" },
  { value: "SANCTION", label: "Sanction" },
  { value: "EXECUTION", label: "Execution" },
  { value: "MONITORING", label: "Monitoring" },
  { value: "CLOSURE", label: "Closure" },
  { value: "POST_CLOSURE", label: "Post-Closure" },
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

const getStatus = (phase: string) => {
  if (phase === "CLOSURE") {
    return "Closing";
  }

  if (phase === "POST_CLOSURE") {
    return "Completed";
  }

  return "Active";
};

function Projects() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [selectedPhase, setSelectedPhase] = useState(
    searchParams.get("phase") || "ALL"
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError("");

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
        console.error("Failed to fetch projects:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to fetch projects."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesSearch =
        !searchText ||
        project.projectId.toLowerCase().includes(searchText) ||
        project.projectName.toLowerCase().includes(searchText);

      const matchesPhase =
        selectedPhase === "ALL" ||
        project.phase === selectedPhase;

      return matchesSearch && matchesPhase;
    });
  }, [projects, search, selectedPhase]);

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">
          All Projects
        </h2>

        <p className="mt-2 text-slate-500">
          View and manage projects across their lifecycle.
        </p>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Search Projects
            </label>

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by project name or ID..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Lifecycle Phase
            </label>

            <select
              value={selectedPhase}
              onChange={(event) =>
                setSelectedPhase(event.target.value)
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
            >
              {lifecyclePhases.map((phase) => (
                <option
                  key={phase.value}
                  value={phase.value}
                >
                  {phase.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm text-slate-500">
            Loading projects...
          </p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm font-medium text-red-700">
            {error}
          </p>
        </div>
      )}

      {/* Projects */}
      {!loading && !error && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-700">
                {filteredProjects.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-700">
                {projects.length}
              </span>{" "}
              projects
            </p>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-medium text-slate-700">
                No projects found.
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Try changing your search or lifecycle filter.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredProjects.map((project) => {
                const status = getStatus(project.phase);

                return (
                  <div
                    key={project.id}
                    className="flex flex-col gap-4 px-6 py-5 transition hover:bg-slate-50 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-base font-semibold text-slate-900">
                          {project.projectName}
                        </h3>

                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          {project.projectId}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                        <span>
                          Phase:{" "}
                          <span className="font-medium text-slate-700">
                            {formatPhase(project.phase)}
                          </span>
                        </span>

                        {project.phase === "PRE_PROJECT" &&
                          project.preProjectStage && (
                            <span>
                              Stage:{" "}
                              <span className="font-medium text-slate-700">
                                {project.preProjectStage}
                              </span>
                            </span>
                          )}

                        <span>
                          Lab:{" "}
                          <span className="font-medium text-slate-700">
                            {project.concernedLab}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          status === "Completed"
                            ? "bg-green-100 text-green-700"
                            : status === "Closing"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {status}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/projects/${project.id}`)
                        }
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                      >
                        View
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Projects;