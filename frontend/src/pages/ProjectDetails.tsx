import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../services/api";
import EvaluationClosurePanel from "../components/project/EvaluationClosurePanel";
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

interface Approval {
  id: number;
  decision: string;
  remarks?: string | null;
  decidedAt?: string | null;
  approverId: number;
}
interface ActivityDocument {
  id: number;
  fileName: string;
  fileSize: number | null;
  createdAt: string;
}

interface WorkflowActivity {
  id: number;
  activityType: string;
  status: string;
  remarks?: string | null;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  approvals?: Approval[];
  documents?: ActivityDocument[];
}
interface ProjectReview {
  id: number;
  projectId: number;
  reviewType: "PMRB" | "EB";
  scheduledAt: string;
  completedAt: string | null;
  status: string;
  displayStatus?: string;
  remarks: string | null;
}

const formatActivityName = (value: string) => {
  const labels: Record<string, string> = {
    FORECAST: "Forecast",
    CCM: "CCM",
    TIEC: "TIEC",
    CEC: "CEC",
    AON: "AoN",
    SOC: "SoC",
    COSTING: "Costing",
    ADDIFA_CONCURRENCE: "AddIFA Concurrence",
    SECRETARY_SANCTION: "Secretary DDR&D Sanction",
    GL_ISSUE: "GL Issue",
    PROJECT_SANCTION: "Project Sanction",
    PROCUREMENT: "Procurement",
    MONITORING_REVIEW: "Monitoring & Review",
    PMRB_REVIEW: "PMRB Review",
    EB_REVIEW: "EB Review",
    INDEPENDENT_EVALUATION: "Independent Evaluation",
    TECHNICAL_CLOSURE: "Technical Closure",
    ADMINISTRATIVE_CLOSURE: "Administrative Closure",
    TS_FINANCIAL_CLOSURE: "TS / Financial Closure",
    CDA_SUBMISSION: "CDA Submission",
    CFA_APPROVAL: "CFA Approval",
    PENDING: "Pending",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
    RETURNED: "Returned",
    APPROVED: "Approved",
    REJECTED: "Rejected",
  };

  return labels[value] ?? value
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
};
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

