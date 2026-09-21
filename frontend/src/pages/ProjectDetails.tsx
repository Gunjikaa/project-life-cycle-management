import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

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

const lifecycle = [
  "PROPOSAL",
  "PRE_PROJECT",
  "AON",
  "SANCTION",
  "EXECUTION",
  "MONITORING",
  "CLOSURE",
  "POST_CLOSURE",
];

const preProjectStages = [
  "PRC",
  "TIEC",
  "CEC",
  "CCM",
  "DMC",
];

const phaseOrder = [
  "PROPOSAL",
  "PRE_PROJECT",
  "AON",
  "SANCTION",
  "EXECUTION",
  "MONITORING",
  "CLOSURE",
  "POST_CLOSURE",
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

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
};

const getPhaseIndex = (phase: string) => {
  return phaseOrder.indexOf(phase);
};

const getPreProjectStageIndex = (stage: string) => {
  return preProjectStages.indexOf(stage);
};

function ProjectDetails() {
  const { id } = useParams();

  const [project, setProject] = useState<Project | null>(null);
  const [selectedPhase, setSelectedPhase] = useState("");
  const [selectedPreProjectStage, setSelectedPreProjectStage] =
    useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProject = async () => {
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

        const projects: Project[] = await response.json();

        if (!response.ok) {
          throw new Error("Failed to fetch project.");
        }

        const foundProject = projects.find(
          (item) => item.id === Number(id)
        );

        if (!foundProject) {
          setError("Project not found.");
          return;
        }

        setProject(foundProject);
        setSelectedPhase(foundProject.phase);
        setSelectedPreProjectStage(
          foundProject.preProjectStage || ""
        );
      } catch (error) {
        console.error("Failed to fetch project:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to fetch project."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  const updateLifecycle = async () => {
    if (
      selectedPhase === "PRE_PROJECT" &&
      !selectedPreProjectStage
    ) {
      alert("Please select a Pre-Project Stage.");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/projects/${id}/lifecycle`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            phase: selectedPhase,
            preProjectStage:
              selectedPhase === "PRE_PROJECT"
                ? selectedPreProjectStage
                : null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to update lifecycle.");
        return;
      }

      setProject(data);

      alert("Project lifecycle updated successfully.");
    } catch (error) {
      console.error("Failed to update lifecycle:", error);
      alert("Failed to update lifecycle.");
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-sm text-slate-500">
          Loading project...
        </p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <p className="text-sm font-medium text-red-700">
          {error || "Project not found."}
        </p>
      </div>
    );
  }

  const currentPhaseIndex = getPhaseIndex(project.phase);

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-3xl font-bold text-slate-900">
            {project.projectName}
          </h2>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {project.projectId}
          </span>
        </div>

        <p className="mt-2 text-slate-500">
          Project details and lifecycle information.
        </p>
      </div>

      {/* Project Information */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">
          Project Information
        </h3>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Objective
            </p>

            <p className="mt-1 text-sm leading-6 text-slate-700">
              {project.objective}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Project Director
            </p>

            <p className="mt-1 text-sm font-medium text-slate-800">
              {project.projectDirector}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Concerned Lab
            </p>

            <p className="mt-1 text-sm font-medium text-slate-800">
              {project.concernedLab}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Estimated Cost
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-800">
              {formatCurrency(project.estimatedCost)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Current Phase
            </p>

            <p className="mt-1 text-sm font-semibold text-blue-700">
              {formatPhase(project.phase)}
            </p>
          </div>

          {project.preProjectStage && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Pre-Project Stage
              </p>

              <p className="mt-1 text-sm font-semibold text-blue-700">
                {project.preProjectStage}
              </p>
            </div>
          )}

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Start Date
            </p>

            <p className="mt-1 text-sm font-medium text-slate-800">
              {formatDate(project.startDate)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Completion Date
            </p>

            <p className="mt-1 text-sm font-medium text-slate-800">
              {formatDate(project.completionDate)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Created
            </p>

            <p className="mt-1 text-sm text-slate-700">
              {formatDate(project.createdAt)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Last Updated
            </p>

            <p className="mt-1 text-sm text-slate-700">
              {formatDate(project.updatedAt)}
            </p>
          </div>

          {project.remarks && (
            <div className="md:col-span-2">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Remarks
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-700">
                {project.remarks}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Update Lifecycle */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">
          Update Lifecycle
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Update the project's current lifecycle position.
        </p>

        <div className="mt-5">
          <label className="block text-sm font-medium text-slate-700">
            Project Phase
          </label>

          <select
            value={selectedPhase}
            onChange={(event) =>
              setSelectedPhase(event.target.value)
            }
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
          >
            <option value="">Select Phase</option>

            {lifecycle.map((stage) => (
              <option key={stage} value={stage}>
                {formatPhase(stage)}
              </option>
            ))}
          </select>
        </div>

        {selectedPhase === "PRE_PROJECT" && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700">
              Pre-Project Stage
            </label>

            <select
              value={selectedPreProjectStage}
              onChange={(event) =>
                setSelectedPreProjectStage(event.target.value)
              }
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
            >
              <option value="">Select Stage</option>

              {preProjectStages.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mt-6">
          <button
            type="button"
            onClick={updateLifecycle}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Update Lifecycle
          </button>
        </div>
      </div>

      {/* Project Lifecycle */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">
          Project Lifecycle
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Current position in the project lifecycle.
        </p>

        <div className="mt-6 space-y-4">
          {lifecycle.map((stage) => {
            const stageIndex = getPhaseIndex(stage);

            const isCompleted = stageIndex < currentPhaseIndex;
            const isCurrent = stage === project.phase;

            return (
              <div key={stage}>
                <div className="flex items-center gap-4">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      isCurrent
                        ? "bg-blue-600"
                        : isCompleted
                          ? "bg-green-500"
                          : "bg-slate-300"
                    }`}
                  />

                  <span
                    className={`text-sm ${
                      isCurrent
                        ? "font-semibold text-blue-700"
                        : isCompleted
                          ? "font-medium text-green-700"
                          : "font-medium text-slate-500"
                    }`}
                  >
                    {formatPhase(stage)}
                  </span>
                </div>

                {stage === "PRE_PROJECT" && (
                  <div className="ml-7 mt-3 space-y-3 border-l border-slate-200 pl-5">
                    {preProjectStages.map((subStage) => {
                      const currentPreStageIndex =
                        getPreProjectStageIndex(
                          project.preProjectStage || ""
                        );

                      const subStageIndex =
                        getPreProjectStageIndex(subStage);

                      const isCurrentPreStage =
                        project.phase === "PRE_PROJECT" &&
                        project.preProjectStage === subStage;

                      const isCompletedPreStage =
                        project.phase === "PRE_PROJECT" &&
                        project.preProjectStage &&
                        subStageIndex < currentPreStageIndex;

                      const isPastPreProject =
                        project.phase !== "PRE_PROJECT" &&
                        currentPhaseIndex >
                          getPhaseIndex("PRE_PROJECT");

                      return (
                        <div
                          key={subStage}
                          className="flex items-center gap-3"
                        >
                          <div
                            className={`h-2.5 w-2.5 rounded-full ${
                              isCurrentPreStage
                                ? "bg-blue-600"
                                : isCompletedPreStage ||
                                    isPastPreProject
                                  ? "bg-green-500"
                                  : "bg-slate-300"
                            }`}
                          />

                          <span
                            className={`text-sm ${
                              isCurrentPreStage
                                ? "font-semibold text-blue-700"
                                : isCompletedPreStage ||
                                    isPastPreProject
                                  ? "font-medium text-green-700"
                                  : "text-slate-500"
                            }`}
                          >
                            {subStage}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ProjectDetails;