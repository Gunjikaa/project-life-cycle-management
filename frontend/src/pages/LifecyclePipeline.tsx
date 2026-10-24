import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
const preProjectStages = [
  "PRC",
  "TIEC",
  "CEC",
  "CCM",
  "DMC",
];
const lifecycleStages = [
  { label: "Proposal", phase: "PROPOSAL" },
  { label: "Pre-Project", phase: "PRE_PROJECT" },
  { label: "AoN", phase: "AON" },
  { label: "Sanction", phase: "SANCTION" },
  { label: "Execution", phase: "EXECUTION" },
  { label: "Monitoring", phase: "MONITORING" },
  { label: "Closure", phase: "CLOSURE" },
  { label: "Post-Closure", phase: "POST_CLOSURE" },
];

function LifecyclePipeline() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/projects`,
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
        console.error("Failed to fetch lifecycle projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (loading) {
    return <p>Loading lifecycle pipeline...</p>;
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">
          Lifecycle Pipeline
        </h2>

        <p className="mt-2 text-slate-500">
          View projects across the current project lifecycle stages.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        {lifecycleStages.map((stage) => {
          const stageProjects = projects.filter(
            (project) => project.phase === stage.phase
          );

          return (
  <div
    key={stage.phase}
    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
  >
    <div className="mb-4 flex items-center justify-between">
      <h3 className="font-semibold text-slate-900">
        {stage.label}
      </h3>

      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
        {stageProjects.length}
      </span>
    </div>

    {stage.phase === "PRE_PROJECT" ? (
      <div className="space-y-4">
        {preProjectStages.map((preStage) => {
          const preStageProjects = projects.filter(
            (project) =>
              project.phase === "PRE_PROJECT" &&
              project.preProjectStage === preStage
          );

          return (
            <div key={preStage}>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {preStage}
                </p>

                <span className="text-xs font-medium text-slate-400">
                  {preStageProjects.length}
                </span>
              </div>

              <div className="space-y-2">
                {preStageProjects.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    No projects
                  </p>
                ) : (
                  preStageProjects.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() =>
                        navigate(`/projects/${project.id}`)
                      }
                      className="w-full rounded-lg border border-slate-200 p-3 text-left transition hover:bg-slate-50"
                    >
                      <p className="text-sm font-medium text-slate-900">
                        {project.projectName}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {project.projectId}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    ) : (
      <div className="space-y-3">
        {stageProjects.length === 0 ? (
          <p className="text-sm text-slate-400">
            No projects
          </p>
        ) : (
          stageProjects.map((project) => (
            <button
              key={project.id}
              type="button"
              onClick={() =>
                navigate(`/projects/${project.id}`)
              }
              className="w-full rounded-lg border border-slate-200 p-3 text-left transition hover:bg-slate-50"
            >
              <p className="text-sm font-medium text-slate-900">
                {project.projectName}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {project.projectId}
              </p>
            </button>
          ))
        )}
      </div>
    )}
  </div>
);
        })}
      </div>
    </div>
  );
}

export default LifecyclePipeline;