const getStoredUserRole = () => {
  try {
    const storedUser = localStorage.getItem("user");
    return storedUser ? String(JSON.parse(storedUser).role || "") : "";
  } catch {
    return "";
  }
};
const downloadDocument = async (
  documentId: number,
  fileName: string
) => {
  try {
    const response = await apiFetch(
  `/api/documents/${documentId}/download`,
  {},
  true
);

    if (!response.ok) {
      throw new Error("Failed to download document.");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error(error);
    alert("Could not download the document. Please try again.");
  }
};

function ProjectDetails() {
  const { id } = useParams();

  const [project, setProject] = useState<Project | null>(null);
  const [selectedPhase, setSelectedPhase] = useState("");
  const [selectedPreProjectStage, setSelectedPreProjectStage] =
    useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activities, setActivities] = useState<WorkflowActivity[]>([]);
const [activitiesLoading, setActivitiesLoading] = useState(true);
const [activitiesError, setActivitiesError] = useState("");
const [newActivityType, setNewActivityType] = useState("FORECAST");
const [newActivityRemarks, setNewActivityRemarks] = useState("");
const [creatingActivity, setCreatingActivity] = useState(false);
const [reviews, setReviews] = useState<ProjectReview[]>([]);
const [reviewsLoading, setReviewsLoading] = useState(true);
const [newReviewType, setNewReviewType] = useState<"PMRB" | "EB">("PMRB");
const [newReviewDate, setNewReviewDate] = useState("");
const [newReviewRemarks, setNewReviewRemarks] = useState("");
const [creatingReview, setCreatingReview] = useState(false);
const [uploadingActivityId, setUploadingActivityId] = useState<number | null>(null);
const currentUserRole = getStoredUserRole();
const canManageWorkflow =
  currentUserRole === "ADMIN" || currentUserRole === "PROJECT_DIRECTOR";
const canReview =
  currentUserRole === "ADMIN" || currentUserRole === "REVIEWER";

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        setError("");

        const foundProject = await apiFetch<Project>(
          `/api/projects/${id}`
        );

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
useEffect(() => {
  if (!id) return;

  const fetchActivities = async () => {
    try {
      setActivitiesLoading(true);
      setActivitiesError("");

      const data = await apiFetch(
        `/api/projects/${id}/activities`
      );

      setActivities(data);
    } catch (error) {
      console.error("Failed to fetch activities:", error);

      setActivitiesError(
        error instanceof Error
          ? error.message
          : "Failed to fetch workflow activities."
      );
    } finally {
      setActivitiesLoading(false);
    }
  };

  fetchActivities();
}, [id]);

const createActivity = async () => {
  if (!id) return;

  try {
    setCreatingActivity(true);

    await apiFetch(`/api/projects/${id}/activities`, {
      method: "POST",
      body: JSON.stringify({
        activityType: newActivityType,
        remarks: newActivityRemarks.trim() || undefined,
      }),
    });

    const updatedActivities = await apiFetch(
      `/api/projects/${id}/activities`
    );

    setActivities(updatedActivities);
    setNewActivityRemarks("");
    setActivitiesError("");
  } catch (error) {
    console.error("Failed to create activity:", error);

    setActivitiesError(
      error instanceof Error
        ? error.message
        : "Failed to create workflow activity."
    );
  } finally {
    setCreatingActivity(false);
  }
};
const fetchReviews = useCallback(async () => {
  if (!id) return;

  try {
    const data = await apiFetch<ProjectReview[]>(
      `/api/projects/${id}/reviews`
    );
    setReviews(data);
  } catch (error) {
    console.error("Failed to fetch reviews:", error);
  }
}, [id]);
useEffect(() => {
  if (!id) return;

  let cancelled = false;

  const loadReviews = async () => {
    try {
      const data = await apiFetch<ProjectReview[]>(
        `/api/projects/${id}/reviews`
      );

      if (!cancelled) {
        setReviews(data);
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      if (!cancelled) {
        setReviewsLoading(false);
      }
    }
  };

  void loadReviews();

  return () => {
    cancelled = true;
  };
}, [id]);
const scheduleReview = async () => {
  if (!id || !newReviewDate) {
    alert("Please select a review date.");
    return;
  }

  try {
    setCreatingReview(true);

    await apiFetch(`/api/projects/${id}/reviews`, {
      method: "POST",
      body: JSON.stringify({
        reviewType: newReviewType,
        scheduledAt: new Date(`${newReviewDate}T12:00:00`).toISOString(),
        remarks: newReviewRemarks,
      }),
    });

    setNewReviewDate("");
    setNewReviewRemarks("");
    await fetchReviews();
  } catch (error) {
    console.error("Failed to schedule review:", error);
    alert("Could not schedule the review.");
  } finally {
    setCreatingReview(false);
  }
};
const completeReview = async (reviewId: number) => {
  if (!id) return;

  try {
    await apiFetch(
      `/api/projects/${id}/reviews/${reviewId}/complete`,
      {
        method: "PATCH",
        body: JSON.stringify({}),
      }
    );

    await fetchReviews();
  } catch (error) {
    console.error("Failed to complete review:", error);
    alert("Could not complete the review.");
  }
};
const updateActivityStatus = async (
  activityId: number,
  status: string
) => {
  if (!id) return;

  try {
    await apiFetch(
      `/api/projects/${id}/activities/${activityId}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }
    );

    const updatedActivities = await apiFetch(
      `/api/projects/${id}/activities`
    );

    setActivities(updatedActivities);
    setActivitiesError("");
  } catch (error) {
    console.error("Failed to update activity status:", error);

    setActivitiesError(
      error instanceof Error
        ? error.message
        : "Failed to update activity status."
    );
  }
};


const submitApproval = async (
  activityId: number,
  decision: string,
  remarks: string
) => {
  if (!id) return;

  try {
    await apiFetch(
      `/api/projects/${id}/activities/${activityId}/approvals`,
      {
        method: "POST",
        body: JSON.stringify({
          decision,
          remarks: remarks.trim() || undefined,
        }),
      }
    );

    const updatedActivities = await apiFetch(
      `/api/projects/${id}/activities`
    );

    setActivities(updatedActivities);
    setActivitiesError("");
  } catch (error) {
    console.error("Failed to submit approval:", error);

    setActivitiesError(
      error instanceof Error
        ? error.message
        : "Failed to submit approval."
    );
  }
};

const uploadDocument = async (
  activityId: number,
  event: FormEvent<HTMLFormElement>
) => {
  event.preventDefault();

  if (!id) return;

  const form = event.currentTarget;
  const formData = new FormData(form);
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    setActivitiesError("Please select a document to upload.");
    return;
  }

  try {
    setUploadingActivityId(activityId);
    setActivitiesError("");

    await apiFetch(
      `/api/projects/${id}/activities/${activityId}/documents`,
      {
        method: "POST",
        body: formData,
      }
    );

    const updatedActivities = await apiFetch<WorkflowActivity[]>(
      `/api/projects/${id}/activities`
    );

    setActivities(updatedActivities);
    form.reset();
  } catch (error) {
    console.error("Failed to upload document:", error);
    setActivitiesError(
      error instanceof Error ? error.message : "Failed to upload document."
    );
  } finally {
    setUploadingActivityId(null);
  }
};

useEffect(() => {
  if (loading || !window.location.hash) return;

  const timer = window.setTimeout(() => {
    document
      .querySelector(window.location.hash)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 0);

  return () => window.clearTimeout(timer);
}, [loading]);

  const updateLifecycle = async () => {
    if (
      selectedPhase === "PRE_PROJECT" &&
      !selectedPreProjectStage
    ) {
      alert("Please select a Pre-Project Stage.");
      return;
    }

    try {
      const data = await apiFetch(
  `/api/projects/${id}/lifecycle`,
  {
    method: "PATCH",
    body: JSON.stringify({
      phase: selectedPhase,
      preProjectStage:
        selectedPhase === "PRE_PROJECT"
          ? selectedPreProjectStage
          : null,
    }),
  }
);

setProject(data);

      alert("Project lifecycle updated successfully.");
    }  catch (error) {
  console.error("Failed to update lifecycle:", error);

  alert(
    error instanceof Error
      ? error.message
      : "Failed to update lifecycle."
  );
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
      {canManageWorkflow && (
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
      )}

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
  
{/* Review Calendar */}
<div id="review-calendar" className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
  <h3 className="text-lg font-semibold text-slate-900">
    Review Calendar
  </h3>

  <p className="mt-1 text-sm text-slate-500">
    PMRB reviews are planned quarterly and EB reviews every six months.
  </p>

  {reviewsLoading ? (
    <p className="mt-4 text-sm text-slate-500">Loading reviews...</p>
  ) : reviews.length === 0 ? (
    <p className="mt-4 text-sm text-slate-500">
      No reviews scheduled for this project yet.
    </p>
  ) : (
    <div className="mt-4 space-y-3">
      {reviews.map((review) => (
        <div
          key={review.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-4"
        >
          <div>
            <p className="font-medium text-slate-900">
              {review.reviewType} Review
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Scheduled: {formatDate(review.scheduledAt)}
            </p>
            {review.remarks && (
              <p className="mt-1 text-sm text-slate-500">
                {review.remarks}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${
              review.displayStatus === "COMPLETED"
                ? "bg-green-50 text-green-700"
                : review.displayStatus === "DELAYED"
                  ? "bg-red-50 text-red-700"
                  : "bg-amber-50 text-amber-700"
            }`}>
              {review.displayStatus ?? review.status}
            </span>
            {canReview &&
  review.displayStatus !== "COMPLETED" &&
  review.status !== "COMPLETED" && (
    <button
      type="button"
      onClick={() => completeReview(review.id)}
      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
    >
      Mark Completed
    </button>
  )}
          </div>
        </div>
      ))}
    </div>
  )}

  {canManageWorkflow && (
  <div className="mt-6 border-t border-slate-100 pt-5">
    <h4 className="font-semibold text-slate-900">Schedule a Review</h4>

    <div className="mt-3 grid gap-4 md:grid-cols-2">
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Review Type
        </label>
        <select
          value={newReviewType}
          onChange={(event) =>
            setNewReviewType(event.target.value as "PMRB" | "EB")
          }
          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
        >
          <option value="PMRB">PMRB — Quarterly</option>
          <option value="EB">EB — Every six months</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Scheduled Date
        </label>
        <input
          type="date"
          value={newReviewDate}
          onChange={(event) => setNewReviewDate(event.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
        />
      </div>
    </div>

    <div className="mt-4">
      <label className="block text-sm font-medium text-slate-700">
        Remarks (optional)
      </label>
      <textarea
        value={newReviewRemarks}
        onChange={(event) => setNewReviewRemarks(event.target.value)}
        rows={2}
        placeholder="Enter review details"
        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
      />
    </div>

    <button
      type="button"
      onClick={scheduleReview}
      disabled={creatingReview}
      className="mt-4 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
    >
      {creatingReview ? "Scheduling..." : "Schedule Review"}
    </button>
  </div>
  )}
</div>

<div id="evaluation-closure">
<EvaluationClosurePanel
  project={project}
  activities={activities}
  reviews={reviews}
  canManageWorkflow={canManageWorkflow}
  canReview={canReview}
/>
</div>
    
{/* Workflow Activities */}
<div id="workflow-activities" className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
  <h3 className="text-lg font-semibold text-slate-900">
    Workflow Activities
  </h3>

  <p className="mt-1 text-sm text-slate-500">
    Activity records associated with this project.
  </p>

  {activitiesLoading ? (
    <p className="mt-5 text-sm text-slate-500">
      Loading activities...
    </p>
  ) : activitiesError ? (
    <p className="mt-5 text-sm text-red-600">
      {activitiesError}
    </p>
  ) : activities.length === 0 ? (
    <p className="mt-5 text-sm text-slate-500">
      No workflow activities recorded yet.
    </p>
  ) : (
    <div className="mt-5 space-y-4">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="rounded-lg border border-slate-200 p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 className="font-medium text-slate-900">
              {formatActivityName(activity.activityType)}
            </h4>

            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
  {formatActivityName(activity.status)}
</span>

{canManageWorkflow && (
<select
  value={activity.status}
  onChange={(event) =>
    updateActivityStatus(activity.id, event.target.value)
  }
  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
>
  <option value="PENDING">Pending</option>
  <option value="IN_PROGRESS">In Progress</option>
  <option value="COMPLETED">Completed</option>
  <option value="RETURNED">Returned</option>
</select>
)}

          </div>

          {activity.remarks && (
            <p className="mt-2 text-sm text-slate-600">
              {activity.remarks}
            </p>
          )}

          <p className="mt-2 text-xs text-slate-400">
            Created: {formatDate(activity.createdAt)}
          </p>
          
<div className="mt-4 border-t border-slate-100 pt-4">
  <h5 className="text-sm font-semibold text-slate-800">
    Approval History
  </h5>

  {activity.approvals && activity.approvals.length > 0 ? (
    <div className="mt-2 space-y-2">
      {activity.approvals.map((approval) => (
        <div
          key={approval.id}
          className="rounded-lg bg-slate-50 p-3"
        >
          <p className="text-sm font-medium text-slate-800">
            {formatActivityName(approval.decision)}
          </p>

          {approval.remarks && (
            <p className="mt-1 text-sm text-slate-600">
              {approval.remarks}
            </p>
          )}

          {approval.decidedAt && (
            <p className="mt-1 text-xs text-slate-400">
              {formatDate(approval.decidedAt)}
            </p>
          )}
        </div>
      ))}
    </div>
  ) : (
    <p className="mt-2 text-sm text-slate-500">
      No approval decisions recorded.
    </p>
  )}

</div>
<div className="mt-4 border-t border-slate-100 pt-4">
  <h5 className="text-sm font-semibold text-slate-800">
    Documents
  </h5>

  {activity.documents && activity.documents.length > 0 ? (
    <div className="mt-2 space-y-2">
      {activity.documents.map((document) => (
        <div
          key={document.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 p-3"
        >
          <div>
            <p className="text-sm font-medium text-slate-800">
              {document.fileName}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Uploaded: {formatDate(document.createdAt)}
              {document.fileSize != null &&
                ` · ${(document.fileSize / 1024).toFixed(1)} KB`}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
  downloadDocument(document.id, document.fileName)
}
            className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"
          >
            Download
          </button>
        </div>
      ))}
    </div>
  ) : (
    <p className="mt-2 text-sm text-slate-500">
      No documents uploaded for this activity.
    </p>
  )}

  {canManageWorkflow && (
    <form
      className="mt-3 space-y-3 rounded-lg border border-dashed border-slate-300 p-3"
      onSubmit={(event) => void uploadDocument(activity.id, event)}
    >
      <input
        type="file"
        name="file"
        required
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700"
      />
      <input
        type="text"
        name="description"
        placeholder="Document description (optional)"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={uploadingActivityId === activity.id}
        className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-medium text-white hover:bg-slate-900 disabled:opacity-60"
      >
        {uploadingActivityId === activity.id ? "Uploading..." : "Upload Document"}
      </button>
    </form>
  )}
</div>
{canReview && (
<div className="mt-4 border-t border-slate-100 pt-4">
  <h5 className="text-sm font-semibold text-slate-800">
    Record Approval Decision
  </h5>

  <form
    className="mt-3 space-y-3"
    onSubmit={(event) => {
      event.preventDefault();

      const form = event.currentTarget;
      const formData = new FormData(form);

      void submitApproval(
        activity.id,
        String(formData.get("decision")),
        String(formData.get("remarks") || "")
      );

      form.reset();
    }}
  >
    <select
      name="decision"
      defaultValue="APPROVED"
      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
    >
      <option value="APPROVED">Approved</option>
      <option value="REJECTED">Rejected</option>
      <option value="RETURNED">Returned</option>
    </select>

    <textarea
      name="remarks"
      rows={2}
      placeholder="Enter decision remarks (optional)"
      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
    />

    <button
      type="submit"
      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
    >
      Submit Decision
    </button>
  </form>
</div>
)}

        </div>
      ))}
    </div>
  )}

