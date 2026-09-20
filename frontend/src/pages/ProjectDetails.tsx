import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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

const getPhaseIndex = (phase: string) => {
  return phaseOrder.indexOf(phase);
};
const getPreProjectStageIndex = (stage: string) => {
  return preProjectStages.indexOf(stage);
};
function ProjectDetails() {
  const { id } = useParams();
  const [project, setProject] = useState<any>(null);
  const [selectedPhase, setSelectedPhase] = useState("");
const [selectedPreProjectStage, setSelectedPreProjectStage] =
  useState("");

  useEffect(() => {
    const fetchProject = async () => {
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

        const projects = await response.json();

        if (response.ok) {
          const foundProject = projects.find(
            (item: any) => item.id === Number(id)
          );

          setProject(foundProject);
          setSelectedPhase(foundProject.phase);
setSelectedPreProjectStage(
  foundProject.preProjectStage || ""
);
        }
      } catch (error) {
        console.error("Failed to fetch project:", error);
      }
    };

    fetchProject();
  }, [id]);

  if (!project) {
    return <p>Loading project...</p>;
  }
  const updateLifecycle = async () => {
  try {
    const token = localStorage.getItem("token");
    if (
  selectedPhase === "PRE_PROJECT" &&
  !selectedPreProjectStage
) {
  alert("Please select a Pre-Project Stage.");
  return;
}

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
  return (
  <div>
    <div className="mb-8">
      <h2 className="text-3xl font-bold text-slate-900">
        {project.projectName}
      </h2>

      <p className="mt-2 text-slate-500">
        Project ID: {project.projectId}
      </p>
    </div>

    {/* Project Information */}
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">
        Project Information
      </h3>

      <div className="mt-4 space-y-3 text-sm">
        <p>
          <strong>Objective:</strong> {project.objective}
        </p>

        <p>
          <strong>Project Director:</strong>{" "}
          {project.projectDirector}
        </p>

        <p>
          <strong>Concerned Lab:</strong> {project.concernedLab}
        </p>

        <p>
          <strong>Estimated Cost:</strong> ₹
          {project.estimatedCost.toLocaleString()}
        </p>

        <p>
          <strong>Current Phase:</strong> {project.phase}
        </p>

        {project.preProjectStage && (
          <p>
            <strong>Pre-Project Stage:</strong>{" "}
            {project.preProjectStage}
          </p>
        )}
      </div>
    </div>

    {/* Project Lifecycle — ADD IT HERE */}
    {/* Update Lifecycle */}
<div className="mt-6 rounded-xl bg-white p-6 shadow-sm">
  <h3 className="text-lg font-semibold text-slate-900">
    Update Lifecycle
  </h3>

  <div className="mt-4">
    <label className="block text-sm font-medium text-slate-700">
      Project Phase
    </label>

    <select
      value={selectedPhase}
      onChange={(e) => setSelectedPhase(e.target.value)}
      className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
    >
      <option value="">Select Phase</option>

      {lifecycle.map((stage) => (
        <option key={stage} value={stage}>
          {stage.replaceAll("_", " ")}
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
      onChange={(e) =>
        setSelectedPreProjectStage(e.target.value)
      }
      className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
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
    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
  >
    Update Lifecycle
  </button>
</div>
</div>
    <div className="mt-6 rounded-xl bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">
        Project Lifecycle
      </h3>

      <div className="mt-6 space-y-4">
        {lifecycle.map((stage) => {
  const currentIndex = getPhaseIndex(project.phase);
  const stageIndex = getPhaseIndex(stage);

  const isCompleted = stageIndex < currentIndex;
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
          stage === project.phase
            ? "font-semibold text-blue-700"
            : "font-medium text-slate-600"
        }`}
      >
        {stage.replaceAll("_", " ")}
      </span>
    </div>

    {stage === "PRE_PROJECT" && (
      <div className="ml-7 mt-3 space-y-3 border-l border-slate-200 pl-5">
        {preProjectStages.map((subStage) => (
          <div
            key={subStage}
            className="flex items-center gap-3"
          >
            <div
  className={`h-2.5 w-2.5 rounded-full ${
    project.phase === "PRE_PROJECT" &&
    project.preProjectStage === subStage
      ? "bg-blue-600"
      : project.phase === "PRE_PROJECT" &&
        project.preProjectStage &&
        getPreProjectStageIndex(subStage) <
          getPreProjectStageIndex(project.preProjectStage)
      ? "bg-green-500"
      : project.phase !== "PRE_PROJECT" &&
        getPhaseIndex(project.phase) > getPhaseIndex("PRE_PROJECT")
      ? "bg-green-500"
      : "bg-slate-300"
  }`}
/>

            <span
  className={`text-sm ${
    project.phase === "PRE_PROJECT" &&
    project.preProjectStage === subStage
      ? "font-semibold text-blue-700"
      : project.phase === "PRE_PROJECT" &&
        project.preProjectStage &&
        getPreProjectStageIndex(subStage) <
          getPreProjectStageIndex(project.preProjectStage)
      ? "font-medium text-green-700"
      : project.phase !== "PRE_PROJECT" &&
        getPhaseIndex(project.phase) > getPhaseIndex("PRE_PROJECT")
      ? "font-medium text-green-700"
      : "text-slate-500"
  }`}
>
  {subStage}
</span>
          </div>
        ))}
      </div>
    )}
  </div>);
})}
      </div>
    </div>

  </div>
);
}

export default ProjectDetails;