</div>

{canManageWorkflow && (
<div>
<div className="mt-5 grid gap-4 md:grid-cols-2">
  <div>
    <label className="block text-sm font-medium text-slate-700">
      Activity Type
    </label>

    <select
      value={newActivityType}
      onChange={(event) => setNewActivityType(event.target.value)}
      className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
    >
      <option value="FORECAST">Forecast</option>
      <option value="CCM">CCM</option>
      <option value="TIEC">TIEC</option>
      <option value="CEC">CEC</option>
      <option value="AON">AoN</option>
      <option value="SOC">SoC</option>
      <option value="COSTING">Costing</option>
      <option value="ADDIFA_CONCURRENCE">AddIFA Concurrence</option>
      <option value="SECRETARY_SANCTION">Secretary Sanction</option>
      <option value="GL_ISSUE">GL Issue</option>
      <option value="PROJECT_SANCTION">Project Sanction</option>
      <option value="PROCUREMENT">Procurement</option>
      <option value="MONITORING_REVIEW">Monitoring & Review</option>
<option value="PMRB_REVIEW">PMRB Review</option>
<option value="EB_REVIEW">EB Review</option>
<option value="INDEPENDENT_EVALUATION">
  Independent Evaluation
</option>
<option value="TECHNICAL_CLOSURE">Technical Closure</option>
<option value="ADMINISTRATIVE_CLOSURE">
  Administrative Closure
</option>
<option value="TS_FINANCIAL_CLOSURE">
  TS / Financial Closure
</option>
<option value="CDA_SUBMISSION">CDA Submission</option>
<option value="CFA_APPROVAL">CFA Approval</option>
    </select>
  </div>

  <div>
    <label className="block text-sm font-medium text-slate-700">
      Remarks (optional)
    </label>

    <input
      type="text"
      value={newActivityRemarks}
      onChange={(event) => setNewActivityRemarks(event.target.value)}
      placeholder="Enter activity remarks"
      className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
    />
  </div>
</div>

<button
  type="button"
  onClick={createActivity}
  disabled={creatingActivity}
  className="mt-4 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
>
  {creatingActivity ? "Creating..." : "Create Activity"}
</button>
</div>
)}

    </div>
  );
}

export default ProjectDetails;
